/*
	The MIT License (MIT)
	Copyright (c) 2016 Meetecho
	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the "Software"),
	to deal in the Software without restriction, including without limitation
	the rights to use, copy, modify, merge, publish, distribute, sublicense,
	and/or sell copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following conditions:
	The above copyright notice and this permission notice shall be included
	in all copies or substantial portions of the Software.
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
	THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
	OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
	ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE. */

/* tslint:disable */
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';

import {Alert} from 'react-native';
import {
  InitOptions,
  ConstructorOptions,
  CallbackPublic,
  PluginOptions,
} from '@types';

//*__: Janus session object
export class Janus {
  static initDone: boolean;
  static init: (options: InitOptions) => void;
  static log: (...args: any[]) => void;
  static noop: (...args: any[]) => void;
  static warn: (...args: any[]) => void;
  static debug: (...args: any[]) => void;
  static ajax: Function;
  static error: (...args: any[]) => void;
  static isWebrtcSupported: () => boolean;
  static extensionId: string;
  static sessions: object;
  static endOfCandidates;
  static trace: any;
  static listDevices: any;
  localstream;
  websockets;
  ws;
  wsHandlers;
  wsKeepaliveTimeoutId;
  servers;
  serversIndex;
  server;
  camera_front;
  iceServers;
  ipv6Support;
  maxev;
  token;
  apisecret;
  destroyOnUnload;
  connected;
  sessionId;
  pluginHandles;
  retries;
  transactions;
  gatewayCallbacks;

  constructor(gatewayCallbacks: ConstructorOptions) {
    if (Janus.initDone === undefined) {
      gatewayCallbacks.error!('Library not initialized');
      return;
    }
    Janus.log('Library initialized: ' + Janus.initDone);
    gatewayCallbacks.success =
      typeof gatewayCallbacks.success == 'function'
        ? gatewayCallbacks.success
        : Janus.noop;
    gatewayCallbacks.error =
      typeof gatewayCallbacks.error == 'function'
        ? gatewayCallbacks.error
        : Janus.noop;
    gatewayCallbacks.destroyed =
      typeof gatewayCallbacks.destroyed == 'function'
        ? gatewayCallbacks.destroyed
        : Janus.noop;
    if (!gatewayCallbacks.server) {
      gatewayCallbacks.error!('Invalid gateway url');
      return;
    }
    this.gatewayCallbacks = gatewayCallbacks || {};
    this.localstream = null;
    this.websockets = false;
    this.ws = null;
    this.wsHandlers = {};
    this.wsKeepaliveTimeoutId = null;
    this.servers = null;
    this.serversIndex = 0;
    this.server = gatewayCallbacks.server;
    this.camera_front = gatewayCallbacks.camera_front;
    if (Array.isArray(this.server)) {
      Janus.log(
        'Multiple servers provided (' +
          this.server.length +
          '), will use the first that works',
      );
      this.server = null;
      this.servers = gatewayCallbacks.server;
    } else {
      if (this.server.indexOf('ws') === 0) {
        this.websockets = true;
        Janus.log('Using WebSockets to contact Janus: ' + this.server);
      } else {
        this.websockets = false;
        Janus.log('Using REST API to contact Janus: ' + this.server);
      }
    }
    this.iceServers = gatewayCallbacks.iceServers || [
      {url: 'stun:stun.l.google.com:19302'},
    ];
    //*: Whether IPv6 candidates should be gathered
    this.ipv6Support = gatewayCallbacks.ipv6 || false;
    //*: Optional max events
    this.maxev = gatewayCallbacks.max_poll_events || null;
    if (this.maxev < 1) this.maxev = 1;
    //*: Token to use (only if the token based authentication mechanism is enabled)
    this.token = gatewayCallbacks.token || null;
    //*: API secret to use (only if the shared API secret is enabled)
    this.apisecret = gatewayCallbacks.apisecret || null;
    //*: Whether we should destroy this session when onbeforeunload is called
    this.destroyOnUnload = gatewayCallbacks.destroyOnUnload === true || true;
    this.connected = false;
    this.sessionId = null;
    this.pluginHandles = {};
    this.retries = 0;
    this.transactions = {};
    this.createSession(gatewayCallbacks);
  }

  that = this;

  //*_: Public methods
  getServer = (): string => {
    return this.server;
  };

  isConnected = (): boolean => {
    return this.connected;
  };

  getSessionId = (): string => {
    return this.sessionId;
  };

  destroy = (callbacks: CallbackPublic): void => {
    this.destroySession(callbacks, false);
  };
  attach = (callbacks: PluginOptions): void => {
    this.createHandle(callbacks);
  };

  //*_: Private method to create random identifiers (e.g., transaction)
  randomString = (len: number): string => {
    let charSet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < len; i++) {
      let randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
  };

  eventHandler = (): void => {
    if (this.sessionId == null) return;
    Janus.debug('Long poll...');
    if (!this.connected) {
      Janus.warn('Is the gateway down? (connected=false)');
      return;
    }
    let longpoll =
      this.server + '/' + this.sessionId + '?rid=' + new Date().getTime();
    if (this.maxev) longpoll = longpoll + '&maxev=' + this.maxev;
    if (this.token)
      longpoll = longpoll + '&token=' + encodeURIComponent(this.token);
    if (this.apisecret)
      longpoll = longpoll + '&apisecret=' + encodeURIComponent(this.apisecret);
    Janus.ajax({
      type: 'GET',
      url: longpoll,
      cache: false,
      timeout: 60000, // FIXME
      success: this.handleEvent,
      sucess: function() {},
      error: function(_, textStatus, errorThrown) {
        Janus.log(textStatus + ': ' + errorThrown);
        //~ clearTimeout(timeoutTimer);
        this.retries++;
        if (this.retries > 3) {
          // Did we just lose the gateway? :-(
          this.connected = false;
          this.gatewayCallbacks.error(
            'Lost connection to the gateway (is it down?)',
          );
          return;
        }
        this.eventHandler();
      },
      dataType: 'json',
    });
  };

  //*_: Private event handler: this will trigger plugin callbacks, if set
  handleEvent = json => {
    this.retries = 0;
    if (
      !this.websockets &&
      this.sessionId !== undefined &&
      this.sessionId !== null
    )
      setTimeout(this.eventHandler, 200);
    Janus.debug('Got event on session ' + this.sessionId);
    if (!this.websockets && Array.isArray(json)) {
      // We got an array: it means we passed a maxev > 1, iterate on all objects
      for (let i = 0; i < json.length; i++) {
        this.handleEvent(json[i]);
      }
      return;
    }
    if (json['janus'] === 'keepalive') {
      // Nothing happened
      return;
    } else if (json['janus'] === 'ack') {
      // Just an ack, we can probably ignore
      let transaction = json['transaction'];
      if (transaction) {
        let reportSuccess = this.transactions[transaction];
        if (reportSuccess) {
          reportSuccess(json);
        }
        delete this.transactions[transaction];
      }
      return;
    } else if (json['janus'] === 'success') {
      // Success!
      let transaction = json['transaction'];
      if (transaction !== null && transaction !== undefined) {
        let reportSuccess = this.transactions[transaction];
        if (reportSuccess) {
          reportSuccess(json);
        }
        delete this.transactions[transaction];
      }
      return;
    } else if (json['janus'] === 'webrtcup') {
      // The PeerConnection with the gateway is up! Notify this
      let sender = json['sender'];
      if (!sender) {
        Janus.warn('Missing sender...');
        return;
      }
      let pluginHandle = this.pluginHandles[sender];
      if (!pluginHandle) {
        Janus.warn('This handle is not attached to this session');
        return;
      }
      pluginHandle.webrtcState(true);
      return;
    } else if (json['janus'] === 'hangup') {
      // A plugin asked the core to hangup a PeerConnection on one of our handles
      let sender = json['sender'];
      if (!sender) {
        Janus.warn('Missing sender...');
        return;
      }
      let pluginHandle = this.pluginHandles[sender];
      if (!pluginHandle) {
        Janus.warn('This handle is not attached to this session');
        return;
      }
      pluginHandle.webrtcState(false);
      pluginHandle.hangup();
    } else if (json['janus'] === 'detached') {
      // A plugin asked the core to detach one of our handles
      let sender = json['sender'];
      if (!sender) {
        Janus.warn('Missing sender...');
        return;
      }
      let pluginHandle = this.pluginHandles[sender];
      if (!pluginHandle) {
        // Don't warn here because destroyHandle causes this situation.
        return;
      }
      pluginHandle.ondetached();
      pluginHandle.detach();
    } else if (json['janus'] === 'media') {
      // Media started/stopped flowing
      let sender = json['sender'];
      if (!sender) {
        Janus.warn('Missing sender...');
        return;
      }
      let pluginHandle = this.pluginHandles[sender];
      if (!pluginHandle) {
        Janus.warn('This handle is not attached to this session');
        return;
      }
      pluginHandle.mediaState(json['type'], json['receiving']);
    } else if (json['janus'] === 'error') {
      // Oops, something wrong happened
      //   Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);   // FIXME
      let transaction = json['transaction'];
      if (transaction) {
        let reportSuccess = this.transactions[transaction];
        if (reportSuccess) {
          reportSuccess(json);
        }
        delete this.transactions[transaction];
      }
      return;
    } else if (json['janus'] === 'event') {
      let sender = json['sender'];
      if (!sender) {
        Janus.warn('Missing sender...');
        return;
      }
      let plugindata = json['plugindata'];
      if (!plugindata) {
        Janus.warn('Missing plugindata...');
        return;
      }
      Janus.debug(
        '  -- Event is coming from ' +
          sender +
          ' (' +
          plugindata['plugin'] +
          ')',
      );
      let data = plugindata['data'];
      let pluginHandle = this.pluginHandles[sender];
      if (!pluginHandle) {
        Janus.warn('This handle is not attached to this session');
        return;
      }
      let jsep = json['jsep'];
      if (jsep) {
        Janus.debug('Handling SDP as well...');
      }
      let callback = pluginHandle.onmessage;
      if (callback) {
        Janus.debug('Notifying application...');
        // Send to callback specified when attaching plugin handle
        callback(data, jsep);
      } else {
        // Send to generic callback (?)
        Janus.debug('No provided notification callback');
      }
    } else {
      Janus.warn("Unknown message '" + json['janus'] + "'");
    }
  };

