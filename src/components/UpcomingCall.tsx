import React, {useContext} from 'react';
import {View, Text, Button} from 'native-base';
import {StyleSheet, StatusBar} from 'react-native';
import {DEVICE} from '@constants';
import {isAndroid} from '@utils';
import {GlobalCTX} from '@context';

export const UpcomingCall = (props: any) => {
  const {globalState} = useContext(GlobalCTX);
  return (
    <View style={styles.container}>
      {isAndroid && (
        <StatusBar backgroundColor="#5d9c5a" barStyle="light-content" />
      )}
      <Text style={styles.title}>Đang gọi video đến</Text>

      <View style={styles.groupBtn}>
        <Button
          onPress={() => {
            props.accept(globalState!.callId);
          }}>
          <Text>Trả lời</Text>
        </Button>
        <Button onPress={() => props.hangup()}>
          <Text>Từ chối</Text>
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    position: isAndroid ? 'relative' : 'absolute',
    zIndex: 99,
    backgroundColor: '#5d9c5a',
    width: DEVICE.WIDTH_SCREEN,
    height: DEVICE.HEIGHT_SCREEN,
    alignItems: 'center',
    paddingTop: DEVICE.HEIGHT_SCREEN / 5,
  },
  title: {
    color: '#fff',
    marginBottom: DEVICE.HEIGHT_SCREEN / 2,
  },
  groupBtn: {
    flexDirection: 'row',
    width: DEVICE.WIDTH_SCREEN * 0.8,
    justifyContent: 'space-between',
  },
});
