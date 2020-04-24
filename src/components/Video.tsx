import React, {useContext} from 'react';
import {View, Button, Text} from 'native-base';
import {StyleSheet} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import {isAndroid} from '@utils';
import {DEVICE} from '@constants';
import {GlobalCTX} from '@context';
import {
  CancelWhite,
  CameraWhite,
  CameraOffWhite,
  SwitchCameraWhite,
} from '@icons';

type Props = {
  myURL: string;
  remoteURL: string;
  isVideoCall: boolean;
  hangup: Function;
  calling: boolean;
  isAudio: boolean;
  isCamera: boolean;
  toggleVideo: Function;
  switchCamera: Function;
};

export const VideoJanus = (props: Props) => {
  const {globalState} = useContext(GlobalCTX);

  const isShowMyCam = () =>
    (props.isVideoCall ||
      (globalState!.currentCall && globalState!.currentCall.isVideoCall)) &&
    props.myURL !== '' &&
    props.isCamera;
  const isShowRemoteCam = () =>
    (props.isVideoCall ||
      (globalState!.currentCall && globalState!.currentCall.isVideoCall)) &&
    props.remoteURL !== '' &&
    props.calling;

  return (
    <View style={styles.container}>
      {props.calling && (
        <SwitchCameraWhite
          width={40}
          height={40}
          disabled={!props.isCamera}
          style={styles.switch}
          onPress={() => props.switchCamera()}
        />
      )}
      {isShowMyCam() && (
        <RTCView streamURL={props.myURL} style={styles.local} />
      )}
      {isShowRemoteCam() && (
        <RTCView streamURL={props.remoteURL} style={styles.remote} />
      )}

      {!props.calling && <Text>Đang đổ chuông</Text>}

      <View style={styles.button}>
        {props.isCamera ? (
          <CameraWhite
            onPress={() => props.toggleVideo()}
            width={40}
            height={40}
            disabled={!props.calling}
          />
        ) : (
          <CameraOffWhite
            onPress={() => props.toggleVideo()}
            width={40}
            height={40}
            disabled={!props.calling}
          />
        )}

        <CancelWhite
          onPress={() => props.hangup()}
          fill="red"
          width={40}
          height={40}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    position: isAndroid ? 'relative' : 'absolute',
    zIndex: 3,
    backgroundColor: '#5d9c5a',
    width: DEVICE.WIDTH_SCREEN,
    height: DEVICE.HEIGHT_SCREEN,
    alignItems: 'center',
    paddingTop: DEVICE.HEIGHT_SCREEN / 5,
  },
  local: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 100,
    height: 100,
    zIndex: 99,
    backgroundColor: '#fff',
  },
  remote: {
    flex: 1,
    width: DEVICE.WIDTH_SCREEN,
    height: DEVICE.HEIGHT_SCREEN,
    position: 'absolute',
    zIndex: 9,
    backgroundColor: '#000',
  },
  button: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(255,255,255,0.5)',
    width: DEVICE.WIDTH_SCREEN,
    zIndex: 999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 20,
  },
  switch: {
    position: 'absolute',
    zIndex: 999,
    top: 20,
    left: 20,
  },
});
