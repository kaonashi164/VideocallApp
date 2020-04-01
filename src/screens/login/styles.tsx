import {StyleSheet} from 'react-native';
import {DEVICE} from '@constants';

export const style = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: DEVICE.WIDTH_WINDOW,
    height: DEVICE.HEIGHT_WINDOW,
  },
});
