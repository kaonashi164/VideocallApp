import React from 'react';
import IconAwesome from 'react-native-vector-icons/FontAwesome';
import {ViewStyle, TextStyle} from 'react-native';

type Props = {
  name: string;
  style?: ViewStyle | TextStyle;
};

export const Icon = (props: Props) => {
  return <IconAwesome style={props.style} name={props.name} />;
};
