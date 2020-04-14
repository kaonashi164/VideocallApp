import React, { useEffect, useContext } from 'react';
import { ImageBackground } from 'react-native';
import { useAsyncStorage } from '@react-native-community/async-storage';
import { requestMultiple, PERMISSIONS } from 'react-native-permissions'

import Image from '@images/technical.jpg';
import { storage } from '@constants';
import { useLazyQuery } from '@apollo/react-hooks';
import { Q_MY_INFO } from '@graphql';
import { SplashScreenNavigationProp } from '@types';
import { AuthCTX } from '@context';

type Props = {
  navigation: SplashScreenNavigationProp
}

export const SplashScreen = (props: Props) => {
  const { getItem } = useAsyncStorage(storage.TOKEN);
  const { dispatch } = useContext(AuthCTX)
  const [queryMyInfo, { data }] = useLazyQuery(Q_MY_INFO)

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        if (data && data.myInfo) {
          dispatch!({ type: 'SET_USER', value: { user: data.myInfo } })
          return props.navigation.navigate('App')
        }
        getItem((_, result) => {
          if (result) {
            return queryMyInfo()
          }
          return props.navigation.navigate('Auth');
        });
      } catch (e) {
        console.log(e);
      }
    };

    // requestMultiple([PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE]).then(
    //   statuses => {
    //     console.log('CAMERA', statuses[PERMISSIONS.IOS.CAMERA])
    //     console.log('MICROPHONE', statuses[PERMISSIONS.IOS.MICROPHONE])
    //   }
    // )

    bootstrapAsync()
  }, [data]);

  return <ImageBackground source={Image} style={{ flex: 1 }} />;
};
