import React from 'react';
import {Spinner, View} from 'native-base';
import {StyleSheet} from 'react-native';
import {DEVICE} from '@constants';

type Props = {
  visible: boolean;
};

export const SpinnerOverlay = (props: Props) => {
  if (!props.visible) return <React.Fragment />;
  return (
    <View style={style.container}>
      <Spinner color="#5d9c5a" size="large" />
    </View>
  );
};

const style = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    position: 'absolute',
    zIndex: 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16,16,16,0.3)',
    width: DEVICE.WIDTH_SCREEN,
    height: DEVICE.HEIGHT_SCREEN,
  },
  spinner: {
    color: '#5d9c5a',
  },
});
