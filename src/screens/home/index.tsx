import React, {useContext, useState, useEffect} from 'react';
import {View, Text, SafeAreaView, StatusBar, Alert} from 'react-native';
import {
  RTCPeerConnection,
  RTCMediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  RTCVideoView,
  MediaStreamTrack,
  getUserMedia,
} from 'react-native-webrtc';
import {useAsyncStorage} from '@react-native-community/async-storage';
import InCallManager from 'react-native-incall-manager';

import {storage, DEVICE, JANUS_PLUGIN} from '@constants';
import {AuthCTX} from '@context';
import {HomeScreenNavigationProp} from '@types';
import {SpinnerOverlay, AsyncImage} from '@components';
import {DarkTheme, useTheme} from '@react-navigation/native';
import {Janus} from '@utils';

type Props = {
  navigation: HomeScreenNavigationProp;
};

let server = 'https://janus.tuti-lys.com/janusbase/janus';
let janus;
let sfutest;
let started = false;

let myusername = Math.floor(Math.random() * 1000);
let roomId = 1234;
let myid = null;
let mystream = null;

let feeds = [];
var bitrateTimer = [];

Janus.init({
  debug: 'all',
  callback: function() {
    if (started) return;
    started = true;
  },
});

export const HomeScreen = (props: Props) => {
  const [state, setState] = useState({
    info: 'Initializing',
    status: 'init',
    roomID: '',
    isFront: true,
    selfViewSrc: null,
    selfViewSrcKey: 0,
    remoteList: {},
    remoteListPluginHandle: {},
    textRoomConnected: false,
    textRoomData: [],
    textRoomValue: '',
    publish: false,
    speaker: false,
    audioMute: false,
    videoMute: false,
    visible: false,
  });
  const {removeItem} = useAsyncStorage(storage.TOKEN);
  const authCtx = useContext(AuthCTX);
  const {colors, dark} = useTheme();

  useEffect(() => {
    InCallManager.start({media: 'audio'});
    _janusStart();
  }, []);

  const _janusStart = () => {
    janus = new Janus({
      server,
      success: () => {
        janus.attach({
          plugin: JANUS_PLUGIN.videoroom,
          success: pluginHandle => {
            sfutest = pluginHandle;
            let register = {
              request: 'join',
              room: roomId,
              ptype: 'publisher',
              display: myusername.toString(),
            };
            sfutest.send({message: register});
          },
          error: error => {
            Alert.alert('  -- Error attaching plugin...', error);
          },
          consentDialog: on => {},
          mediaState: (medium, on) => {},
          webrtcState: on => {},
          onmessage: (msg, jsep) => {
            // console.log(msg)
            var event = msg['videoroom'];
            if (event != undefined && event != null) {
              if (event === 'joined') {
                myid = msg['id'];
                publishOwnFeed(true);
                setState(prev => ({...prev, visible: false}));
                if (
                  msg['publishers'] !== undefined &&
                  msg['publishers'] !== null
                ) {
                  var list = msg['publishers'];
                  for (var f in list) {
                    var id = list[f]['id'];
                    var display = list[f]['display'];
                    newRemoteFeed(id, display);
                  }
                }
              } else if (event === 'destroyed') {
              } else if (event === 'event') {
                if (
                  msg['publishers'] !== undefined &&
                  msg['publishers'] !== null
                ) {
                  var list = msg['publishers'];
                  for (var f in list) {
                    let id = list[f]['id'];
                    let display = list[f]['display'];
                    newRemoteFeed(id, display);
                  }
                } else if (
                  msg['leaving'] !== undefined &&
                  msg['leaving'] !== null
                ) {
                  var leaving = msg['leaving'];
                  var remoteFeed = null;
                  let numLeaving = parseInt(msg['leaving']);
                  if (state.remoteList.hasOwnProperty(numLeaving)) {
                    delete state.remoteList.numLeaving;
                    setState(prev => ({...prev, remoteList: state.remoteList}));
                    state.remoteListPluginHandle[numLeaving].detach();
                    delete state.remoteListPluginHandle.numLeaving;
                  }
                } else if (
                  msg['unpublished'] !== undefined &&
                  msg['unpublished'] !== null
                ) {
                  var unpublished = msg['unpublished'];
                  if (unpublished === 'ok') {
                    sfutest.hangup();
                    return;
                  }
                  let numLeaving = parseInt(msg['unpublished']);
                  if (state.remoteList.hasOwnProperty(numLeaving)) {
                    delete state.remoteList.numLeaving;
                    setState(prev => ({...prev, remoteList: state.remoteList}));
                    state.remoteListPluginHandle[numLeaving].detach();
                    delete state.remoteListPluginHandle.numLeaving;
                  }
                } else if (
                  msg['error'] !== undefined &&
                  msg['error'] !== null
                ) {
                }
              }
            }
            if (jsep !== undefined && jsep !== null) {
              sfutest.handleRemoteJsep({jsep: jsep});
            }
          },
          onlocalstream: stream => {
            setState(prev => ({
              ...prev,
              selfViewSrc: stream.toURL(),
              selfViewSrcKey: Math.floor(Math.random() * 1000),
              status: 'ready',
              info: 'Please enter or create room ID',
            }));
          },
          onremotestream: stream => {
            console.log(stream, 'REMOTE STREAL');
          },
          oncleanup: () => {
            mystream = null;
          },
        });
      },
    });
  };

  const publishOwnFeed = useAudio => {
    if (!state.publish) {
      setState(prev => ({...prev, publish: true}));
      sfutest.createOffer({
        media: {
          audioRecv: false,
          videoRecv: false,
          audioSend: useAudio,
          videoSend: true,
        },
        success: jsep => {
          var publish = {request: 'configure', audio: useAudio, video: true};
          sfutest.send({message: publish, jsep: jsep});
        },
        error: error => {
          Alert.alert('WebRTC error:', error);
          if (useAudio) {
            publishOwnFeed(false);
          } else {
          }
        },
      });
    } else {
      // this.setState({ publish: false });
      // let unpublish = { "request": "unpublish" };
      // sfutest.send({"message": unpublish});
    }
  };

  const switchVideoType = () => {
    sfutest.changeLocalCamera();
  };

  const newRemoteFeed = (id, display) => {
    console.log('REMOTE FEEDDDDDD');
    let remoteFeed;
    janus.attach({
      plugin: 'janus.plugin.videoroom',
      success: pluginHandle => {
        remoteFeed = pluginHandle;
        let listen = {
          request: 'join',
          room: roomId,
          ptype: 'listener',
          feed: id,
        };
        remoteFeed.send({message: listen});
      },
      error: error => {
        Alert.alert('  -- Error attaching plugin...', error);
      },
      onmessage: (msg, jsep) => {
        let event = msg['videoroom'];
        if (event != undefined && event != null) {
          if (event === 'attached') {
            // Subscriber created and attached
          }
        }
        if (jsep !== undefined && jsep !== null) {
          remoteFeed.createAnswer({
            jsep: jsep,
            media: {audioSend: false, videoSend: false},
            success: jsep => {
              var body = {request: 'start', room: roomId};
              remoteFeed.send({message: body, jsep: jsep});
            },
            error: error => {
              Alert.alert('WebRTC error:', error);
            },
          });
        }
      },
      webrtcState: on => {},
      onlocalstream: stream => {},
      onremotestream: stream => {
        setState(prev => ({...prev, info: 'One peer join!'}));
        const remoteList = state.remoteList;
        const remoteListPluginHandle = state.remoteListPluginHandle;
        console.log(stream.toURL(), 'URLLLLLLLLLLLLLLLL');
        remoteList[id] = stream.toURL();
        remoteListPluginHandle[id] = remoteFeed;
        setState(prev => ({
          ...prev,
          remoteList: remoteList,
          remoteListPluginHandle: remoteListPluginHandle,
        }));
      },
      oncleanup: () => {
        if (remoteFeed.spinner !== undefined && remoteFeed.spinner !== null)
          remoteFeed.spinner.stop();
        remoteFeed.spinner = null;
        if (
          bitrateTimer[remoteFeed.rfindex] !== null &&
          bitrateTimer[remoteFeed.rfindex] !== null
        )
          clearInterval(bitrateTimer[remoteFeed.rfindex]);
        bitrateTimer[remoteFeed.rfindex] = null;
      },
    });
  };

  return (
    <SafeAreaView>
      {/* <SpinnerOverlay visible={state.visible} /> */}
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      {state.selfViewSrc && (
        <RTCView
          key={state.selfViewSrcKey}
          streamURL={state.selfViewSrc}
          style={{flex: 1}}
        />
      )}
      {state.remoteList &&
        Object.keys(state.remoteList).map((key, index) => {
          return (
            <RTCView
              key={Math.floor(Math.random() * 1000)}
              streamURL={state.remoteList[key]}
              style={{
                width: DEVICE.WIDTH_SCREEN,
                height: DEVICE.HEIGHT_SCREEN / 4,
              }}
            />
          );
        })}
    </SafeAreaView>
  );
};
