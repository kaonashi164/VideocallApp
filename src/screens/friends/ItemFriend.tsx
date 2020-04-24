import React, { useContext } from 'react';
import { View, Text, Button } from 'native-base';

import { TUser } from '@types';
import { sItem } from './styles';
import { AuthCTX } from '@context';
import { CameraWhite, PhoneWhite } from '@icons';

type Props = {
  user: TUser;
  makeCall: Function
};

export const ItemFriend = (props: Props) => {
  const { state } = useContext(AuthCTX)
  return (
    <View style={sItem.container}>
      <Text>
        {`${props.user.firstname} ${props.user.lastname}`}
      </Text>


      {state?.user._id !== props.user._id && (
        <View style={sItem.groupBtn}>
          <Button style={sItem.button} onPress={() => props.makeCall(props.user.username, props.user._id, true, true)}>
            <CameraWhite width={30} height={30} />
          </Button>
          {/* <Button style={sItem.button} onPress={() => props.makeCall(props.user.username, props.user._id, false, true)}>
            <PhoneWhite width={30} height={30} />
          </Button> */}
        </View>
      )}

    </View>
  );
};
