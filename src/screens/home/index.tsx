import React, {useContext} from 'react';
import {View, Text, SafeAreaView} from 'react-native';
import {Button} from 'native-base';
import {useAsyncStorage} from '@react-native-community/async-storage';
import {storage, AUTH_CONTEXT} from '@constants';
import {AuthCTX} from '@context';

export const HomeScreen = (props: any) => {
  const {removeItem} = useAsyncStorage(storage.TOKEN);
  const authCtx = useContext(AuthCTX);
  console.log('render');
  return (
    <SafeAreaView>
      <View>
        <Text>Home</Text>
        <Text>{authCtx.state!.user}</Text>
        <Button
          onPress={() => {
            authCtx.dispatch!({
              type: AUTH_CONTEXT.ACTION.SET_USER,
              value: {user: '123'},
            });
          }}>
          <Text>Change Name</Text>
        </Button>
        <Button
          onPress={() => {
            removeItem(e => {
              console.log(e);
              props.navigation.navigate('Auth');
            });
          }}>
          <Text>Logout</Text>
        </Button>
        <Button
          onPress={() => {
            props.navigation.navigate('Friend');
          }}>
          <Text>Logout</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
};
