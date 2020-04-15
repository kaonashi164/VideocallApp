import React, {useEffect} from 'react';
import {SafeAreaView, StatusBar} from 'react-native';
import {HomeScreenNavigationProp} from '@types';
import {useTheme} from '@react-navigation/native';

type Props = {
  navigation: HomeScreenNavigationProp;
};

export const HomeScreen = (props: Props) => {
  const {dark} = useTheme();

  useEffect(() => {}, []);

  return (
    <SafeAreaView>
      {/* <SpinnerOverlay visible={state.visible} /> */}
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
    </SafeAreaView>
  );
};
