import React, { useContext } from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { View, Text, SafeAreaView } from 'react-native';
import { Q_USERS, M_MAKE_CALL } from '@graphql';
import { ItemFriend } from './ItemFriend';
import { GlobalCTX } from '@context';
import { returnConfirm } from '@utils';

export const FriendScreen = () => {
  const { data, loading } = useQuery(Q_USERS);
  const { globalState, globalDispatch } = useContext(GlobalCTX)
  const [makeCall] = useMutation(M_MAKE_CALL)

  const _makeCall = (username, receiver, isVideoCall, isVoiceCall) => {
    makeCall({
      variables: {
        callInput: {
          receiver,
          isVideoCall,
          isVoiceCall
        }
      }
    }).then(({ data }) => {
      globalDispatch!({ type: 'SET_STATE', callId: data.makeCall })
      globalState!.doCall!(username, true, isVideoCall, data.makeCall)
    }).catch(err => {
      console.log(err)
      if (err.message === 'GraphQL error: USER_NOT_ONLINE') {
        return returnConfirm('Người dùng không online')
      }
    })
  }

  return (
    <SafeAreaView>
      {loading || !data.users ? (
        <View>
          <Text>Loading...</Text>
        </View>
      ) : (
          data.users
            .filter(user => user.username)
            .map(user => <ItemFriend makeCall={_makeCall} key={user._id} user={user} />)
        )}
    </SafeAreaView>
  );
};
