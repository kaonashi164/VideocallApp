import {Platform} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

export const storeData = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.log(e);
  }
};

export const getData = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);

    if (value !== null) return value;
    return '';
  } catch (e) {
    console.log(e);
  }
};
