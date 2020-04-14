import React, {useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import {
  AppearanceProvider,
  useColorScheme,
  Appearance,
} from 'react-native-appearance';
import {AuthStackContainer} from './Auth';
import {AppStackContainer} from './App';
import {SplashScreen} from '@screens/splash';
import {RootStackParamList} from '@types';
import {useAsyncStorage} from '@react-native-community/async-storage';
import {storage, THEME} from '@constants';

const RootStack = createStackNavigator<RootStackParamList>();

export const AppContainer = () => {
  const scheme = useColorScheme();

  useEffect(() => {
    const {getItem} = useAsyncStorage(storage.THEME);
    getItem((_, res) => {
      console.log(res, 'res');
      if (res && res !== scheme) {
        Appearance.set({colorScheme: res === THEME.DARK ? 'dark' : 'light'});
      }
    });
  }, []);

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
