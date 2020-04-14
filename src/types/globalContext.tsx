import {ColorSchemeName} from 'react-native-appearance';

export interface GlobalDispatch {
  type?: 'SET_THEME';
  value?: {
    colorScheme?: ColorSchemeName;
  };
}
export interface GlobalContextType {
  dispatch?: React.Dispatch<GlobalDispatch>;
  state?: {
    colorScheme?: ColorSchemeName;
  };
}
