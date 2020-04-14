import React, { useState, useContext, useEffect } from 'react';
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
import { useMutation, useLazyQuery } from '@apollo/react-hooks';
import { useAsyncStorage } from '@react-native-community/async-storage';

import Image from '@images/background.jpg';
import { DEVICE, _code, storage } from '@constants';
import { isIOS, returnConfirm } from '@utils';
import { LoginScreenNavigationProp } from '@types';
import { AuthCTX } from '@context';
import { SpinnerOverlay, Icon } from '@components';
import { M_LOGIN, Q_MY_INFO } from '@graphql';
import { style } from './styles';

type Props = {
  navigation: LoginScreenNavigationProp;
};

type State = {
  username?: string;
  password?: string;
  visible?: boolean;
  loading?: boolean
};

export const LoginScreen = (props: Props) => {
  //*_: Hook
  const { setItem } = useAsyncStorage(storage.TOKEN);
  const { dispatch } = useContext(AuthCTX);
  const [state, setState] = useState({
    username: 'Admin',
    password: '12345678',
    visible: false,
    loading: false
  });
  const [
    login,
  ] = useMutation(M_LOGIN);
  const [queryMyInfo, { data }] = useLazyQuery(Q_MY_INFO)

  useEffect(() => {
    if (data) {
      dispatch!({ type: 'SET_USER', value: { user: data.myInfo } })
      props.navigation.navigate('Home')
    }
  }, [data])

  //*_: Function
  const _login = () => {
    Keyboard.dismiss()
    login({
      variables: {
        loginInput: {
          username: state.username,
          password: state.password,
        },
      },
    }).then((res) => {
      setItem(res.data.login.token, () => {
        queryMyInfo()
      })
    }).catch((err) => {
      if (err.message === `GraphQL error: ${_code.USER_NOT_FOUND}`) {
        return returnConfirm('Tài khoản không tồn tại')
      }
    })
  };

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

            <Text style={style.title}>WELCOME BACK</Text>
            <Item style={style.item}>
              <Input
                style={{ backgroundColor: '#fff' }}
                placeholder="Username"
                defaultValue='Admin'
                onChangeText={text => _setState({ username: text })}
              />
            </Item>
            <Item style={style.item}>
              <Input
                style={{ backgroundColor: '#fff' }}
                placeholder="Password"
                defaultValue='12345678'
                onChangeText={text => _setState({ password: text })}
                secureTextEntry
              />
            </Item>
            <Button style={style.button} onPress={() => _login()}>
              <Text style={{ color: '#fff' }}>LOGIN IN</Text>
            </Button>
            <SpinnerOverlay visible={state.loading} />
          </View>
        </TouchableWithoutFeedback>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};