  //*_: Private helper to send keep-alive messages on WebSockets
  private keepAlive = () => {
    if (this.server === null || !this.websockets || !this.connected) return;
    this.wsKeepaliveTimeoutId = setTimeout(this.keepAlive, 30000);
    let request = {
      janus: 'keepalive',
      session_id: this.sessionId,
      transaction: this.randomString(12),
    };
    if (this.token) request['token'] = this.token;
    if (this.apisecret) request['apisecret'] = this.apisecret;
    this.ws.send(JSON.stringify(request));
  };

  //*_: Private method to create a session
  private createSession = (callbacks: ConstructorOptions) => {
    let transaction = this.randomString(12);
    let request = {janus: 'create', transaction};
    if (this.token) request['token'] = this.token;
    if (this.apisecret) request['apisecret'] = this.apisecret;
    if (this.server === null && Array.isArray(this.servers)) {
      //*: We still need to find a working server from the list we were given
      this.server = this.servers[this.serversIndex];
      if (this.server.indexOf('ws') === 0) {
        this.websockets = true;
        Alert.alert(
          'Server #' +
            (this.serversIndex + 1) +
            ': trying WebSockets to contact Janus (' +
            this.server +
            ')',
        );
      } else {
        this.websockets = false;
        Alert.alert(
          'Server #' +
            (this.serversIndex + 1) +
            ': trying REST API to contact Janus (' +
            this.server +
            ')',
        );
      }
    }
    if (this.websockets) {
      this.ws = new WebSocket(this.server, 'janus-protocol');
      this.wsHandlers = {
        error: () => {
          Alert.alert(
            'Error connecting to the Janus WebSockets server... ' + this.server,
          );
          if (Array.isArray(this.servers)) {
            this.serversIndex++;
            if (this.serversIndex == this.servers.length) {
              //*: We tried all the servers the user gave us and they all failed
              callbacks.error!(
                'Error connecting to any of the provided Janus servers: Is the gateway down?',
              );
              return;
            }
            //*: Let's try the next server
            this.server = null;
            setTimeout(() => {
              this.createSession(callbacks);
            }, 200);
            return;
          }
          callbacks.error!(
            'Error connecting to the Janus WebSockets server: Is the gateway down?',
          );
        },

        open: () => {
          //*: We need to be notified about the success
          this.transactions[transaction] = json => {
            if (json['janus'] !== 'success') {
              Janus.error(
                'Ooops: ' + json['error'].code + ' ' + json['error'].reason,
              ); // FIXME
              callbacks.error!(json['error'].reason);
              return;
            }
            this.wsKeepaliveTimeoutId = setTimeout(this.keepAlive, 30000);
            this.connected = true;
            this.sessionId = json.data['id'];
            Janus.log('Created session: ' + this.sessionId);
            Janus.sessions[this.sessionId] = this;
            callbacks.success!();
          };
          this.ws.send(JSON.stringify(request));
        },

        message: event => {
          this.handleEvent(JSON.parse(event.data));
        },

        close: () => {
          if (this.server === null || !this.connected) {
            return;
          }
          this.connected = false;
          // FIXME: What if this is called when the page is closed?
          this.gatewayCallbacks.error(
            'Lost connection to the gateway (is it down?)',
          );
        },
      };

      for (let eventName in this.wsHandlers) {
        this.ws.addEventListener(eventName, this.wsHandlers[eventName]);
      }

      return;
    }
    console.log('Janus.ajax({})');
    console.log(this.server);
    Janus.ajax({
      type: 'POST',
      url: this.server,
      cache: false,
      contentType: 'application/json',
      data: JSON.stringify(request),
      success: json => {
        if (json['janus'] !== 'success') {
          Janus.error(
            'Ooops: ' + json['error'].code + ' ' + json['error'].reason,
          ); // FIXME:
          callbacks.error!(json['error'].reason);
          return;
        }
        this.connected = true;
        this.sessionId = json.data['id'];
        Janus.log('Created session: ' + this.sessionId);
        Janus.sessions[this.sessionId] = this.that;
        this.eventHandler();
        callbacks.success!();
      },
      error: function(_, textStatus, errorThrown) {
        console.log('*********error***********');
        console.log(errorThrown);
        //*: Janus.error(textStatus + ": " + errorThrown);   // FIXME
        if (Array.isArray(this.servers)) {
          this.serversIndex++;
          if (this.serversIndex === this.servers.length) {
            //*: We tried all the servers the user gave us and they all failed
            callbacks.error!(
              'Error connecting to any of the provided Janus servers: Is the gateway down?',
            );
            return;
          }
          //*: Let's try the next server
          this.server = null;
          setTimeout(() => {
            this.createSession(callbacks);
          }, 200);
          return;
        }
        if (errorThrown === '')
          callbacks.error!(textStatus + ': Is the gateway down?');
        else callbacks.error!(textStatus + ': ' + errorThrown);
      },
      dataType: 'json',
    });
  };

  //*_: Private method to destroy a session
  destroySession = (callbacks: CallbackPublic, syncRequest: boolean) => {
    syncRequest = syncRequest === true;
    Janus.log(
      'Destroying session ' + this.sessionId + ' (sync=' + syncRequest + ')',
    );
    callbacks = callbacks || {};
    // FIXME: This method triggers a success even when we fail
    callbacks.success =
      typeof callbacks.success == 'function' ? callbacks.success : Janus.noop;
    if (!this.connected) {
      Janus.warn('Is the gateway down? (connected=false)');
      callbacks.success();
      return;
    }
    if (!this.sessionId) {
      Janus.warn('No session to destroy');
      callbacks.success();
      this.gatewayCallbacks.destroyed();
      return;
    }
    delete Janus.sessions[this.sessionId];
    //*: Destroy all handles first
    for (let ph in this.pluginHandles) {
      let phv = this.pluginHandles[ph];
      Janus.log('Destroying handle ' + phv.id + ' (' + phv.plugin + ')');
      this.destroyHandle(phv.id, null, syncRequest);
    }
    //*: Ok, go on
    let request = {
      janus: 'destroy',
      transaction: this.randomString(12),
      session_id: null,
    };
    if (this.token) request['token'] = this.token;
    if (this.apisecret) request['apisecret'] = this.apisecret;
    if (this.websockets) {
      request['session_id'] = this.sessionId;

      const unbindWebSocket = () => {
        for (let eventName in this.wsHandlers) {
          this.ws.removeEventListener(eventName, this.wsHandlers[eventName]);
        }
        this.ws.removeEventListener('message', onUnbindMessage);
        this.ws.removeEventListener('error', onUnbindError);
        if (this.wsKeepaliveTimeoutId) {
          clearTimeout(this.wsKeepaliveTimeoutId);
        }
      };

      const onUnbindMessage = event => {
        let data = JSON.parse(event.data);
        if (
          data.session_id == request.session_id &&
          data.transaction == request.transaction
        ) {
          unbindWebSocket();
          callbacks.success!();
          this.gatewayCallbacks.destroyed();
        }
      };
      const onUnbindError = _ => {
        unbindWebSocket();
        callbacks.error!('Failed to destroy the gateway: Is the gateway down?');
        this.gatewayCallbacks.destroyed();
      };

      this.ws.addEventListener('message', onUnbindMessage);
      this.ws.addEventListener('error', onUnbindError);

      this.ws.send(JSON.stringify(request));
      return;
    }
    console.log('sessionId');
    console.log(this.sessionId);
    console.log('server');
    console.log(this.server);
    Janus.ajax({
      type: 'POST',
      url: this.server + '/' + this.sessionId,
      async: true, // Sometimes we need false here, or destroying in onbeforeunload won't work
      cache: false,
      contentType: 'application/json',
      data: JSON.stringify(request),
      success: json => {
        Janus.log('Destroyed session:');
        this.sessionId = null;
        this.connected = false;
        if (json['janus'] !== 'success') {
          Janus.error(
            'Ooops: ' + json['error'].code + ' ' + json['error'].reason,
          ); // FIXME
        }
        callbacks.success!();
        this.gatewayCallbacks.destroyed();
      },
      error: function(_, textStatus, errorThrown) {
        Janus.error(textStatus + ': ' + errorThrown); // FIXME
        // Reset everything anyway
        this.sessionId = null;
        this.connected = false;
        callbacks.success!();
        this.gatewayCallbacks.destroyed();
      },
      dataType: 'json',
    });
  };

