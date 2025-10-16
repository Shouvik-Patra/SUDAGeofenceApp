import React, {useEffect, useState} from 'react';
import {
  DefaultTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import {createStackNavigator, StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '@app/types';
import {useAppSelector} from '@app/store';
import {navigationRef} from './RootNaivgation';
import Home from '@screens/protected/home';
import Login from '@app/screens/public/auth/SignIn';
import Splash from '@app/screens/public/auth/Splash';
import GeofenceTracker from '@app/screens/protected/geoTracking';

const Stack = createStackNavigator<RootStackParamList>();

export default function StackNavigation() {
  const [isLoading, setIsLoading] = useState(true);
  const isToken = useAppSelector(state => state.auth.token);
console.log("isToken>>>>",isToken);

  const theme: Theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'white',
    },
  };

  const AuthScreens = {
    // Auth
    Login: Login,
  };

  const MainScreens = {
    // Main
    Home: Home,
    GeofenceTracker:GeofenceTracker
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false); // End splash after 1.5 seconds
    }, 1500);

    return () => clearTimeout(timer); 
  }, []);

  if (isLoading) {
    return <Splash />;
  }

  const Screens = isToken ? MainScreens : AuthScreens;

  return (
    <NavigationContainer ref={navigationRef} theme={theme}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {Object.entries(Screens).map(([name, component], index) => (
          <Stack.Screen
            key={index}
            name={name as keyof RootStackParamList} // Casting the name to RootStackParamList keys
            component={
              component as React.ComponentType<
                StackScreenProps<RootStackParamList>
              >
            }
            options={{gestureEnabled: true}}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
