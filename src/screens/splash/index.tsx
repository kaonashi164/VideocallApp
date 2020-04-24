import React, { useEffect, useContext } from 'react';
import { ImageBackground, PermissionsAndroid } from 'react-native';
import { useAsyncStorage } from '@react-native-community/async-storage';
import { PERMISSIONS, checkMultiple } from 'react-native-permissions';

import Image from '@images/technical.jpg';
import { storage } from '@constants';
import { useLazyQuery } from '@apollo/react-hooks';
import { Q_MY_INFO } from '@graphql';
import { SplashScreenNavigationProp } from '@types';
import { AuthCTX } from '@context';
import { isAndroid, isIOS } from '@utils';

type Props = {
  navigation: SplashScreenNavigationProp;
};

export const SplashScreen = (props: Props) => {
  const { getItem } = useAsyncStorage(storage.TOKEN);
  const { dispatch } = useContext(AuthCTX);
  const [queryMyInfo, { data }] = useLazyQuery(Q_MY_INFO);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        if (data && data.myInfo) {
          dispatch!({ type: 'SET_USER', value: { user: data.myInfo } });
          return props.navigation.navigate('App');
        }
        getItem((_, result) => {
          if (result) {
            return queryMyInfo();
          }
          return props.navigation.navigate('Auth');
        });
      } catch (e) {
        console.log(e);
      }
    };

    if (isAndroid) {
      checkMultiple([
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.CALL_PHONE,
      ]).then(statuses => {
        if (statuses[PERMISSIONS.ANDROID.CAMERA] !== 'granted') {
          PermissionsAndroid.request(PERMISSIONS.ANDROID.CAMERA).then(
            resultCamera => {
              console.log('CAMERA', resultCamera);
              if (statuses[PERMISSIONS.ANDROID.CALL_PHONE] !== 'granted') {
                PermissionsAndroid.request(PERMISSIONS.ANDROID.CALL_PHONE).then(
                  resultMicro => {
                    console.log('MICRO', resultMicro);
                  },
                );
              }
            },
          );
        }
      });
    } else if (isIOS) {
    }

    bootstrapAsync();
  }, [data]);

  return <ImageBackground source={Image} style={{ flex: 1 }} />;
};
