import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import { Images } from '../../themes/ThemePath';

const Splash = props => {
  //  useEffect(() => {
  //   setTimeout(() => {
  //     props?.navigation.replace('Signin');
  //   }, 2000);
  // }, []);
  return (
    <ImageBackground
      style={{ flex: 1,justifyContent:'center',alignItems:'center' }}
      source={Images.appBG}
      resizeMode="cover"
    >
      <Image
        source={Images.wblogo}
        style={{
          zIndex:99,
          top:65,
          height: normalize(120),
          width: normalize(120),
        }}
        resizeMode="contain"
      />
      <Image
        source={Images.splash}
        style={{
          zIndex:98,
          height: normalize(250),
          width: normalize(250),
        }}
        resizeMode="contain"
      />
    </ImageBackground>
  );
};

export default Splash;

const styles = StyleSheet.create({});
