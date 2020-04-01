import React, {useReducer} from 'react';
import {AuthContextType, DispatchType} from 'src/types';
import {AUTH_CONTEXT} from '@constants';

const AuthCTX = React.createContext<AuthContextType>({});

export {AuthCTX};

export const AuthContext = (props: any) => {
  const [state, dispatch] = useReducer(
    (prevState: any, action: DispatchType) => {
      switch (action.type) {
        case AUTH_CONTEXT.ACTION.SET_USER: {
          return {
            ...prevState,
            user: action.value?.user,
          };
        }

        default:
          break;
      }
    },
    {
      user: 'ABC',
    },
  );

  return (
    <AuthCTX.Provider value={{state, dispatch}}>
      {props.children}
    </AuthCTX.Provider>
  );
};