  //*_: Private method to create a plugin handle
  createHandle = (callbacks: PluginOptions) => {
    callbacks = callbacks || {};
    callbacks.success =
      typeof callbacks.success == 'function' ? callbacks.success : Janus.noop;
    callbacks.error =
      typeof callbacks.error == 'function' ? callbacks.error : Janus.noop;
    callbacks.consentDialog =
      typeof callbacks.consentDialog == 'function'
        ? callbacks.consentDialog
        : Janus.noop;
    callbacks.mediaState =
      typeof callbacks.mediaState == 'function'
        ? callbacks.mediaState
        : Janus.noop;
    callbacks.webrtcState =
      typeof callbacks.webrtcState == 'function'
        ? callbacks.webrtcState
        : Janus.noop;
    callbacks.onmessage =
      typeof callbacks.onmessage == 'function'
        ? callbacks.onmessage
        : Janus.noop;
    callbacks.onlocalstream =
      typeof callbacks.onlocalstream == 'function'
        ? callbacks.onlocalstream
        : Janus.noop;
    callbacks.onremotestream =
      typeof callbacks.onremotestream == 'function'
        ? callbacks.onremotestream
        : Janus.noop;
    callbacks.ondata =
      typeof callbacks.ondata == 'function' ? callbacks.ondata : Janus.noop;
    callbacks.ondataopen =
      typeof callbacks.ondataopen == 'function'
        ? callbacks.ondataopen
        : Janus.noop;
    callbacks.oncleanup =
      typeof callbacks.oncleanup == 'function'
        ? callbacks.oncleanup
        : Janus.noop;
    callbacks.ondetached =
      typeof callbacks.ondetached == 'function'
        ? callbacks.ondetached
        : Janus.noop;
    if (!this.connected) {
      Janus.warn('Is the gateway down? (connected=false)');
      callbacks.error('Is the gateway down? (connected=false)');
      return;
    }
    let plugin = callbacks.plugin;
    if (!plugin) {
      Janus.error('Invalid plugin');
      callbacks.error('Invalid plugin');
      return;
    }
    let transaction = this.randomString(12);
    let request = {
      janus: 'attach',
      plugin: plugin,
      transaction: transaction,
    };
    if (this.token) request['token'] = this.token;
    if (this.apisecret) request['apisecret'] = this.apisecret;
    if (this.websockets) {
      this.transactions[transaction] = json => {
        if (json['janus'] !== 'success') {
          Janus.error(
            'Ooops: ' + json['error'].code + ' ' + json['error'].reason,
          ); // FIXME:
          callbacks.error!(
            'Ooops: ' + json['error'].code + ' ' + json['error'].reason,
          );
          return;
        }
        let handleId = json.data['id'];
        Janus.log('Created handle: ' + handleId);
        let pluginHandle = {
          session: this.that,
          plugin: plugin,
          id: handleId,
          webrtcStuff: {
            started: false,
            myStream: null,
            streamExternal: false,
            remoteStream: null,
            mySdp: null,
            pc: null,
            dataChannel: null,
            dtmfSender: null,
            trickle: true,
            iceDone: false,
            sdpSent: false,
            volume: {
              value: null,
              timer: null,
            },
            bitrate: {
              value: null,
              bsnow: null,
              bsbefore: null,
              tsnow: null,
              tsbefore: null,
              timer: null,
            },
          },
          getId: () => {
            return handleId;
          },
          getPlugin: () => {
            return plugin;
          },
          getVolume: () => {
            return this.getVolume(handleId);
          },
          isAudioMuted: () => {
            return this.isMuted(handleId, false);
          },
          muteAudio: () => {
            return this.mute(handleId, false, true);
          },
          unmuteAudio: () => {
            return this.mute(handleId, false, false);
          },
          isVideoMuted: () => {
            return this.isMuted(handleId, true);
          },
          muteVideo: () => {
            return this.mute(handleId, true, true);
          },
          unmuteVideo: () => {
            return this.mute(handleId, true, false);
          },
          getBitrate: () => {
            return this.getBitrate(handleId);
          },
          changeLocalCamera: () => {
            return this.changeLocalCamera();
          },
          send: callbacks => {
            this.sendMessage(handleId, callbacks);
          },
          data: callbacks => {
            this.sendData(handleId, callbacks);
          },
          dtmf: callbacks => {
            this.sendDtmf(handleId, callbacks);
          },
          consentDialog: callbacks.consentDialog,
          mediaState: callbacks.mediaState,
          webrtcState: callbacks.webrtcState,
          onmessage: callbacks.onmessage,
          createOffer: callbacks => {
            this.prepareWebrtc(handleId, callbacks);
          },
          createAnswer: callbacks => {
            this.prepareWebrtc(handleId, callbacks);
          },
          handleRemoteJsep: callbacks => {
            this.prepareWebrtcPeer(handleId, callbacks);
          },
          onlocalstream: callbacks.onlocalstream,
          onremotestream: callbacks.onremotestream,
          ondata: callbacks.ondata,
          ondataopen: callbacks.ondataopen,
          oncleanup: callbacks.oncleanup,
          ondetached: callbacks.ondetached,
          hangup: sendRequest => {
            this.cleanupWebrtc(handleId, sendRequest === true);
          },
          detach: callbacks => {
            this.destroyHandle(handleId, callbacks);
          },
        };
        this.pluginHandles[handleId] = pluginHandle;
        callbacks.success!(pluginHandle);
      };
      request['session_id'] = this.sessionId;
      this.ws.send(JSON.stringify(request));
      return;
    }
    Janus.ajax({
      type: 'POST',
      url: this.server + '/' + this.sessionId,
      cache: false,
      contentType: 'application/json',
      data: JSON.stringify(request),
      success: json => {
        if (json['janus'] !== 'success') {
          Janus.error(
            'Ooops: ' + json['error'].code + ' ' + json['error'].reason,
          ); // FIXME:
          callbacks.error!(
            'Ooops: ' + json['error'].code + ' ' + json['error'].reason,
          );
          return;
        }
        let handleId = json.data['id'];
        Janus.log('Created handle: ' + handleId);
        let pluginHandle = {
          session: this.that,
          plugin: plugin,
          id: handleId,
          webrtcStuff: {
            started: false,
            myStream: null,
            streamExternal: false,
            remoteStream: null,
            mySdp: null,
            pc: null,
            dataChannel: null,
            dtmfSender: null,
            trickle: true,
            iceDone: false,
            sdpSent: false,
            volume: {
              value: null,
              timer: null,
            },
            bitrate: {
              value: null,
              bsnow: null,
              bsbefore: null,
              tsnow: null,
              tsbefore: null,
              timer: null,
            },
          },
          getId: () => {
            return handleId;
          },
          getPlugin: () => {
            return plugin;
          },
          getVolume: () => {
            return this.getVolume(handleId);
          },
          isAudioMuted: () => {
            return this.isMuted(handleId, false);
          },
          muteAudio: () => {
            return this.mute(handleId, false, true);
          },
          unmuteAudio: () => {
            return this.mute(handleId, false, false);
          },
          isVideoMuted: () => {
            return this.isMuted(handleId, true);
          },
          muteVideo: () => {
            return this.mute(handleId, true, true);
          },
          unmuteVideo: () => {
            return this.mute(handleId, true, false);
          },
          getBitrate: () => {
            return this.getBitrate(handleId);
          },
          changeLocalCamera: () => {
            return this.changeLocalCamera();
          },
          send: callbacks => {
            this.sendMessage(handleId, callbacks);
          },
          data: callbacks => {
            this.sendData(handleId, callbacks);
          },
          dtmf: callbacks => {
            this.sendDtmf(handleId, callbacks);
          },
          consentDialog: callbacks.consentDialog,
          mediaState: callbacks.mediaState,
          webrtcState: callbacks.webrtcState,
          onmessage: callbacks.onmessage,
          createOffer: callbacks => {
            this.prepareWebrtc(handleId, callbacks);
          },
          createAnswer: callbacks => {
            this.prepareWebrtc(handleId, callbacks);
          },
          handleRemoteJsep: callbacks => {
            this.prepareWebrtcPeer(handleId, callbacks);
          },
          onlocalstream: callbacks.onlocalstream,
          onremotestream: callbacks.onremotestream,
          ondata: callbacks.ondata,
          ondataopen: callbacks.ondataopen,
          oncleanup: callbacks.oncleanup,
          ondetached: callbacks.ondetached,
          hangup: sendRequest => {
            this.cleanupWebrtc(handleId, sendRequest === true);
          },
          detach: callbacks => {
            this.destroyHandle(handleId, callbacks);
          },
        };
        this.pluginHandles[handleId] = pluginHandle;
        callbacks.success!(pluginHandle);
      },
      error: function(_, textStatus, errorThrown) {
        Janus.error(textStatus + ': ' + errorThrown); // FIXME:
      },
      dataType: 'json',
    });
  };

