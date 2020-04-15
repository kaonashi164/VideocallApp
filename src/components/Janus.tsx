import React, {useState, useEffect} from 'react';
import {Alert} from 'react-native';

import {Janus} from '@base';
import {JANUS_PLUGIN, JANUS_SERVER} from '@constants';
import {UpcomingCall} from './UpcomingCall';

export const JanusServer = (props: any) => {
  //*_: Variables
  let janus;
  let videocall;
  let opaqueId = 'videocalltest-123123123123123123';
  var myusername = null;
  var yourusername = null;
  let jsepCustom;

  //*_: Hooks
  const [state, setState] = useState({
    incomingcall: false,
  });

  useEffect(() => {
    Janus.init({
      debug: true,
    });
    _janusStart();
  }, []);

  const _janusStart = () => {
    console.log('janus init');
    janus = new Janus({
      server: JANUS_SERVER,
      success: () => {
        janus.attach({
          plugin: JANUS_PLUGIN.videocall,
          opaqueId: opaqueId,
          success: pluginHandle => {
            videocall = pluginHandle;
            // @ts-ignore
            Janus.log(
              'Plugin attached! (' +
                videocall.getPlugin() +
                ', id=' +
                videocall.getId() +
                ')',
            );
            let register = {
              request: 'register',
              username: 'kaonashi',
            };
            videocall.send({message: register});
          },
          error: error => {
            Alert.alert('  -- Error attaching plugin...', error);
          },
          consentDialog: on => {},
          mediaState: function(medium, on) {
            // @ts-ignore
            Janus.log(
              'Janus ' +
                (on ? 'started' : 'stopped') +
                ' receiving our ' +
                medium,
            );
          },
          webrtcState: function(on) {
            // @ts-ignore
            Janus.log(
              'Janus says our WebRTC PeerConnection is ' +
                (on ? 'up' : 'down') +
                ' now',
            );
          },
          onmessage: (msg, jsep) => {
            // @ts-ignore
            Janus.debug(' ::: Got a message :::');
            // @ts-ignore
            Janus.debug(msg);
            jsepCustom = jsep;

            var result = msg['result'];
            if (result != undefined && result != null) {
              if (result['list'] !== undefined && result['list'] !== null) {
                let list = result['list'];
                // @ts-ignore
                Janus.debug('Got a list of registered peers:');
                // @ts-ignore
                Janus.debug(list);
                for (let mp in list) {
                  // @ts-ignore
                  Janus.debug('  >> [' + list[mp] + ']');
                }
              } else if (
                result['event'] !== undefined &&
                result['event'] !== null
              ) {
                let event = result['event'];
                if (event === 'registered') {
                  myusername = result['username'];
                  // @ts-ignore
                  Janus.log('Successfully registered as ' + myusername + '!');
                  videocall.send({
                    message: {
                      request: 'list',
                    },
                  });
                } else if (event === 'calling') {
                  // @ts-ignore
                  Janus.log('Waiting for the peer to answer...');
                } else if (event === 'incomingcall') {
                  // @ts-ignore
                  Janus.log('Incoming call from ' + result['username'] + '!');
                  yourusername = result['username'];
                  setState({incomingcall: true});
                } else if (event === 'accepted') {
                  var peer = result['username'];
                  if (peer === null || peer === undefined) {
                    // @ts-ignore
                    Janus.log('Call started!');
                  } else {
                    // @ts-ignore
                    Janus.log(peer + ' accepted the call!');
                    yourusername = peer;
                  }
                  // Video call can start
                  if (jsep)
                    videocall.handleRemoteJsep({
                      jsep: jsep,
                    });
                } else if (event === 'update') {
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
                        success: function(jsep) {
                          // @ts-ignore
                          Janus.debug('Got SDP!');
                          // @ts-ignore
                          Janus.debug(jsep);
                          var body = {
                            request: 'set',
                          };
                          videocall.send({
                            message: body,
                            jsep: jsep,
                          });
                        },
                        error: function(error) {
                          // @ts-ignore
                          Janus.error('WebRTC error:', error);
                        },
                      });
                    }
                  }
                } else if (event === 'hangup') {
                  // @ts-ignore
                  Janus.log(
                    'Call hung up by ' +
                      result['username'] +
                      ' (' +
                      result['reason'] +
                      ')!',
                  );
                  setState({incomingcall: false});
                } else if (event === 'simulcast') {
                }
              }
            } else {
              let error = msg['error'];

              videocall.hangup();
            }
          },
          onlocalstream: stream => {
            // @ts-ignore
            Janus.debug(' ::: Got a local stream :::');
            // @ts-ignore
            Janus.debug(stream);
          },
          onremotestream: stream => {
            // @ts-ignore
            Janus.debug(' ::: Got a remote stream :::');
            // @ts-ignore
            Janus.debug(stream);
          },
          ondataopen: function(data) {
            // @ts-ignore
            Janus.log('The DataChannel is available!');
          },
          ondata: function(data) {
            // @ts-ignore
            Janus.debug('We got data from the DataChannel! ' + data);
          },
          oncleanup: () => {
            // @ts-ignore
            Janus.log(' ::: Got a cleanup notification :::');
          },
        });
      },
      error: error => {
        Janus.error(error);
      },
    });
  };

  const _accept = () => {
    videocall.createAnswer({
      jsep: jsepCustom,
      media: {data: true},
      simulcast: true,
      success: () => {
        Janus.debug('Got SDP!');
        Janus.debug(jsepCustom);
        var body = {request: 'accept'};
        videocall.send({message: body, jsep: jsepCustom});
      },
      error: function(error) {
        Janus.error('WebRTC error:', error);
      },
    });
  };

  if (state.incomingcall) return <UpcomingCall accept={_accept} />;

  return <React.Fragment />;
};
