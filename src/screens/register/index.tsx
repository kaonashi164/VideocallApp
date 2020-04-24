import React, { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  ImageBackground,
} from 'react-native';
import { Button, Item, Input } from 'native-base';

import Image from '@images/background.jpg';
import { style } from './styles';
import { DEVICE, _code } from '@constants';
import { isIOS, returnConfirm } from '@utils';
import { LoginScreenNavigationProp } from '@types';
import { SpinnerOverlay, Icon } from '@components';
import { useMutation } from '@apollo/react-hooks';
import { M_REGISTER } from '@graphql';

type Props = {
  navigation: LoginScreenNavigationProp;
};

type State = {
  username?: string;
  password?: string;
  confirmPassword?: string;
  email?: string;
  mobile?: string;
};

export const RegisterScreen = (props: Props) => {
  //*_: Hook
  const [state, setState] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    mobile: '',
  });

  const [register, { loading: registerLoading }] = useMutation(M_REGISTER)

  //*_: Function
  const _register = () => {
    Keyboard.dismiss()
    if (!state.username || !state.password || !state.mobile || !state.email || !state.confirmPassword) {
      return returnConfirm('Vui lòng nhập đầy đủ thông tin')
    }

    if (state.password !== state.confirmPassword) {
      return returnConfirm('Mật khẩu xác thực không chính xác')
    }

    register({
      variables: {
        newUser: {
          username: state.username,
          password: state.password,
          email: state.email,
          phone: state.mobile
        }
      }
    }).then((res) => {
      if (res.data.register) {
        props.navigation.navigate('RegisterName', { userId: res.data.register })
      }
    }).catch((err) => {
      if (err.message === `GraphQL error: ${_code.ALREADY_USERNAME}`) {
        return returnConfirm('Tài khoản đã có người sử dụng')
      }

    })
  }

  const _setState = (state: State) => setState(prev => ({ ...prev, ...state }));

  //*_: Render
  return (
    <KeyboardAvoidingView
      behavior={isIOS ? 'padding' : 'height'}
      style={style.container}>
      <ImageBackground
        source={Image}
        style={{
          flex: 1,
          justifyContent: 'center',
        }}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View
            style={[style.container, { paddingTop: DEVICE.HEIGHT_SCREEN / 5 }]}>
            <StatusBar barStyle="light-content" />

            <Button
              style={style.backBtn}
              onPress={() => props.navigation.goBack()}>
              <Icon name="chevron-left" style={style.backIcon} />
              <Text style={style.backTitle}>Back</Text>
            </Button>

            <Text style={style.title}>REGISTER</Text>
            <Item style={style.item}>
              <Input
                style={style.input}
                placeholder="Username"
                onChangeText={text => _setState({ username: text })}
                placeholderTextColor="#fff"
              />
            </Item>
            <Item style={style.item}>
              <Input
                style={style.input}
                placeholder="Email"
                onChangeText={text => _setState({ email: text })}
                placeholderTextColor="#fff"
              />
            </Item>
            <Item style={style.item}>
              <Input
                style={style.input}
                placeholder="Password"
                onChangeText={text => _setState({ password: text })}
                placeholderTextColor="#fff"
                secureTextEntry
              />
            </Item>
            <Item style={style.item}>
              <Input
                style={style.input}
                placeholder="Confirm Password"
                onChangeText={text => _setState({ confirmPassword: text })}
                secureTextEntry
                placeholderTextColor="#fff"
              />
            </Item>

            <Item style={style.item}>
              <Input
                style={style.input}
                placeholder="Mobile"
                onChangeText={text => _setState({ mobile: text.toString() })}
                placeholderTextColor="#fff"
                keyboardType="numeric"
              />
            </Item>
            <Button
              style={style.button}
              onPress={() => _register()}>
              <Text style={{ color: '#fff' }}>REGISTER</Text>
            </Button>
            <SpinnerOverlay visible={registerLoading} />
          </View>
        </TouchableWithoutFeedback>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};