  //*_: Private method to send a message
  sendMessage = (handleId, callbacks) => {
    callbacks = callbacks || {};
    callbacks.success =
      typeof callbacks.success == 'function' ? callbacks.success : Janus.noop;
    callbacks.error =
      typeof callbacks.error == 'function' ? callbacks.error : Janus.noop;
    if (!this.connected) {
      Janus.warn('Is the gateway down? (connected=false)');
      callbacks.error('Is the gateway down? (connected=false)');
      return;
    }
    let message = callbacks.message;
    let jsep = callbacks.jsep;
    let transaction = this.randomString(12);
    let request = {
      janus: 'message',
      body: message,
      transaction: transaction,
    };
    if (this.token) request['token'] = this.token;
    if (this.apisecret) request['apisecret'] = this.apisecret;
    if (jsep) request['jsep'] = jsep;
    Janus.debug('Sending message to plugin (handle=' + handleId + '):');
    if (this.websockets) {
      request['session_id'] = this.sessionId;
      request['handle_id'] = handleId;
      this.transactions[transaction] = json => {
        Janus.debug('Message sent!');
        if (json['janus'] === 'success') {
          // We got a success, must have been a synchronous transaction
          let plugindata = json['plugindata'];
          if (!plugindata) {
            Janus.warn('Request succeeded, but missing plugindata...');
            callbacks.success();
            return;
          }
          Janus.log(
            'Synchronous transaction successful (' + plugindata['plugin'] + ')',
          );
          let data = plugindata['data'];
          callbacks.success(data);
          return;
        } else if (json['janus'] !== 'ack') {
          // Not a success and not an ack, must be an error
          if (json['error']) {
            Janus.error(
              'Ooops: ' + json['error'].code + ' ' + json['error'].reason,
            ); // FIXME
            callbacks.error(json['error'].code + ' ' + json['error'].reason);
          } else {
            Janus.error('Unknown error'); // FIXME
            callbacks.error('Unknown error');
          }
          return;
        }
        // If we got here, the plugin decided to handle the request asynchronously
        callbacks.success();
      };
      this.ws.send(JSON.stringify(request));
      return;
    }
    Janus.ajax({
      type: 'POST',
      url: this.server + '/' + this.sessionId + '/' + handleId,
      cache: false,
      contentType: 'application/json',
      data: JSON.stringify(request),
      success: json => {
        Janus.debug('Message sent!');
        if (json['janus'] === 'success') {
          // We got a success, must have been a synchronous transaction
          let plugindata = json['plugindata'];
          if (!plugindata) {
            Janus.warn('Request succeeded, but missing plugindata...');
            callbacks.success();
            return;
          }
          Janus.log(
            'Synchronous transaction successful (' + plugindata['plugin'] + ')',
          );
          let data = plugindata['data'];
          callbacks.success(data);
          return;
        } else if (json['janus'] !== 'ack') {
          // Not a success and not an ack, must be an error
          if (json['error']) {
            Janus.error(
              'Ooops: ' + json['error'].code + ' ' + json['error'].reason,
            ); // FIXME
            callbacks.error(json['error'].code + ' ' + json['error'].reason);
          } else {
            Janus.error('Unknown error'); // FIXME
            callbacks.error('Unknown error');
          }
          return;
        }
        // If we got here, the plugin decided to handle the request asynchronously
        callbacks.success();
      },
      error: function(_, textStatus, errorThrown) {
        Janus.error(textStatus + ': ' + errorThrown); // FIXME
        callbacks.error(textStatus + ': ' + errorThrown);
      },
      dataType: 'json',
    });
  };

  //*_: Private method to send a trickle candidate
  sendTrickleCandidate = (handleId, candidate) => {
    if (!this.connected) {
      Janus.warn('Is the gateway down? (connected=false)');
      return;
    }
    let request = {
      janus: 'trickle',
      candidate: candidate,
      transaction: this.randomString(12),
    };
    if (this.token) request['token'] = this.token;
    if (this.apisecret) request['apisecret'] = this.apisecret;
    Janus.debug('Sending trickle candidate (handle=' + handleId + '):');
    if (this.websockets) {
      request['session_id'] = this.sessionId;
      request['handle_id'] = handleId;
      this.ws.send(JSON.stringify(request));
      return;
    }
    Janus.ajax({
      type: 'POST',
      url: this.server + '/' + this.sessionId + '/' + handleId,
      cache: false,
      contentType: 'application/json',
      data: JSON.stringify(request),
      success: json => {
        Janus.debug('Candidate sent!');
        if (json['janus'] !== 'ack') {
          Janus.error(
            'Ooops: ' + json['error'].code + ' ' + json['error'].reason,
          ); // FIXME:
          return;
        }
      },
      error: (_, textStatus, errorThrown) => {
        Janus.error(textStatus + ': ' + errorThrown); // FIXME:
      },
      dataType: 'json',
    });
  };

  //*_: Private method to send a data channel message
  sendData = (handleId, callbacks) => {
    callbacks = callbacks || {};
    callbacks.success =
      typeof callbacks.success == 'function' ? callbacks.success : Janus.noop;
    callbacks.error =
      typeof callbacks.error == 'function' ? callbacks.error : Janus.noop;
    let pluginHandle = this.pluginHandles[handleId];
    if (!pluginHandle || !pluginHandle.webrtcStuff) {
      Janus.warn('Invalid handle');
      callbacks.error('Invalid handle');
      return;
    }
    let config = pluginHandle.webrtcStuff;
    let text = callbacks.text;
    if (!text) {
      Janus.warn('Invalid text');
      callbacks.error('Invalid text');
      return;
    }
    Janus.log('Sending string on data channel: ' + text);
    config.dataChannel.send(text);
    callbacks.success();
  };

  //*_: Private method to send a DTMF tone
  sendDtmf = (handleId, callbacks) => {
    callbacks = callbacks || {};
    callbacks.success =
      typeof callbacks.success == 'function' ? callbacks.success : Janus.noop;
    callbacks.error =
      typeof callbacks.error == 'function' ? callbacks.error : Janus.noop;
    let pluginHandle = this.pluginHandles[handleId];
    if (!pluginHandle || !pluginHandle.webrtcStuff) {
      Janus.warn('Invalid handle');
      callbacks.error('Invalid handle');
      return;
    }
    let config = pluginHandle.webrtcStuff;
    if (!config.dtmfSender) {
      // Create the DTMF sender, if possible
      if (config.myStream) {
        let tracks = config.myStream.getAudioTracks();
        if (tracks && tracks.length > 0) {
          let local_audio_track = tracks[0];
          config.dtmfSender = config.pc.createDTMFSender(local_audio_track);
          Janus.log('Created DTMF Sender');
          config.dtmfSender.ontonechange = function(tone) {
            Janus.debug('Sent DTMF tone: ' + tone.tone);
          };
        }
      }
      if (!config.dtmfSender) {
        Janus.warn('Invalid DTMF configuration');
        callbacks.error('Invalid DTMF configuration');
        return;
      }
    }
    let dtmf = callbacks.dtmf;
    if (!dtmf) {
      Janus.warn('Invalid DTMF parameters');
      callbacks.error('Invalid DTMF parameters');
      return;
    }
    let tones = dtmf.tones;
    if (!tones) {
      Janus.warn('Invalid DTMF string');
      callbacks.error('Invalid DTMF string');
      return;
    }
    let duration = dtmf.duration;
    if (!duration) duration = 500; // We choose 500ms as the default duration for a tone
    let gap = dtmf.gap;
    if (!gap) gap = 50; // We choose 50ms as the default gap between tones
    Janus.debug(
      'Sending DTMF string ' +
        tones +
        ' (duration ' +
        duration +
        'ms, gap ' +
        gap +
        'ms',
    );
    config.dtmfSender.insertDTMF(tones, duration, gap);
  };

  //*_: Private method to destroy a plugin handle
  destroyHandle = (handleId, callbacks, syncRequest = false) => {
    syncRequest = false;
    Janus.log('Destroying handle ' + handleId + ' (sync=' + syncRequest + ')');
    callbacks = callbacks || {};
    callbacks.success =
      typeof callbacks.success == 'function' ? callbacks.success : Janus.noop;
    callbacks.error =
      typeof callbacks.error == 'function' ? callbacks.error : Janus.noop;
    this.cleanupWebrtc(handleId, false);
    if (!this.connected) {
      Janus.warn('Is the gateway down? (connected=false)');
      callbacks.error('Is the gateway down? (connected=false)');
      return;
    }
    let request = {
      janus: 'detach',
      transaction: this.randomString(12),
    };
    if (this.token) request['token'] = this.token;
    if (this.apisecret) request['apisecret'] = this.apisecret;
    if (this.websockets) {
      request['session_id'] = this.sessionId;
      request['handle_id'] = handleId;
      this.ws.send(JSON.stringify(request));
      delete this.pluginHandles[handleId];
      callbacks.success();
      return;
    }
    Janus.ajax({
      type: 'POST',
      url: this.server + '/' + this.sessionId + '/' + handleId,
      async: true, // Sometimes we need false here, or destroying in onbeforeunload won't work
      cache: false,
      contentType: 'application/json',
      data: JSON.stringify(request),
      success: json => {
        Janus.log('Destroyed handle:');
        if (json['janus'] !== 'success') {
          Janus.log(
            'Ooops: ' + json['error'].code + ' ' + json['error'].reason,
          ); // FIXME
        }
        delete this.pluginHandles[handleId];
        callbacks.success();
      },
      error: (_, textStatus, errorThrown) => {
        Janus.error(textStatus + ': ' + errorThrown); // FIXME:
        // We cleanup anyway
        delete this.pluginHandles[handleId];
        callbacks.success();
      },
      dataType: 'json',
    });
  };

  //*_: WebRTC stuff
  changeLocalCamera = () => {
    this.localstream._tracks[1]._switchCamera();
  };

