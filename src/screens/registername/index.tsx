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
import { DEVICE } from '@constants';
import { isIOS, returnConfirm } from '@utils';
import { RegisterNameScreenNavigationProp, RegisterNameScreenRouteProp } from '@types';
import { SpinnerOverlay } from '@components';
import { useMutation } from '@apollo/react-hooks';
import { M_UPDATE_USER } from '@graphql';

type Props = {
  navigation: RegisterNameScreenNavigationProp;
  route: RegisterNameScreenRouteProp
};

type State = {
  firstname?: string
  lastname?: string
};

export const RegisterNameScreen = (props: Props) => {
  //*_: Hook
  const [state, setState] = useState({
    firstname: '',
    lastname: ''
  })
  const [updateUser, { loading: updateLoading }] = useMutation(M_UPDATE_USER)

  //*_: Function

  const _updateUser = () => {
    if (!state.firstname || !state.lastname) {
      return returnConfirm('Vui lòng nhập đầy đủ thông tin')
    }

    updateUser({
      variables: {
        userId: props.route.params.userId,
        update: {
          firstname: state.firstname,
          lastname: state.lastname
        }
      }
    }).then(res => {
      if (res.data.updateUser) {
        props.navigation.push('Login')
      }
    }).catch(err => {
      console.log(err)
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

            <Text style={style.title}>REGISTER</Text>
            <Item style={style.item}>
              <Input
                style={style.input}
                placeholder="First Name"
                onChangeText={text => _setState({ firstname: text })}
                placeholderTextColor="#fff"
              />
            </Item>
            <Item style={style.item}>
              <Input
                style={style.input}
                placeholder="Last Name"
                onChangeText={text => _setState({ lastname: text })}
                placeholderTextColor="#fff"
              />
            </Item>

            <Button style={style.button} onPress={() => _updateUser()}>
              <Text style={{ color: '#fff' }}>CONFIRM</Text>
            </Button>
            <SpinnerOverlay visible={updateLoading} />
          </View>
        </TouchableWithoutFeedback>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};
