import {ApolloClient} from 'apollo-client';
import {WebSocketLink} from 'apollo-link-ws';
import {getMainDefinition} from 'apollo-utilities';
import {ApolloLink, split} from 'apollo-link';
import {setContext} from 'apollo-link-context';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {onError} from 'apollo-link-error';
import {createUploadLink} from 'apollo-upload-client';
import AsyncStorage from '@react-native-community/async-storage';
import {storage} from '@constants';

// @ts-ignore
const authLink = setContext(async ({headers}) => {
  const token = await AsyncStorage.getItem(storage.TOKEN);
  return {
    ...headers,
    headers: {
      'access-token': token ? token : '',
    },
  };
});

const errorLink = onError(({graphQLErrors, networkError}) => {
  if (process.env.NODE_ENV === 'development') {
    if (graphQLErrors)
      graphQLErrors.forEach(({message, locations, path}) =>
        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ),
      );
    if (networkError) console.log(`[Network error]: ${networkError}`);
  }
});

const httpLink = createUploadLink({
  uri: `http://devcloud3.digihcs.com:13278/graphql`,
});

const wsLink = new WebSocketLink({
  uri: 'ws://devcloud3.digihcs.com:13278/graphql',
  options: {
    reconnect: true,
    timeout: 30000,
    connectionParams: async () => {
      const token = await AsyncStorage.getItem(storage.TOKEN);
      return await {
        'access-token': token ? token : null,
      };
    },
  },
});

const terminatingLink = split(
  ({query}) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const cache = new InMemoryCache();

const defaultDataCache = {
  session: {
    me: null,
    __typename: 'User',
  },
  loading: false,
};

cache.writeData({
  data: defaultDataCache,
});

const client = new ApolloClient({
  link: ApolloLink.from([authLink, errorLink, terminatingLink]),
  // typeDefs,
  // resolvers,
  cache,
});

client.onResetStore(
  async () => await cache.writeData({data: defaultDataCache}),
);

export {client};