  //*: Stream Done
  streamsDone = (handleId, jsep, media, callbacks, stream) => {
    let pluginHandle = this.pluginHandles[handleId];
    if (!pluginHandle || !pluginHandle.webrtcStuff) {
      Janus.warn('Invalid handle');
      callbacks.error('Invalid handle');
      return;
    }
    let config = pluginHandle.webrtcStuff;
    Janus.debug('streamsDone:');
    config.myStream = stream;
    let pc_config = {iceServers: this.iceServers};
    //~ let pc_constraints = {'mandatory': {'MozDontOfferDataChannel':true}};
    let pc_constraints = {
      optional: [{DtlsSrtpKeyAgreement: true}],
    };
    if (this.ipv6Support === true) {
      // FIXME This is only supported in Chrome right now
      // For support in Firefox track this: https://bugzilla.mozilla.org/show_bug.cgi?id=797262
      //@ts-ignore
      pc_constraints.optional.push({googIPv6: true});
    }
    Janus.log('Creating PeerConnection');
    config.pc = new RTCPeerConnection(pc_config, pc_constraints);

    if (config.pc.getStats) {
      // FIXME
      config.volume.value = 0;
      config.bitrate.value = '0 kbits/sec';
    }
    Janus.log(
      'Preparing local SDP and gathering candidates (trickle=' +
        config.trickle +
        ')',
    );
    console.log(
      'Preparing local SDP and gathering candidates (trickle=' +
        config.trickle +
        ')',
    );

    config.pc.onicecandidate = event => {
      // JSON.stringify doesn't work on some WebRTC objects anymore
      // See https://code.google.com/p/chromium/issues/detail?id=467366
      if (event.candidate) {
        let candidate = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        };
        if (config.trickle === true) {
          // Send candidate
          this.sendTrickleCandidate(handleId, candidate);
        }
      }
    };

    if (stream) {
      Janus.log('Adding local stream');
      console.log('Adding local stream');
      config.pc.addStream(stream);
      console.log('Adding local end');
      pluginHandle.onlocalstream(stream);

      this.localstream = stream;
    }

