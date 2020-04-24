import gql from 'graphql-tag';

export const Q_MY_INFO = gql`
  {
    myInfo {
      _id
      username
      firstname
      lastname
      email
      phone
      isOnline
    }
  }
`;

export const Q_USERS = gql`
  {
    users {
      _id
      username
      firstname
      lastname
      email
      phone
      isOnline
    }
  }
`;

export const Q_CALL = gql`
  query($callId: ID) {
    call(callId: $callId) {
      _id
      createdAt
      createdBy {
        _id
        username
        firstname
        lastname
        email
        phone
        isOnline
      }
      status
      receiver {
        _id
        username
        firstname
        lastname
        email
        phone
        isOnline
      }
      startedAt
      endedAt
      isVideoCall
      isVoiceCall
      isRecord
    }
  }
`;
