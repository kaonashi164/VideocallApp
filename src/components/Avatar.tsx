import React from 'react';
import {View, Thumbnail, Text} from 'native-base';
import {StyleSheet} from 'react-native';

type Props = {
  imageURL?: string;
  firstname: string;
  lastname: string;
};

export const AvatarComponent = (props: Props) => {
  return props.imageURL ? (
    <Thumbnail square source={{uri: props.imageURL}} />
  ) : (
    <View style={styles.container}>
      <Text>
        {props.firstname[0].toUpperCase()}
        {props.lastname[0].toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    backgroundColor: 'grey',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
