import React, {useContext, useEffect} from 'react';
import {GlobalCTX} from '@context';
import {useSubscription, useQuery} from '@apollo/react-hooks';
import {S_NOTIFICATION, Q_CALL} from '@graphql';
import {returnConfirm} from '@utils';

export const CustomNotification = () => {
  const {globalDispatch} = useContext(GlobalCTX);
  const {data, error} = useSubscription(S_NOTIFICATION);
  const {refetch} = useQuery(Q_CALL, {
    variables: {
      callId: '',
    },
    skip: true,
  });

  useEffect(() => {
    if (error) {
      console.log(error);
    }
    if (data && data.onGlobalNotification && data.onGlobalNotification.data) {
      const {onGlobalNotification} = data;
      const {callId} = JSON.parse(onGlobalNotification.data);
      if (callId) {
        globalDispatch!({
          type: 'SET_STATE',
          callId,
        });
        refetch({callId})
          .then(({data}) =>
            globalDispatch!({type: 'SET_STATE', currentCall: data.call}),
          )
          .catch(err => returnConfirm(err.message));
      }
    }

    console.log('SUBCROP{T');
  }, [error, data]);

  return <React.Fragment />;
};
