import {DispatchType} from './interface';

export interface AuthContextType {
  dispatch?: React.Dispatch<DispatchType>;
  state?: {
    user: string;
  };
}
