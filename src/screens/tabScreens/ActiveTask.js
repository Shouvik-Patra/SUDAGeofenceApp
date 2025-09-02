import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Header from '../../components/Header';
import { useSelector } from 'react-redux';
import { Colors, Fonts } from '../../themes/ThemePath';
import TaskApproval from './TaskApproval';
import DailyTask from './DailyTask';

const Tab = createMaterialTopTabNavigator();
const TaskTabs = () => {
  return (
    <Tab.Navigator
      lazy={true}
      swipeEnabled={true}
      lazyPreloadDistance={0} // Only load when actually viewed
      screenOptions={({ route }) => ({
        lazy: true,
        tabBarLabelStyle: {
          fontSize: 16,
          fontFamily: Fonts.MulishBold,
          color: Colors.white,
        },
        tabBarIndicatorStyle: {
          backgroundColor: Colors.white,
          height: 3,
        },
        tabBarStyle: {
          backgroundColor: Colors.orange,
        },
      })}
    >
      <Tab.Screen 
        name="Daily Task" 
        component={DailyTask}
        options={{
          lazy: true,
        }}
      />
      <Tab.Screen 
        name="Task Approval" 
        component={TaskApproval} 
        options={{ 
          lazy: true,
          unmountOnBlur: true,
        }}
      />
    </Tab.Navigator>
  );
};

const ActiveTask = ({ navigation }) => {

  return (
    <View style={styles.container}>
      <Header
        HeaderLogo
        Title
        placeText={'Activity'}
        onPress_back_button={() => navigation.goBack()}
        onPress_right_button={() => navigation.navigate('Notification')}
      />
      <TaskTabs />
    </View>
  );
};

export default ActiveTask;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495e',
  },
});
