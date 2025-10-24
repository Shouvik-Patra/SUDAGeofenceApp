import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';



import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Splash from '../screens/splash/Splash';
import BottomTabNav from './BottomTabNav';
import Signin from '../screens/authScreens/Signin';
import Geotracking from '../screens/mainScreen/Geotracking';
import GeofencedAreaList from '../screens/mainScreen/GeofencedAreaList';
const Stack = createStackNavigator();
export default function StackNav() {
  const AuthReducer = useSelector(state => state.AuthReducer);
  console.log('mainstack>>>>', AuthReducer.getTokenResponse);

  const dispatch = useDispatch();

  const authScreens = {
    Signin: Signin,
  };
  const mainScreens = {
    BottomTabNav: BottomTabNav,
    Geotracking:Geotracking,
    GeofencedAreaList:GeofencedAreaList
  };
  if (AuthReducer?.isLoading) {
    return <Splash />;
  } else {
    return (
      <NavigationContainer>
        {AuthReducer.getTokenResponse === null ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {Object.entries({
              ...authScreens,
            }).map(([name, component]) => {
              return <Stack.Screen name={name} component={component} />;
            })}
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {Object.entries({
              ...mainScreens,
            }).map(([name, component]) => {
              return <Stack.Screen name={name} component={component} />;
            })}
          </Stack.Navigator>
        )}
     
      </NavigationContainer>
    );
  }
}
