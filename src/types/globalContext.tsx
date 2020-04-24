import {ColorSchemeName} from 'react-native-appearance';
import {TUser, TCall} from './Data';

export type GlobalDispatch =
  | {
      type?: 'SET_THEME';
      value?: {
        colorScheme?: ColorSchemeName;
      };
    }
  | {
      type: 'SetInfo';
      myInfo: TUser;
    }
  | {
      type: 'SET_STATE';
      videoCall?: any;
      jsepCustom?: any;
      doCall?: Function;
      hangUp?: Function;
      callId?: string;
      currentCall?: TCall;
    };

export type GlobalState = {
  colorScheme?: ColorSchemeName;
  isAuth?: boolean;
  myInfo?: TUser;
  doCall?: Function;
  hangUp?: Function;
  callId?: string;
  currentCall?: TCall;
};

export interface GlobalContextType {
  globalDispatch?: React.Dispatch<GlobalDispatch>;
  globalState?: GlobalState;
}
