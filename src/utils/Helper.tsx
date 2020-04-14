import { Platform, Alert } from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

export const returnConfirm = (title: string, message: string = '') => {
  return Alert.alert(title, message, [{ text: 'OK', style: 'cancel' }], { cancelable: false })
}