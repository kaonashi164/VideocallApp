import {ColorSchemeName} from 'react-native-appearance';

export interface DispatchType {
  type: string;
  value?: {
    colorScheme?: ColorSchemeName;
    user?: string;
  };
}
