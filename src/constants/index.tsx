import {Dimensions} from 'react-native';

export const storage = {
  TOKEN: 'accessToken',
};

export const AUTH_CONTEXT = {
  ACTION: {
    SET_USER: 'SET_USER',
  },
};

export const GLOBAL_CONTEXT = {
  ACTION: {
    SET_THEME: 'SET_THEME',
  },
};

export const DEVICE = {
  WIDTH_SCREEN: Dimensions.get('screen').width,
  HEIGHT_SCREEN: Dimensions.get('screen').height,
  WIDTH_WINDOW: Dimensions.get('window').width,
  HEIGHT_WINDOW: Dimensions.get('window').height,
};
