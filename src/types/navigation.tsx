import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Default: undefined;
  Login: undefined;
  Register: undefined;
  RegisterName: { userId: string };
};

export type TabStackParamList = {
  Home: undefined;
  Friend: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
};

export type RootStackParamList = {
  Loading: undefined;
  App: undefined;
  Auth: undefined;
};

export type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Loading'>

export type LoginScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AuthStackParamList, 'Login'>,
  CompositeNavigationProp<
    StackNavigationProp<RootStackParamList>,
    BottomTabNavigationProp<TabStackParamList>
  >
>;

export type DefaultScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AuthStackParamList, 'Default'>,
  CompositeNavigationProp<
    StackNavigationProp<RootStackParamList>,
    BottomTabNavigationProp<TabStackParamList>
  >
>;

export type RegisterScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AuthStackParamList, 'Register'>,
  CompositeNavigationProp<
    StackNavigationProp<RootStackParamList>,
    BottomTabNavigationProp<TabStackParamList>
  >
>;

export type RegisterNameScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AuthStackParamList, 'RegisterName'>,
  CompositeNavigationProp<
    StackNavigationProp<RootStackParamList>,
    BottomTabNavigationProp<TabStackParamList>
  >
>;

export type RegisterNameScreenRouteProp = RouteProp<AuthStackParamList, 'RegisterName'>

export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabStackParamList, 'Home'>,
  CompositeNavigationProp<
    StackNavigationProp<AuthStackParamList>,
    StackNavigationProp<RootStackParamList>
  >
>;

export type FriendScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabStackParamList, 'Friend'>,
  CompositeNavigationProp<
    StackNavigationProp<AuthStackParamList>,
    StackNavigationProp<RootStackParamList>
  >
>;
