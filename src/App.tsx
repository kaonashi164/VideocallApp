import React from 'react';
import {AuthContext} from './context';
import {AppContainer} from '@navigation';
import {GlobalContext} from './context/GlobalContext';

export const AppProvider = () => {
  return (
    <AuthContext>
      <GlobalContext>
        <AppContainer />
      </GlobalContext>
    </AuthContext>
  );
};
