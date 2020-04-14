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
`

export const M_UPDATE_USER = gql`
  mutation($userId: ID!, $update:UpdateUserInput! ) {
    updateUser(userId: $userId, update: $update)
  }
`
