import React from 'react';
import {ApolloProvider} from '@apollo/react-hooks';
import {AppContainer} from '@navigation';
import {AuthContext, GlobalContext} from '@context';
import {client} from '@graphql';

export const AppProvider = () => {
  return (
    <AuthContext>
      <GlobalContext>
        <ApolloProvider client={client}>
          <AppContainer />
        </ApolloProvider>
      </GlobalContext>
    </AuthContext>
  );
};
