import {View, Text, Image, StyleSheet} from 'react-native';
import React from 'react';

const Splash = () => {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Image
        source={{
          uri: 'https://cdn-icons-png.flaticon.com/128/6415/6415824.png',
        }}
        style={styles.logo}
      />
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 20,
  },
});