    config.pc.onaddstream = remoteStream => {
      Janus.log('Handling Remote Stream');
      console.log('Handling Remote Stream');
      config.remoteStream = remoteStream;
      pluginHandle.onremotestream(remoteStream.stream);
    };
    // Any data channel to create?
    if (this.isDataEnabled(media)) {
      Janus.log('Creating data channel');
      console.log('Creating data channel');
      let onDataChannelMessage = event => {
        Janus.log('Received message on data channel: ' + event.data);
        pluginHandle.ondata(event.data); // FIXME
      };
      let onDataChannelStateChange = () => {
        let dcState =
          config.dataChannel !== null ? config.dataChannel.readyState : 'null';
        Janus.log('State change on data channel: ' + dcState);
        if (dcState === 'open') {
          pluginHandle.ondataopen(); // FIXME
        }
      };
      let onDataChannelError = error => {
        Janus.error('Got error on data channel:', error);
        // TODO
      };
      // Until we implement the proxying of open requests within the Janus core, we open a channel ourselves whatever the case
      config.dataChannel = config.pc.createDataChannel('JanusDataChannel', {
        ordered: false,
      }); // FIXME Add options (ordered, maxRetransmits, etc.)
      config.dataChannel.onmessage = onDataChannelMessage;
      config.dataChannel.onopen = onDataChannelStateChange;
      config.dataChannel.onclose = onDataChannelStateChange;
      config.dataChannel.onerror = onDataChannelError;
    }
    // Create offer/answer now
    if (!jsep) {
      console.log('createOffer');
      this.createOffer(handleId, media, callbacks);
    } else {
      console.log('createAnswer');
      config.pc.setRemoteDescription(jsep).then(() => {
        Janus.log('Remote description accepted!');
        config.remoteSdp = jsep.sdp;
        if (config.candidates && config.candidates.length > 0) {
          for (let i = 0; i < config.candidates.length; i++) {
            let candidate = config.candidates[i];
            Janus.debug('Adding remote candidate:', candidate);
            if (!candidate || candidate.completed === true) {
              // end-of-candidates
              config.pc.addIceCandidate(Janus.endOfCandidates);
            } else {
              // New candidate
              config.pc.addIceCandidate(candidate);
            }
          }
          config.candidates = [];
        }
        this.createAnswer(handleId, media, callbacks);
      }, callbacks.error);
    }
  };

  //*: Prepare WebRTC
  prepareWebrtc = (handleId, callbacks) => {
    callbacks = callbacks || {};
    callbacks.success =
      typeof callbacks.success == 'function' ? callbacks.success : Janus.noop;
    callbacks.error =
      typeof callbacks.error == 'function' ? callbacks.error : this.webrtcError;
    let jsep = callbacks.jsep;
    callbacks.media =
      typeof callbacks.media === 'object' && callbacks.media
        ? callbacks.media
        : {audio: true, video: true};
    let media = callbacks.media;
    let pluginHandle = this.pluginHandles[handleId];
    if (!pluginHandle || !pluginHandle.webrtcStuff) {
      Janus.warn('Invalid handle');
      callbacks.error('Invalid handle');
      return;
    }
    let config = pluginHandle.webrtcStuff;
    // Are we updating a session?
    config.trickle = this.isTrickleEnabled(callbacks.trickle);
    if (config.pc) {
      console.log('NONEEEEEE');
      Janus.log('Updating existing media session');
      // Create offer/answer now
      if (!jsep) {
        this.createOffer(handleId, media, callbacks);
      } else {
        config.pc
          .setRemoteDescription(new RTCSessionDescription(jsep))
          .then(() => {
            Janus.log('Remote description accepted!');
            this.createAnswer(handleId, media, callbacks);
          }, callbacks.error);
      }
      return;
    }
    // Was a MediaStream object passed, or do we need to take care of that?
    if (callbacks.stream) {
      let stream = callbacks.stream;
      Janus.log('MediaStream provided by the application');
      // Skip the getUserMedia part
      config.streamExternal = true;
      this.streamsDone(handleId, jsep, media, callbacks, stream);
      return;
    }
    if (this.isAudioSendEnabled(media) || this.isVideoSendEnabled(media)) {
      let constraints = {mandatory: {}, optional: []};
      pluginHandle.consentDialog(true);
      let audioSupport = this.isAudioSendEnabled(media);
      if (audioSupport === true && media !== undefined && media !== null) {
        if (typeof media.audio === 'object') {
          audioSupport = media.audio;
        }
      }
      let videoSupport = this.isVideoSendEnabled(media);
      if (videoSupport === true && media !== undefined && media !== null) {
        if (
          media.video &&
          media.video !== 'screen' &&
          media.video !== 'window'
        ) {
          let width = 0;
          let height = 0,
            maxHeight = 0;
          if (media.video === 'lowres') {
            // Small resolution, 4:3
            height = 240;
            maxHeight = 240;
            width = 320;
          } else if (media.video === 'lowres-16:9') {
            // Small resolution, 16:9
            height = 180;
            maxHeight = 180;
            width = 320;
          } else if (media.video === 'hires' || media.video === 'hires-16:9') {
            // High resolution is only 16:9
            height = 720;
            maxHeight = 720;
            width = 1280;
            //@ts-ignore
            if (navigator.mozGetUserMedia) {
              let firefoxVer = parseInt(
                //@ts-ignore
                window.navigator.userAgent.match(/Firefox\/(.*)/)[1],
                10,
              );
              if (firefoxVer < 38) {
                // Unless this is and old Firefox, which doesn't support it
                Janus.warn(
                  media.video +
                    ' unsupported, falling back to stdres (old Firefox)',
                );
                height = 480;
                maxHeight = 480;
                width = 640;
              }
            }
          } else if (media.video === 'stdres') {
            // Normal resolution, 4:3
            height = 480;
            maxHeight = 480;
            width = 640;
          } else if (media.video === 'stdres-16:9') {
            // Normal resolution, 16:9
            height = 360;
            maxHeight = 360;
            width = 640;
          } else {
            Janus.log(
              'Default video setting (' + media.video + ') is stdres 4:3',
            );
            height = 480;
            maxHeight = 480;
            width = 640;
          }
          Janus.log('Adding media constraint ' + media.video);
          //@ts-ignore
          if (navigator.mozGetUserMedia) {
            let firefoxVer = parseInt(
              //@ts-ignore
              window.navigator.userAgent.match(/Firefox\/(.*)/)[1],
              10,
            );
            if (firefoxVer < 38) {
              //@ts-ignore
              videoSupport = {
                require: ['height', 'width'],
                height: {
                  max: maxHeight,
                  min: height,
                },
                width: {
                  max: width,
                  min: width,
                },
              };
            } else {
              // http://stackoverflow.com/questions/28282385/webrtc-firefox-constraints/28911694#28911694
              // https://github.com/meetecho/janus-gateway/pull/246
              //@ts-ignore
              videoSupport = {
                height: {
                  ideal: height,
                },
                width: {
                  ideal: width,
                },
              };
            }
          } else {
            //@ts-ignore
            videoSupport = {
              mandatory: {
                maxHeight: maxHeight,
                minHeight: height,
                maxWidth: width,
                minWidth: width,
              },
              optional: [],
            };
          }
          if (typeof media.video === 'object') {
            videoSupport = media.video;
          }
        } else if (media.video === 'screen' || media.video === 'window') {
          // Not a webcam, but screen capture
          if (window.location.protocol !== 'https:') {
            // Screen sharing mandates HTTPS
            Janus.warn(
              'Screen sharing only works on HTTPS, try the https:// version of this page',
            );
            pluginHandle.consentDialog(false);
            callbacks.error(
              'Screen sharing only works on HTTPS, try the https:// version of this page',
            );
            return;
          }
          // We're going to try and use the extension for Chrome 34+, the old approach
          // for older versions of Chrome, or the experimental support in Firefox 33+
          let cache = {};
          const callbackUserMedia = (error, stream) => {
            pluginHandle.consentDialog(false);
            if (error) {
              callbacks.error({
                code: error.code,
                name: error.name,
                message: error.message,
              });
            } else {
              this.streamsDone(handleId, jsep, media, callbacks, stream);
            }
          };
          const getScreenMedia = (constraints, gsmCallback) => {
            Janus.log('Adding media constraint (screen capture)');
            navigator.mediaDevices
              .getUserMedia(constraints)
              .then(function(stream) {
                gsmCallback(null, stream);
              })
              .catch(function(error) {
                pluginHandle.consentDialog(false);
                gsmCallback(error);
              });
          };

          if (window.navigator.userAgent.match('Chrome')) {
            let chromever = parseInt(
              //@ts-ignore
              window.navigator.userAgent.match(/Chrome\/(.*) /)[1],
              10,
            );
            let maxver = 33;
            if (window.navigator.userAgent.match('Linux')) maxver = 35; // "known" crash in chrome 34 and 35 on linux
            if (chromever >= 26 && chromever <= maxver) {
              // Chrome 26->33 requires some awkward chrome://flags manipulation
              constraints = {
                //@ts-ignore
                video: {
                  mandatory: {
                    googLeakyBucket: true,
                    maxWidth: window.screen.width,
                    maxHeight: window.screen.height,
                    maxFrameRate: 3,
                    chromeMediaSource: 'screen',
                  },
                },
                audio: this.isAudioSendEnabled(media),
              };
              getScreenMedia(constraints, callbackUserMedia);
            } else {
              // Chrome 34+ requires an extension
              let pending = window.setTimeout(() => {
                let error = new Error('NavigatorUserMediaError');
                error.name =
                  'The required Chrome extension is not installed: click <a href="#">here</a> to install it. (NOTE: this will need you to refresh the page)';
                pluginHandle.consentDialog(false);
                return callbacks.error(error);
              }, 1000);
              cache[pending] = [callbackUserMedia, null];
              window.postMessage({type: 'janusGetScreen', id: pending}, '*');
            }
          } else if (window.navigator.userAgent.match('Firefox')) {
            let ffver = parseInt(
              //@ts-ignore
              window.navigator.userAgent.match(/Firefox\/(.*)/)[1],
              10,
            );
            if (ffver >= 33) {
              // Firefox 33+ has experimental support for screen sharing
              constraints = {
                //@ts-ignore
                video: {
                  mozMediaSource: media.video,
                  mediaSource: media.video,
                },
                audio: this.isAudioSendEnabled(media),
              };
              getScreenMedia(constraints, function(err, stream) {
                callbackUserMedia(err, stream);
                // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1045810
                if (!err) {
                  let lastTime = stream.currentTime;
                  let polly = window.setInterval(() => {
                    if (!stream) window.clearInterval(polly);
                    if (stream.currentTime == lastTime) {
                      window.clearInterval(polly);
                      if (stream.onended) {
                        stream.onended();
                      }
                    }
                    lastTime = stream.currentTime;
                  }, 500);
                }
              });
            } else {
              let error = new Error('NavigatorUserMediaError');
              error.name =
                'Your version of Firefox does not support screen sharing, please install Firefox 33 (or more recent versions)';
              pluginHandle.consentDialog(false);
              callbacks.error(error);
              return;
            }
          }

          // Wait for events from the Chrome Extension
          window.addEventListener('message', event => {
            if (event.origin != window.location.origin) return;
            if (event.data.type == 'janusGotScreen' && cache[event.data.id]) {
              let data = cache[event.data.id];
              let callback = data[0];
              delete cache[event.data.id];

              if (event.data.sourceId === '') {
                // user canceled
                let error = new Error('NavigatorUserMediaError');
                error.name =
                  'You cancelled the request for permission, giving up...';
                pluginHandle.consentDialog(false);
                callbacks.error(error);
              } else {
                constraints = {
                  //@ts-ignore
                  audio: this.isAudioSendEnabled(media),
                  video: {
                    mandatory: {
                      chromeMediaSource: 'desktop',
                      maxWidth: window.screen.width,
                      maxHeight: window.screen.height,
                      maxFrameRate: 3,
                    },
                    optional: [
                      {googLeakyBucket: true},
                      {googTemporalLayeredScreencast: true},
                    ],
                  },
                };
                //@ts-ignore
                constraints.video.mandatory.chromeMediaSourceId =
                  event.data.sourceId;
                getScreenMedia(constraints, callback);
              }
            } else if (event.data.type == 'janusGetScreenPending') {
              window.clearTimeout(event.data.id);
            }
          });
          return;
        }
      }
      // If we got here, we're not screensharing
      if (media === null || media === undefined || media.video !== 'screen') {
        // Check whether all media sources are actually available or not

        mediaDevices.enumerateDevices().then(_ => {
          mediaDevices
            .getUserMedia({
              audio: true,
              video: videoSupport
                ? {
                    facingMode: true ? 'user' : 'environment',
                  }
                : false,
            })
            .then(stream => {
              this.localstream = stream;
              console.log('Succeeded to get the local camera!');
              this.streamsDone(handleId, jsep, media, callbacks, stream);
            })
            .catch(error => {
              console.log('Failed to get the local camera!');
              console.log(error);
            });
        });
      }
    } else {
      // No need to do a getUserMedia, create offer/answer right away
      //@ts-ignore
      this.streamsDone(handleId, jsep, media, callbacks);
    }
  };

  //*: Prepare WebRTC Peer
  prepareWebrtcPeer = (handleId, callbacks) => {
    callbacks = callbacks || {};
    callbacks.success =
      typeof callbacks.success == 'function' ? callbacks.success : Janus.noop;
    callbacks.error =
      typeof callbacks.error == 'function' ? callbacks.error : this.webrtcError;
    let jsep = callbacks.jsep;
    let pluginHandle = this.pluginHandles[handleId];
    if (!pluginHandle || !pluginHandle.webrtcStuff) {
      Janus.warn('Invalid handle');
      callbacks.error('Invalid handle');
      return;
    }
    let config = pluginHandle.webrtcStuff;
    if (jsep) {
      if (config.pc === null) {
        Janus.warn(
          'Wait, no PeerConnection?? if this is an answer, use createAnswer and not handleRemoteJsep',
        );
        callbacks.error(
          'No PeerConnection: if this is an answer, use createAnswer and not handleRemoteJsep',
        );
        return;
      }
      config.pc.setRemoteDescription(
        new RTCSessionDescription(jsep),
        () => {
          Janus.log('Remote description accepted!');
          callbacks.success();
        },
        callbacks.error,
      );
    } else {
      callbacks.error('Invalid JSEP');
    }
  };

  //*: Create Offer
  createOffer = (handleId, media, callbacks) => {
    callbacks = callbacks || {};
    callbacks.success =
      typeof callbacks.success == 'function' ? callbacks.success : Janus.noop;
    callbacks.error =
      typeof callbacks.error == 'function' ? callbacks.error : Janus.noop;
    let pluginHandle = this.pluginHandles[handleId];
    if (!pluginHandle || !pluginHandle.webrtcStuff) {
      Janus.warn('Invalid handle');
      callbacks.error('Invalid handle');
      return;
    }
    let config = pluginHandle.webrtcStuff;
    Janus.log('Creating offer (iceDone=' + config.iceDone + ')');
    // https://code.google.com/p/webrtc/issues/detail?id=3508
    let mediaConstraints;
    mediaConstraints = {
      mandatory: {
        OfferToReceiveAudio: this.isAudioRecvEnabled(media),
        OfferToReceiveVideo: this.isVideoRecvEnabled(media),
      },
    };
    console.log(mediaConstraints);
    // }
    config.pc
      .createOffer()
      .then(function(offer) {
        if (!config.mySdp) {
          console.log('Setting local description');
          config.mySdp = offer.sdp;
          // config.pc.setLocalDescription(offer);

          config.pc.setLocalDescription(
            offer,
            () => {
              console.log('setLocalDescription', config.pc.localDescription);
            },
            function(_) {},
          );
        }
        if (!config.iceDone && !config.trickle) {
          // Don't do anything until we have all candidates
          Janus.log('Waiting for all candidates...');
          return;
        }
        if (config.sdpSent) {
          Janus.log('Offer already sent, not sending it again');
          return;
        }
        Janus.log('Offer ready');
        config.sdpSent = true;
        // JSON.stringify doesn't work on some WebRTC objects anymore
        // See https://code.google.com/p/chromium/issues/detail?id=467366
        let jsep = {
          type: offer.type,
          sdp: offer.sdp,
        };
        callbacks.success(jsep);
      })
      .then(function(e) {});
  };

  //*: Create Answer
  createAnswer = (handleId, media, callbacks) => {
    callbacks = callbacks || {};
    callbacks.success =
      typeof callbacks.success == 'function' ? callbacks.success : Janus.noop;
    callbacks.error =
      typeof callbacks.error == 'function' ? callbacks.error : Janus.noop;
    callbacks.customizeSdp =
      typeof callbacks.customizeSdp == 'function'
        ? callbacks.customizeSdp
        : Janus.noop;
    let pluginHandle = this.pluginHandles[handleId];
    if (
      pluginHandle === null ||
      pluginHandle === undefined ||
      pluginHandle.webrtcStuff === null ||
      pluginHandle.webrtcStuff === undefined
    ) {
      Janus.warn('Invalid handle');
      callbacks.error('Invalid handle');
      return;
    }
    let config = pluginHandle.webrtcStuff;
    Janus.log('Creating answer (iceDone=' + config.iceDone + ')');
    let mediaConstraints;
    // if(webrtcDetectedBrowser == "firefox" || webrtcDetectedBrowser == "edge") {
    //     mediaConstraints = {
    //         'offerToReceiveAudio':isAudioRecvEnabled(media),
    //         'offerToReceiveVideo':isVideoRecvEnabled(media)
    //     };
    // } else {
    mediaConstraints = {
      mandatory: {
        OfferToReceiveAudio: this.isAudioRecvEnabled(media),
        OfferToReceiveVideo: this.isVideoRecvEnabled(media),
      },
    };
    // }

    config.pc.createAnswer(mediaConstraints).then(answer => {
      Janus.debug(answer);
      let jsep = {
        type: answer.type,
        sdp: answer.sdp,
      };
      callbacks.customizeSdp(jsep);
      answer.sdp = jsep.sdp;
      Janus.log('Setting local description');
      config.mySdp = answer.sdp;
      config.pc.setLocalDescription(answer).catch(callbacks.error);
      config.mediaConstraints = mediaConstraints;
      if (!config.iceDone && !config.trickle) {
        // Don't do anything until we have all candidates
        Janus.log('Waiting for all candidates...');
        return;
      }
      // JSON.stringify doesn't work on some WebRTC objects anymore
      // See https://code.google.com/p/chromium/issues/detail?id=467366

      callbacks.success(answer);
    }, callbacks.error);
  };

  //*: Send SDP
  sendSDP = (handleId, callbacks) => {
    callbacks = callbacks || {};
    callbacks.success =
      typeof callbacks.success == 'function' ? callbacks.success : Janus.noop;
    callbacks.error =
      typeof callbacks.error == 'function' ? callbacks.error : Janus.noop;
    let pluginHandle = this.pluginHandles[handleId];
    if (!pluginHandle || !pluginHandle.webrtcStuff) {
      Janus.warn('Invalid handle, not sending anything');
      return;
    }
    let config = pluginHandle.webrtcStuff;
    Janus.log('Sending offer/answer SDP...');
    if (!config.mySdp) {
      Janus.warn('Local SDP instance is invalid, not sending anything...');
      return;
    }
    config.mySdp = {
      type: config.pc.localDescription.type,
      sdp: config.pc.localDescription.sdp,
    };
    if (config.sdpSent) {
      Janus.log('Offer/Answer SDP already sent, not sending it again');
      return;
    }
    if (config.trickle === false) config.mySdp['trickle'] = false;
    config.sdpSent = true;
    callbacks.success(config.mySdp);
  };

  //*: Get Volume
  getVolume = handleId => {
    let pluginHandle = this.pluginHandles[handleId];
    if (
      pluginHandle === null ||
      pluginHandle === undefined ||
      pluginHandle.webrtcStuff === null ||
      pluginHandle.webrtcStuff === undefined
    ) {
      Janus.warn('Invalid handle');
      return 0;
    }
    let config = pluginHandle.webrtcStuff;
    // Start getting the volume, if getStats is supported
    //@ts-ignore
    if (config.pc.getStats && webrtcDetectedBrowser == 'chrome') {
      // FIXME
      if (!config.remoteStream) {
        Janus.warn('Remote stream unavailable');
        return 0;
      }
      // http://webrtc.googlecode.com/svn/trunk/samples/js/demos/html/constraints-and-stats.html
      if (!config.volume.timer) {
        Janus.log('Starting volume monitor');
        config.volume.timer = setInterval(() => {
          config.pc.getStats(function(stats) {
            let results = stats.result();
            for (let i = 0; i < results.length; i++) {
              let res = results[i];
              if (res.type == 'ssrc' && res.stat('audioOutputLevel')) {
                config.volume.value = res.stat('audioOutputLevel');
              }
            }
          });
        }, 200);
        return 0; // We don't have a volume to return yet
      }
      return config.volume.value;
    } else {
      Janus.log('Getting the remote volume unsupported by browser');
      return 0;
    }
  };

  //*: Check isMuted
  isMuted = (handleId, video) => {
    let pluginHandle = this.pluginHandles[handleId];
    if (
      pluginHandle === null ||
      pluginHandle === undefined ||
      pluginHandle.webrtcStuff === null ||
      pluginHandle.webrtcStuff === undefined
    ) {
      Janus.warn('Invalid handle');
      return true;
    }
    let config = pluginHandle.webrtcStuff;
    if (config.pc === null || config.pc === undefined) {
      Janus.warn('Invalid PeerConnection');
      return true;
    }
    if (config.myStream === undefined || config.myStream === null) {
      Janus.warn('Invalid local MediaStream');
      return true;
    }
    if (video) {
      // Check video track
      if (
        !config.myStream.getVideoTracks() ||
        config.myStream.getVideoTracks().length === 0
      ) {
        Janus.warn('No video track');
        return true;
      }
      return !config.myStream.getVideoTracks()[0].enabled;
    } else {
      // Check audio track
      if (
        !config.myStream.getAudioTracks() ||
        config.myStream.getAudioTracks().length === 0
      ) {
        Janus.warn('No audio track');
        return true;
      }
      return !config.myStream.getAudioTracks()[0].enabled;
    }
  };

  //*: Mute Call
  mute = (handleId, video, mute) => {
    let pluginHandle = this.pluginHandles[handleId];
    if (
      pluginHandle === null ||
      pluginHandle === undefined ||
      pluginHandle.webrtcStuff === null ||
      pluginHandle.webrtcStuff === undefined
    ) {
      Janus.warn('Invalid handle');
      return false;
    }
    let config = pluginHandle.webrtcStuff;
    if (config.pc === null || config.pc === undefined) {
      Janus.warn('Invalid PeerConnection');
      return false;
    }
    if (config.myStream === undefined || config.myStream === null) {
      Janus.warn('Invalid local MediaStream');
      return false;
    }
    if (video) {
      // Mute/unmute video track
      if (
        config.myStream.getVideoTracks() === null ||
        config.myStream.getVideoTracks() === undefined ||
        config.myStream.getVideoTracks().length === 0
      ) {
        Janus.warn('No video track');
        return false;
      }
      config.myStream.getVideoTracks()[0].enabled = mute ? false : true;
      return true;
    } else {
      // Mute/unmute audio track
      if (
        config.myStream.getAudioTracks() === null ||
        config.myStream.getAudioTracks() === undefined ||
        config.myStream.getAudioTracks().length === 0
      ) {
        Janus.warn('No audio track');
        return false;
      }
      config.myStream.getAudioTracks()[0].enabled = mute ? false : true;
      return true;
    }
  };

  //*: Get Bitrate
  getBitrate = handleId => {
    let pluginHandle = this.pluginHandles[handleId];
    if (
      pluginHandle === null ||
      pluginHandle === undefined ||
      pluginHandle.webrtcStuff === null ||
      pluginHandle.webrtcStuff === undefined
    ) {
      Janus.warn('Invalid handle');
      return 'Invalid handle';
    }
    let config = pluginHandle.webrtcStuff;
    if (config.pc === null || config.pc === undefined)
      return 'Invalid PeerConnection';
    // Start getting the bitrate, if getStats is supported
    if (true) {
      // Do it the Chrome way
      if (config.remoteStream === null || config.remoteStream === undefined) {
        Janus.warn('Remote stream unavailable');
        return 'Remote stream unavailable';
      }
      // http://webrtc.googlecode.com/svn/trunk/samples/js/demos/html/constraints-and-stats.html
      if (config.bitrate.timer === null || config.bitrate.timer === undefined) {
        Janus.log('Starting bitrate timer (Chrome)');
        config.bitrate.timer = setInterval(() => {
          config.pc.getStats(function(stats) {
            let results = stats.result();
            for (let i = 0; i < results.length; i++) {
              let res = results[i];
              if (res.type == 'ssrc' && res.stat('googFrameHeightReceived')) {
                config.bitrate.bsnow = res.stat('bytesReceived');
                config.bitrate.tsnow = res.timestamp;
                if (
                  config.bitrate.bsbefore === null ||
                  config.bitrate.tsbefore === null
                ) {
                  // Skip this round
                  config.bitrate.bsbefore = config.bitrate.bsnow;
                  config.bitrate.tsbefore = config.bitrate.tsnow;
                } else {
                  // Calculate bitrate
                  let bitRate = Math.round(
                    ((config.bitrate.bsnow - config.bitrate.bsbefore) * 8) /
                      (config.bitrate.tsnow - config.bitrate.tsbefore),
                  );
                  config.bitrate.value = bitRate + ' kbits/sec';
                  //~ Janus.log("Estimated bitrate is " + config.bitrate.value);
                  config.bitrate.bsbefore = config.bitrate.bsnow;
                  config.bitrate.tsbefore = config.bitrate.tsnow;
                }
              }
            }
          });
        }, 1000);
        return '0 kbits/sec'; // We don't have a bitrate value yet
      }
      return config.bitrate.value;
    }
  };

  //*: Catch error
  webrtcError = error => {
    Janus.error('WebRTC error:', error);
  };

  //*: CLean WebRTC
  cleanupWebrtc = (handleId, hangupRequest) => {
    Janus.log('Cleaning WebRTC stuff');
    let pluginHandle = this.pluginHandles[handleId];
    if (pluginHandle === null || pluginHandle === undefined) {
      // Nothing to clean
      return;
    }
    let config = pluginHandle.webrtcStuff;
    if (config !== null && config !== undefined) {
      if (hangupRequest === true) {
        // Send a hangup request (we don't really care about the response)
        let request = {
          janus: 'hangup',
          transaction: this.randomString(12),
        };
        if (this.token) request['token'] = this.token;
        if (this.apisecret) request['apisecret'] = this.apisecret;
        Janus.debug('Sending hangup request (handle=' + handleId + '):');
        if (this.websockets) {
          request['session_id'] = this.sessionId;
          request['handle_id'] = handleId;
          this.ws.send(JSON.stringify(request));
        } else {
          Janus.ajax({
            type: 'POST',
            url: this.server + '/' + this.sessionId + '/' + handleId,
            cache: false,
            contentType: 'application/json',
            data: JSON.stringify(request),
            dataType: 'json',
          });
        }
      }
      // Cleanup stack
      config.remoteStream = null;
      if (config.volume.timer) clearInterval(config.volume.timer);
      config.volume.value = null;
      if (config.bitrate.timer) clearInterval(config.bitrate.timer);
      config.bitrate.timer = null;
      config.bitrate.bsnow = null;
      config.bitrate.bsbefore = null;
      config.bitrate.tsnow = null;
      config.bitrate.tsbefore = null;
      config.bitrate.value = null;
      try {
        // Try a MediaStream.stop() first
        if (
          !config.streamExternal &&
          config.myStream !== null &&
          config.myStream !== undefined
        ) {
          // console.log(config)
          Janus.log('Stopping local stream');
          // config.pc.removeStream(localstream)
          // localstream.release()
          // localstream.stop()
          this.localstream.getTracks().forEach(t => {
            this.localstream.removeTrack(t);
          });
          this.localstream.release();
          // config.myStream.stop();
          config.myStream.getTracks().forEach(function(track) {
            track.stop();
          });
        }
      } catch (e) {
        console.log(e);
        // Do nothing if this fails
      }
      try {
        // Try a MediaStreamTrack.stop() for each track as well
        if (
          !config.streamExternal &&
          config.myStream !== null &&
          config.myStream !== undefined
        ) {
          Janus.log('Stopping local stream tracks');
          let tracks = config.myStream.getTracks();
          for (let i in tracks) {
            let mst = tracks[i];
            if (mst !== null && mst !== undefined) mst.stop();
          }
        }
      } catch (e) {
        console.log(e);
        // Do nothing if this fails
      }
      config.streamExternal = false;
      config.myStream = null;
      // Close PeerConnection
      try {
        config.pc.close();
      } catch (e) {
        // Do nothing
      }
      config.pc = null;
      config.mySdp = null;
      config.iceDone = false;
      config.sdpSent = false;
      config.dataChannel = null;
      config.dtmfSender = null;
    }
    pluginHandle.oncleanup();
  };

  //*_: Helper methods to parse a media object
  //*: Check enable send audio
  isAudioSendEnabled = media => {
    Janus.debug('isAudioSendEnabled:', media);
    if (media === undefined || media === null) return true; // Default
    if (media.audio === false) return false; // Generic audio has precedence
    if (media.audioSend === undefined || media.audioSend === null) return true; // Default
    return media.audioSend === true;
  };

  //*: Check enable receive audio
  isAudioRecvEnabled = media => {
    Janus.debug('isAudioRecvEnabled:', media);
    if (media === undefined || media === null) return true; // Default
    if (media.audio === false) return false; // Generic audio has precedence
    if (media.audioRecv === undefined || media.audioRecv === null) return true; // Default
    return media.audioRecv === true;
  };

  //*: Check enable send video
  isVideoSendEnabled = media => {
    Janus.debug('isVideoSendEnabled:', media);

    if (media === undefined || media === null) return true; // Default
    if (media.video === false) return false; // Generic video has precedence
    if (media.videoSend === undefined || media.videoSend === null) return true; // Default
    return media.videoSend === true;
  };

  //*: Check enable receive video
  isVideoRecvEnabled = media => {
    Janus.debug('isVideoRecvEnabled:', media);
    // if(webrtcDetectedBrowser == "edge") {
    //     Janus.warn("Edge doesn't support compatible video yet");
    //     return false;
    // }
    if (media === undefined || media === null) return true; // Default
    if (media.video === false) return false; // Generic video has precedence
    if (media.videoRecv === undefined || media.videoRecv === null) return true; // Default
    return media.videoRecv === true;
  };

  //*: Check data is true
  isDataEnabled = media => {
    Janus.debug('isDataEnabled:', media);
    if (media === undefined || media === null) return false; // Default
    return media.data === true;
  };

  isTrickleEnabled = trickle => {
    Janus.debug('isTrickleEnabled:', trickle);
    if (trickle === undefined || trickle === null) return true; // Default is true
    return trickle === true;
  };
}

