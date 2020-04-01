import React from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import {Button, Item, Input} from 'native-base';
import {useTheme} from '@react-navigation/native';

import {style} from './styles';
import {useAsyncStorage} from '@react-native-community/async-storage';
import {DEVICE} from '@constants';
import {useHeaderHeight} from '@react-navigation/stack';
import {isIOS} from '@utils';

export const LoginScreen = (props: any) => {
  //*_: Hook
  const {setItem} = useAsyncStorage('accessToken');
  const headerHeight = useHeaderHeight();
  const {dark} = useTheme();

  //*_: Function
  const _login = () => {
    setItem('token', () => {
      props.navigation.navigate('App');
    });
  };

  //*_: Render
  return (
    <KeyboardAvoidingView
      behavior={isIOS ? 'padding' : 'height'}
      style={{
        ...style.container,
        height: DEVICE.HEIGHT_SCREEN - headerHeight,
      }}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View
          style={{
            ...style.container,
            height: DEVICE.HEIGHT_SCREEN - headerHeight,
          }}>
          <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
          <Text style={{color: '#000'}}>Login</Text>
          <Item>
            <Input placeholder="Username" defaultValue="admin" />
          </Item>
          <Item>
            <Input
              placeholder="Password"
              defaultValue="12345678"
              secureTextEntry
            />
          </Item>
          <Button onPress={_login}>
            <Text>Login</Text>
          </Button>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
