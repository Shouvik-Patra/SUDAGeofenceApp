import {StatusBar, StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import MainStack from './src/navigation/MainStack';
import { useDispatch } from 'react-redux';
import { getTokenRequest } from './src/redux/reducer/AuthReducer';

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getTokenRequest());
  }, []);
  return (
    <>
      <StatusBar  
        animated={true}
        backgroundColor="black"
      />
    
      <MainStack />
    </>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
