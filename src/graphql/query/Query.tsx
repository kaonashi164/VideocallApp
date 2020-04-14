import gql from "graphql-tag";

export const Q_MY_INFO = gql`
  {
    myInfo {
      username
      firstname
      lastname
      email
      phone
      
    }
  }
`