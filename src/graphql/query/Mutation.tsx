import gql from 'graphql-tag';

export const M_LOGIN = gql`
  mutation($loginInput: LoginInput!) {
    login(loginInput: $loginInput) {
      token
    }
  }
`;

export const M_REGISTER = gql`
  mutation($newUser: NewUserInput!) {
    register(newUser: $newUser)
  }
`;

export const M_UPDATE_USER = gql`
  mutation($userId: ID!, $update: UpdateUserInput!) {
    updateUser(userId: $userId, update: $update)
  }
`;

export const M_MAKE_CALL = gql`
  mutation($callInput: CallInput!) {
    makeCall(callInput: $callInput)
  }
`;

export const M_REFUSE_CALL = gql`
  mutation($callId: ID!) {
    refuseCall(callId: $callId)
  }
`;

export const M_CANCEL_CALL = gql`
  mutation($callId: ID!) {
    cancelCall(callId: $callId)
  }
`;

export const M_ACCEPT_CALL = gql`
  mutation($callId: ID!) {
    acceptCall(callId: $callId)
  }
`;

export const M_END_CALL = gql`
  mutation($callId: ID!) {
    endCall(callId: $callId)
  }
`;
