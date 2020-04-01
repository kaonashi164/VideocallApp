import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Button, Text} from 'native-base';
import {useColorScheme, Appearance} from 'react-native-appearance';

import {LoginScreen} from '@screens/login';

const AuthStack = createStackNavigator();

export const AuthStackContainer = () => {
  const theme = useColorScheme();
  return (
    <AuthStack.Navigator screenOptions={{gestureEnabled: false}}>
      <AuthStack.Screen
        options={{
          headerRight: () => (
            <Button
              onPress={() =>
                Appearance.set({
                  colorScheme: theme === 'dark' ? 'light' : 'dark',
                })
              }>
              <Text>Theme</Text>
            </Button>
          ),
          gestureEnabled: false,
        }}
        name="Login"
        component={LoginScreen}
      />
    </AuthStack.Navigator>
  );
};
