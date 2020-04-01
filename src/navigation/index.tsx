import React, {useContext} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import {AppearanceProvider, useColorScheme} from 'react-native-appearance';
import {AuthStackContainer} from './Auth';
import {AppStackContainer} from './App';
import {SplashScreen} from '@screens/splash';

const RootStack = createStackNavigator();

export const AppContainer = () => {
  const scheme = useColorScheme();

  return (
    <AppearanceProvider>
      <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootStack.Navigator
          headerMode="none"
          screenOptions={{gestureEnabled: false}}>
          <RootStack.Screen name="Loading" component={SplashScreen} />
          <RootStack.Screen name="App" component={AppStackContainer} />
          <RootStack.Screen name="Auth" component={AuthStackContainer} />
        </RootStack.Navigator>
      </NavigationContainer>
    </AppearanceProvider>
  );
};
