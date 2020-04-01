import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeScreen} from '@screens/home';
import {FriendScreen} from '@screens/friends';

const AppStack = createStackNavigator();

const TabStack = createBottomTabNavigator();

export const AppStackContainer = () => {
  return (
    <AppStack.Navigator
      headerMode="none"
      screenOptions={{gestureEnabled: false}}>
      <AppStack.Screen
        options={{gestureEnabled: false}}
        name="Dashboard"
        component={TabStackContainer}
      />
    </AppStack.Navigator>
  );
};

export const TabStackContainer = () => {
  return (
    <TabStack.Navigator>
      <TabStack.Screen name="Home" component={HomeScreen} />
      <TabStack.Screen name="Friend" component={FriendScreen} />
    </TabStack.Navigator>
  );
};
