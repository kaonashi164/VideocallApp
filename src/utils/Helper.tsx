import {Platform, Alert} from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

export const returnConfirm = (title: string, message: string = '') => {
  return Alert.alert(title, message, [{text: 'OK', style: 'cancel'}], {
    cancelable: false,
  });
};

export const randomString = (len: number): string => {
  const charSet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var randomString = '';
  for (var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
};
