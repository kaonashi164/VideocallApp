import {StyleSheet} from 'react-native';
import {DEVICE} from '@constants';

export const style = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: DEVICE.WIDTH_WINDOW,
    height: DEVICE.HEIGHT_WINDOW,
  },
  item: {
    width: DEVICE.WIDTH_WINDOW - 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    marginBottom: DEVICE.HEIGHT_SCREEN / 5,
    color: '#fff',
  },
  button: {
    width: DEVICE.WIDTH_WINDOW / 2,
    justifyContent: 'center',
    marginTop: 50,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'transparent',
  },
  backIcon: {
    fontSize: 16,
    color: '#fff',
  },
  backTitle: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 15,
  },
});
