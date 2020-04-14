import {StyleSheet} from 'react-native';
import {DEVICE} from '@constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: DEVICE.HEIGHT_SCREEN / 5,
  },
  title: {
    fontSize: 50,
    color: '#fff',
    marginBottom: DEVICE.HEIGHT_SCREEN / 5,
  },
  button: {
    width: DEVICE.WIDTH_SCREEN - 50,
    justifyContent: 'center',
    marginTop: 20,
  },
});