//*__: List of sessions
Janus.sessions = {};

//*__: Screensharing Chrome Extension ID
Janus.extensionId = 'hapfgfdkleiggjjpfpenajgdnfckjpaj';

Janus.noop = () => {};

//*__: Initialization
Janus.init = (options: InitOptions) => {
  options = options || {};
  options.callback =
    typeof options.callback == 'function' ? options.callback : Janus.noop;
  if (Janus.initDone === true) {
    // Already initialized
    options.callback();
  } else {
    if (typeof console == 'undefined' || typeof console.log == 'undefined')
      console.log = () => {};
    // Console logging (all debugging disabled by default)
    Janus.trace = Janus.noop;
    Janus.debug = Janus.noop;
    Janus.log = Janus.noop;
    Janus.warn = Janus.noop;
    Janus.error = Janus.noop;
    if (options.debug === true || options.debug === 'all') {
      // Enable all debugging levels
      Janus.trace = console.trace.bind(console);
      Janus.debug = console.debug.bind(console);
      Janus.log = console.log.bind(console);
      Janus.warn = console.warn.bind(console);
      Janus.error = console.error.bind(console);
    } else if (Array.isArray(options.debug)) {
      for (let i in options.debug) {
        let d = options.debug[i];
        switch (d) {
          case 'trace':
            Janus.trace = console.trace.bind(console);
            break;
          case 'debug':
            Janus.debug = console.debug.bind(console);
            break;
          case 'log':
            Janus.log = console.log.bind(console);
            break;
          case 'warn':
            Janus.warn = console.warn.bind(console);
            break;
          case 'error':
            Janus.error = console.error.bind(console);
            break;
          default:
            console.error(
              "Unknown debugging option '" +
                d +
                "' (supported: 'trace', 'debug', 'log', warn', 'error')",
            );
            break;
        }
      }
    }
    Janus.log('Initializing library');
    // Helper method to enumerate devices
    Janus.listDevices = function(callback) {
      callback = typeof callback == 'function' ? callback : Janus.noop;
      if (navigator.mediaDevices) {
        //@ts-ignore
        getUserMedia(
          {audio: true, video: true},
          function(stream) {
            navigator.mediaDevices.enumerateDevices().then(function(devices) {
              Janus.debug(devices);
              callback(devices);
              // Get rid of the now useless stream
              try {
                stream.stop();
              } catch (e) {}
              try {
                let tracks = stream.getTracks();
                for (let i in tracks) {
                  let mst = tracks[i];
                  if (mst !== null && mst !== undefined) mst.stop();
                }
              } catch (e) {}
            });
          },
          function(err) {
            Janus.error(err);
            callback([]);
          },
        );
      } else {
        Janus.warn('navigator.mediaDevices unavailable');
        callback([]);
      }
    };
    // Prepare a helper method to send AJAX requests in a syntax similar to jQuery (at least for what we care)
    Janus.ajax = function(params) {
      // Check params
      if (params === null || params === undefined) return;
      params.success =
        typeof params.success == 'function' ? params.success : Janus.noop;
      params.error =
        typeof params.error == 'function' ? params.error : Janus.noop;
      // Make sure there's an URL
      if (params.url === null || params.url === undefined) {
        Janus.error('Missing url', params.url);
        params.error(null, -1, 'Missing url');
        return;
      }
      // Validate async
      params.async =
        params.async === null || params.async === undefined
          ? true
          : params.async === true;
      // IE doesn't even know what WebRTC is, so no polyfill needed
      let XHR = new XMLHttpRequest();
      XHR.open(params.type, params.url, params.async);
      if (params.contentType !== null && params.contentType !== undefined)
        XHR.setRequestHeader('Content-type', params.contentType);
      if (params.async) {
        XHR.onreadystatechange = () => {
          if (XHR.readyState != 4) return;
          if (XHR.status !== 200) {
            // Got an error?
            //@ts-ignore
            if (XHR.status === 0) XHR.status = 'error';
            params.error(XHR, XHR.status, '');
            return;
          }
          // Got payload
          params.success(JSON.parse(XHR.responseText));
        };
      }
      try {
        XHR.send(params.data);
        if (!params.async) {
          if (XHR.status !== 200) {
            // Got an error?
            //@ts-ignore
            if (XHR.status === 0) XHR.status = 'error';
            params.error(XHR, XHR.status, '');
            return;
          }
          // Got payload
          params.success(JSON.parse(XHR.responseText));
        }
      } catch (e) {
        // Something broke up
        params.error(XHR, 'error', '');
      }
    };
    // Detect tab close
    window.onbeforeunload = () => {
      Janus.log('Closing window');
      for (let s in Janus.sessions) {
        if (
          Janus.sessions[s] !== null &&
          Janus.sessions[s] !== undefined &&
          Janus.sessions[s].destroyOnUnload
        ) {
          Janus.log('Destroying session ' + s);
          Janus.sessions[s].destroy();
        }
      }
    };

    Janus.initDone = true;
    // addJsList(["adapter.js"]);  // We may need others in the future
  }
};

//*__: Helper method to check whether WebRTC is supported by this browser
Janus.isWebrtcSupported = () => {
  //@ts-ignore
  return window.RTCPeerConnection && window.getUserMedia;
};
