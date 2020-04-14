import React from 'react';
import {ImageBackground, StatusBar} from 'react-native';
import {Text, Button} from 'native-base';

import Image from '@images/background.jpg';
import {DefaultScreenNavigationProp} from '@types';
import {styles} from './styles';

type Props = {
  navigation: DefaultScreenNavigationProp;
};

export const DefaultScreen = (props: Props) => {
  return (
    <ImageBackground source={Image} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>WELCOME</Text>

      <Button
        onPress={() => props.navigation.navigate('Login')}
        style={[styles.button, {backgroundColor: 'rgba(16,16,16,0.3)'}]}>
        <Text>LOGIN IN</Text>
      </Button>

      <Button
        onPress={() => props.navigation.navigate('Register')}
        style={styles.button}>
        <Text>CREATE ACCOUNT</Text>
      </Button>
    </ImageBackground>
  );
};
