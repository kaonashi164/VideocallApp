import React, {useContext} from 'react';
import {View, Text, SafeAreaView} from 'react-native';
import {Button} from 'native-base';
import {useAsyncStorage} from '@react-native-community/async-storage';
import {storage} from '@constants';
import {AuthCTX} from '@context';
import {FriendScreenNavigationProp} from '@types';

type Props = {
  navigation: FriendScreenNavigationProp;
};

export const FriendScreen = (props: Props) => {
  const {removeItem} = useAsyncStorage(storage.TOKEN);
  const authCtx = useContext(AuthCTX);
  console.log('render');
  return (
    <SafeAreaView>
      <View>
        <Text>Friend</Text>
        <Text>{authCtx.state!.user.email}</Text>
        <Button>
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
      </View>
    </SafeAreaView>
  );
};
