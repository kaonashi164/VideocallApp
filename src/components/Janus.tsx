/// <reference path="../../index.d.ts" />
import React, {useState, useEffect, useContext} from 'react';
import {Alert, AppState} from 'react-native';
import InCallManager from 'react-native-incall-manager';
import {useMutation} from '@apollo/react-hooks';

import {Janus} from '@base';
import {JANUS_PLUGIN, JANUS_SERVER} from '@constants';
import {UpcomingCall} from './UpcomingCall';
import {GlobalCTX, AuthCTX} from '@context';
import {randomString, returnConfirm} from '@utils';
import {VideoJanus} from './Video';
import {
  M_REFUSE_CALL,
  M_CANCEL_CALL,
  M_ACCEPT_CALL,
  M_END_CALL,
} from '@graphql';

Janus.init({
  debug: true,
});

let videocall;
let opaqueId = `videocalltest-${randomString(12)}`;
let timeoutCall;
let jsepCustom;

export const JanusServer = () => {
  //*__: Variables
  let janus: Janus;

  //*__: Hooks
  const [state, setState] = useState({
    incomingcall: false,
    myURL: '',
    remoteURL: '',
    appState: AppState.currentState,
    callFromMe: false,
    calling: false,
    isVideoCall: false,
    isAudioOn: true,
    isCameraOn: true,
  });
  const {globalDispatch, globalState} = useContext(GlobalCTX);
  const {state: AuthState} = useContext(AuthCTX);
  const [refuseCall] = useMutation(M_REFUSE_CALL);
  const [cancelCall] = useMutation(M_CANCEL_CALL);
  const [acceptCall] = useMutation(M_ACCEPT_CALL);
  const [endCall] = useMutation(M_END_CALL);

  useEffect(() => {
    if (!janus && AuthState!.user) {
      _janusStart();
    }
    globalDispatch!({
      type: 'SET_STATE',
      doCall: _doCall,
    });
  }, [AuthState]);

  //*__: Functions
  //*_: API Janus
  const _janusStart = () => {
    janus = new Janus({
      server: JANUS_SERVER,
      success: _joinServerSuccess,
      error: _onServerError,
    });
  };

  //*: Join server
  const _joinServerSuccess = () => {
    janus.attach({
      plugin: JANUS_PLUGIN.videocall,
      opaqueId,
      success: _attachVideoCallSuccess,
      error: _attachVideoCallError,
      consentDialog: _consentDialog,
      mediaState: _mediaState,
      webrtcState: _webrtcState,
      onmessage: _onmessage,
      onlocalstream: _onlocalstream,
      onremotestream: _onremotestream,
      ondataopen: () => {
        console.log('The DataChannel is available!');
      },
      ondata: data => {
        console.log('We got data from the DataChannel! ' + data);
      },
      oncleanup: () => {
        console.log(' ::: Got a cleanup notification :::');
      },
    });
  };

  //*: Join server fail
  const _onServerError = error => console.log(error);

  //*: Attach plugin video call success
  const _attachVideoCallSuccess = pluginHandle => {
    videocall = pluginHandle;
    let register = {
      request: 'register',
      username: AuthState!.user.username,
    };
    videocall.send({message: register});
  };

  //*: Attach plugin video call support
  const _attachVideoCallError = error =>
    Alert.alert('  -- Error attaching plugin...', error);

  const _consentDialog = on =>
    console.log('Janus ' + (on ? 'started' : 'stopped') + ' consentDialog ');

  const _mediaState = (state: {type: 'audio' | 'video'; on: boolean}) =>
    console.log(
      'Janus ' +
        (state.on ? 'started' : 'stopped') +
        ' receiving our ' +
        state.type,
    );

  const _webrtcState = on =>
    console.log(
      'Janus says our WebRTC PeerConnection is ' +
        (on ? 'up' : 'down') +
        ' now',
    );

  const _onmessage = (msg, jsep) => {
    console.log(' ::: Got a message :::');
    jsepCustom = jsep;

    var result = msg['result'];

    if (result) {
      if (result['list']) {
        let list = result['list'];
        console.log('Got a list of registered peers:');
        console.log(list);
      } else if (result['event']) {
        let event = result['event'];
        switch (event) {
          case 'registered': {
            videocall.send({
              message: {
                request: 'list',
              },
            });
            break;
          }

          case 'calling': {
            console.log('Waiting for the peer to answer...');
            break;
          }

          case 'incomingcall': {
            console.log('Incoming call from ' + result['username'] + '!');
            InCallManager.startRingtone('_BUNDLE_');
            setState(prev => ({...prev, incomingcall: true}));
            break;
          }

          case 'accepted': {
            InCallManager.stopRingtone();
            InCallManager.start();
            InCallManager.setForceSpeakerphoneOn(true);
            var peer = result['username'];
            if (peer) {
              console.log('Call started!');
            } else {
              console.log(peer + ' accepted the call!');
            }
            // Video call can start
            if (jsep)
              videocall.handleRemoteJsep({
                jsep: jsep,
              });
            setState(prev => ({
              ...prev,
              incomingcall: false,
              callFromMe: false,
              calling: true,
            }));
            clearTimeout(timeoutCall);
            break;
          }

          case 'update': {
            if (jsep) {
              if (jsep.type === 'answer') {
                videocall.handleRemoteJsep({
                  jsep: jsep,
                });
              } else {
                videocall.createAnswer({
                  jsep: jsep,
                  media: {
                    data: true,
                  }, // Let's negotiate data channels as well
                  success: jsep => {
                    console.log('Got SDP!');
                    let body = {
                      request: 'set',
                    };
                    videocall.send({
                      message: body,
                      jsep: jsep,
                    });
                  },
                  error: error => {
                    console.log('WebRTC error:', error);
                  },
                });
              }
            }
            InCallManager.stopRingtone();
            InCallManager.start({media: 'audio'});
            InCallManager.setForceSpeakerphoneOn(true);
            clearTimeout(timeoutCall);
            break;
          }

          case 'hangup': {
            InCallManager.stopRingtone();
            InCallManager.stop();
            InCallManager.setForceSpeakerphoneOn(false);
            console.log(
              'Call hung up by ' +
                result['username'] +
                ' (' +
                result['reason'] +
                ')!',
            );
            clearTimeout(timeoutCall);
            setState(prev => ({
              ...prev,
              incomingcall: false,
              callFromMe: false,
              calling: false,
              myURL: '',
              remoteURL: '',
            }));
            globalDispatch!({
              type: 'SET_STATE',
              callId: '',
              currentCall: undefined,
            });
            break;
          }

          default:
            break;
        }
      }
    } else {
      let error = msg['error'];
      console.log(error);
      videocall.hangup();
    }
  };

  const _onlocalstream = stream => {
    console.log(' ::: Got a local stream :::');
    const videoTracks = stream.getVideoTracks();
    if (!videoTracks || videoTracks.length === 0) {
      setState(prev => ({...prev, isCameraOn: false}));
    }
    setState(prev => ({
      ...prev,
      myURL: stream.toURL(),
    }));
  };

  const _onremotestream = stream => {
    console.log(' ::: Got a remote stream :::');
    setState(prev => ({
      ...prev,
      remoteURL: stream.toURL(),
    }));
  };

  const _doCall = (username, audio, video, callId) => {
    timeoutCall = setTimeout(() => {
      cancelCall({
        variables: {
          callId,
        },
      });
      _hangup();
    }, 30000);
    videocall.createOffer({
      media: {audio, video},
      simulcast: false,
      success: function(jsep) {
        var body = {request: 'call', username};
        videocall.send({message: body, jsep: jsep});
        setState(prev => ({...prev, callFromMe: true, isVideoCall: video}));
      },
    });
  };

  const _hangup = () => {
    if (state.incomingcall) {
      refuseCall({
        variables: {
          callId: globalState!.callId,
        },
      })
        .then(() => {
          _onHangUp();
        })
        .catch(err => {
          returnConfirm(err.message);
        });
      return;
    }

    if (state.callFromMe) {
      cancelCall({
        variables: {
          callId: globalState!.callId,
        },
      })
        .then(() => _onHangUp())
        .catch(err => returnConfirm(err.message));
      return;
    }

    if (state.calling) {
      endCall({
        variables: {
          callId: globalState!.callId,
        },
      })
        .then(() => _onHangUp())
        .catch(err => returnConfirm(err.message));
      return;
    }

    return _onHangUp();
  };

  const _onHangUp = () => {
    const hangup = {request: 'hangup'};
    videocall.send({message: hangup});
    console.log('MESSAGE HANGUP');
    videocall.hangup();
    setState(prev => ({
      ...prev,
      myURL: '',
      remoteURL: '',
      callFromMe: false,
      calling: false,
      incomingcall: false,
    }));
    globalDispatch!({type: 'SET_STATE', callId: '', currentCall: undefined});
  };

  const _accept = callId => {
    acceptCall({
      variables: {
        callId,
      },
    })
      .then(() => {
        videocall.createAnswer({
          jsep: jsepCustom,
          media: {data: true},
          simulcast: false,
          success: jsep => {
            var body = {request: 'accept'};
            videocall.send({
              message: body,
              jsep,
            });
            videocall.send({
              message: {
                request: 'set',
                record: true,
                filename: Date.now().toString(),
              },
            });
            setState(prev => ({...prev, calling: true, callFromMe: false}));
          },
          error: function(error) {
            console.log('WebRTC error:', error);
          },
        });
      })
      .catch(err => {
        _onHangUp();
        returnConfirm(err.message);
      });
  };

  const _toggleVideo = () => {
    videocall.send({
      message: {request: 'set', video: !state.isCameraOn},
    });
    setState(prev => ({...prev, isCameraOn: !prev.isCameraOn}));
  };

  const _switchCamera = () => videocall.changeLocalCamera();
  //*_: END

  const _handleAppStateChange = nextAppState => {
    if (nextAppState === 'background' && janus) {
      for (var s in Janus.sessions) {
        if (Janus.sessions[s] !== null && Janus.sessions[s] !== undefined) {
          Janus.sessions[s].destroy();
        }
      }
      //@ts-ignore
      janus = undefined;
    }

    if (nextAppState === 'active' && !janus && AuthState!.user) {
      _janusStart();
    }
  };
  AppState.addEventListener('change', _handleAppStateChange);

  if (state.incomingcall)
    return <UpcomingCall accept={_accept} hangup={_hangup} />;

  if (state.callFromMe || state.calling)
    return (
      <VideoJanus
        toggleVideo={_toggleVideo}
        isAudio={state.isAudioOn}
        isCamera={state.isCameraOn}
        hangup={_hangup}
        myURL={state.myURL}
        remoteURL={state.remoteURL}
        isVideoCall={state.isVideoCall}
        calling={state.calling}
        switchCamera={_switchCamera}
      />
    );

  return <React.Fragment />;
};
