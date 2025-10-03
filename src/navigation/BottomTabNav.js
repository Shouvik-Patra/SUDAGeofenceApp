import React from 'react';
import { Text, Image, View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors, Images } from '../themes/ThemePath';
import normalize from '../utils/helpers/normalize';
import Home from '../screens/tabScreens/Home';
import MyProfile from '../screens/tabScreens/MyProfile';

const Tab = createBottomTabNavigator();

const TabIcon = ({ focused, source }) => (
  <View style={[styles.tabIconContainer, focused && styles.focusedTabIcon]}>
    <Image
      style={[styles.tabIcon, focused && styles.focusedIcon]}
      source={source}
      resizeMode="contain"
    />
  </View>
);

const BottomTabNav = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        unmountOnBlur: true,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: styles.tabBarStyle,
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          unmountOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={Images.tab5} />
          ),
        }}
      />
      <Tab.Screen
        name="MyProfile"
        component={MyProfile}
        listeners={({ navigation }) => ({
          blur: () => navigation.setParams({ screen: undefined }),
        })}
        options={{
          unmountOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={Images.tab4} />
          ),
        }}
      />
    </Tab.Navigator>

  );
};

export default BottomTabNav;

const styles = StyleSheet.create({
  tabBarStyle: {
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.skyblue,
    borderTopRightRadius: normalize(20),
    borderTopLeftRadius: normalize(20),
    height: normalize(85),
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    top: Platform.OS === 'ios' ? normalize(5) : normalize(10),
    paddingVertical: normalize(15),
    paddingHorizontal: normalize(15),
    borderRadius: normalize(50),
  },
  focusedTabIcon: {
    backgroundColor: 'rgb(239, 250, 254)',
  },
  tabIcon: {
    height: normalize(20),
    width: normalize(20),
    tintColor: Colors.white,
  },
  focusedIcon: {
    tintColor: Colors.red,
  },
});
