import React, { useEffect, useContext } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { Text, View } from 'native-base';
import { useTheme } from '@react-navigation/native';

import { AuthCTX } from '@context';
import { AvatarComponent } from '@components';
import { styles } from './styles';

export const HomeScreen = () => {
  const { dark } = useTheme();
  const { state } = useContext(AuthCTX);

  useEffect(() => { }, []);

  return (
    <SafeAreaView>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <AvatarComponent firstname={state!.user.firstname} lastname={state!.user.lastname} />
          <View>
            <Text style={styles.fullname}>{state?.user.firstname} {state?.user.lastname}</Text>
            <Text style={styles.email}>{state?.user.email}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
