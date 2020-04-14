import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import {LoginScreen} from '@screens/login';
import {AuthStackParamList} from '@types';
import {DefaultScreen} from '@screens/default';
import {RegisterScreen} from '@screens/register';
import {RegisterNameScreen} from '@screens/registername';

const AuthStack = createStackNavigator<AuthStackParamList>();

export const AuthStackContainer = () => {
  return (
    <AuthStack.Navigator
      headerMode="none"
      screenOptions={{gestureEnabled: false}}>
      <AuthStack.Screen name="Default" component={DefaultScreen} />
      <AuthStack.Screen
        options={{
          gestureEnabled: false,
        }}
        name="Login"
        component={LoginScreen}
      />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="RegisterName" component={RegisterNameScreen} />
    </AuthStack.Navigator>
  );
};
