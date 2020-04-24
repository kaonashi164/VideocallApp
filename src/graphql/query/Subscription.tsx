import gql from 'graphql-tag';

export const S_NOTIFICATION = gql`
  subscription {
    onGlobalNotification {
      pubsubCreatedBy
      code
      data
      receiver
    }
  }
`;
