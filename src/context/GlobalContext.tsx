import React, {useReducer} from 'react';
import {GlobalDispatch, GlobalContextType, GlobalState} from '@types';
import {Appearance, useColorScheme} from 'react-native-appearance';

const GlobalCTX = React.createContext<GlobalContextType>({});

export {GlobalCTX};

export const GlobalContext = (props: any) => {
  const theme = useColorScheme();
  const reducer = (state: GlobalState, action: GlobalDispatch): GlobalState => {
    switch (action.type) {
      case 'SET_THEME': {
        Appearance.set({
          colorScheme: theme === 'dark' ? 'light' : 'dark',
        });
        return state;
      }

      case 'SET_STATE': {
        return {
          ...state,
          doCall: action.doCall || state.doCall,
          hangUp: action.hangUp || state.hangUp,
          callId: action.callId || state.callId,
          currentCall: action.currentCall || state.currentCall,
        };
      }

      default:
        return state;
    }
  };
  const [globalState, globalDispatch] = useReducer(reducer, {});

  return (
    <GlobalCTX.Provider value={{globalState, globalDispatch}}>
      {props.children}
    </GlobalCTX.Provider>
  );
};
