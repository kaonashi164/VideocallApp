import {TUser} from './Data';

export type AuthDispatch = {
  type: 'SET_USER' | undefined;
  value?: {
    user?: TUser;
  };
};
export interface AuthContextType {
  dispatch?: React.Dispatch<AuthDispatch>;
  state?: {
    user: TUser;
  };
}
