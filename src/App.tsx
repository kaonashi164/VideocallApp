import React from 'react';
import { ApolloProvider } from '@apollo/react-hooks';
import { AppContainer } from '@navigation';
import { AuthContext, GlobalContext } from '@context';
import { client } from '@graphql';
import { JanusServer, CustomNotification } from '@components';

export const AppProvider = () => {
  return (
    <AuthContext>
      <GlobalContext>
        <ApolloProvider client={client}>
          <JanusServer />
          <CustomNotification />
          <AppContainer />
        </ApolloProvider>
      </GlobalContext>
    </AuthContext>
  );
};
