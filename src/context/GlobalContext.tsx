import React, {useReducer} from 'react';
import {GlobalDispatch, GlobalContextType} from '@types';
import {Appearance, useColorScheme} from 'react-native-appearance';

const GlobalCTX = React.createContext<GlobalContextType>({});

export {GlobalCTX};

export const GlobalContext = (props: any) => {
  const theme = useColorScheme();
  const [state, dispatch] = useReducer(
    (prevState: any, action: GlobalDispatch) => {
      switch (action.type) {
        case 'SET_THEME': {
          Appearance.set({colorScheme: theme === 'dark' ? 'light' : 'dark'});
          return {
            ...prevState,
          };
        }

        default:
          break;
      }
    },
    {},
  );

  return (
    <GlobalCTX.Provider value={{state, dispatch}}>
      {props.children}
    </GlobalCTX.Provider>
  );
};
