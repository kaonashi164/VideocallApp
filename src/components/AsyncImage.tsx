import React, {useState} from 'react';
import {View, Image} from 'native-base';
import {ViewStyle, ImageStyle, Animated} from 'react-native';

type Props = {
  uri?: string;
  placeholderColor?: string;
  style?: ImageStyle;
};

type State = {
  loaded?: boolean;
  imageOpacity?: Animated.Value;
  placeholderOpacity?: Animated.Value;
  placeholderScale?: Animated.Value;
};

export const AsyncImage = (props: Props) => {
  const [state, setState] = useState({
    loaded: false,
    imageOpacity: new Animated.Value(0.0),
    placeholderOpacity: new Animated.Value(1.0),
    placeholderScale: new Animated.Value(1.0),
  });

  const _setState = (state: State) =>
    setState(prev => ({
      ...prev,
      ...state,
    }));

  const _onLoad = () => {
    const {placeholderScale, placeholderOpacity, imageOpacity} = state;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(placeholderScale, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(placeholderOpacity, {
          toValue: 0.66,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.parallel([
          Animated.timing(placeholderOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(placeholderScale, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(imageOpacity, {
          toValue: 1.0,
          delay: 200,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      _setState({loaded: true});
    });
  };

  return (
    <View style={props.style}>
      <Animated.Image
        source={{uri: props.uri}}
        style={[
          props.style,
          {
            opacity: state.imageOpacity,
            position: 'absolute',
            resizeMode: 'contain',
          },
        ]}
        onLoad={() => _onLoad()}
      />
      {!state.loaded && (
        <Animated.View
          style={[
            props.style,
            {
              backgroundColor: props.placeholderColor,
              opacity: state.placeholderOpacity,
              position: 'absolute',
              transform: [{scale: state.placeholderScale}],
            },
          ]}
        />
      )}
    </View>
  );
};
