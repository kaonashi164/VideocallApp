import React from 'react';
import {View, Text} from 'react-native';

import {style} from './styles';
import {storage} from '@constants';
import {useAsyncStorage} from '@react-native-community/async-storage';
import {useFocusEffect, useTheme} from '@react-navigation/native';

export const SplashScreen = (props: any) => {
  const {getItem} = useAsyncStorage(storage.TOKEN);
  const {dark} = useTheme();

  useFocusEffect(() => {
    const bootstrapAsync = async () => {
      try {
        getItem((_, result) => {
          if (result) {
            return props.navigation.navigate('App');
          }
          return props.navigation.navigate('Auth');
        });
      } catch (e) {
        console.log(e);
      }
    };

    setTimeout(() => bootstrapAsync(), 2000);
  });

  return (
    <View style={style.container}>
      <Text style={{color: dark ? '#fff' : '#000'}}>Splash</Text>
    </View>
  );
};
