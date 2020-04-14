import React, { useReducer } from 'react';
import { AuthContextType, AuthDispatch } from 'src/types';

const AuthCTX = React.createContext<AuthContextType>({});

export { AuthCTX };

export const AuthContext = (props: any) => {
  const [state, dispatch] = useReducer(
    (prevState: any, action: AuthDispatch) => {
      switch (action.type) {
        case 'SET_USER': {
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
      user: undefined,
    },
  );

  return (
    <AuthCTX.Provider value={{ state, dispatch }}>
      {props.children}
    </AuthCTX.Provider>
  );
};
