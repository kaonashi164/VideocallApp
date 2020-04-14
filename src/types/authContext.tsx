export interface AuthDispatch {
  type: 'SET_USER' | undefined;
  value?: {
    user?: {
      firstname: string
      lastname: string
      email: string
      phone: string
      username: string
    }
  };
}
export interface AuthContextType {
  dispatch?: React.Dispatch<AuthDispatch>;
  state?: {
    user: {
      firstname: string
      lastname: string
      email: string
      phone: string
      username: string
    }
  };
}
