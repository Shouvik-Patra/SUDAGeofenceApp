import {
  Dimensions,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { Colors, Fonts, Images } from '../../themes/ThemePath';
import normalize from '../../utils/helpers/normalize';
import Button from '../../components/Button';
import TextInputWithButton from '../../components/TextInputWithBotton';
import Loader from '../../utils/helpers/Loader';
import showErrorAlert from '../../utils/helpers/Toast';
import { useDispatch, useSelector } from 'react-redux';
import { signInRequest } from '../../redux/reducer/AuthReducer';
import connectionrequest from '../../utils/helpers/NetInfo';
const windowHeight = Dimensions.get('window').height;
let status = '';
const Signin = props => {
  const dispatch = useDispatch();
  const AuthReducer = useSelector(state => state.AuthReducer);
  console.log('login>>', AuthReducer);

  const [phone, setPhone] = useState('');
  const [secure1, setSecure1] = useState(false);
  const [password, setPassword] = useState('');
  const [keyboardShown, setKeyboardShown] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true); // or some other action
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false); // or some other action
      },
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const employeeLogin = () => {
    global.user_type ='admin'
    setLoading(true);
    if (phone === '') {
      showErrorAlert('Please Enter username');
    } else if (password == '') {
      showErrorAlert('Please Enter Password');
    } else {
      let obj = {
        username: phone.trim(),
        password: password,
      };
      console.log('objobjobjobjobj', obj);
      connectionrequest()
        .then(() => {
          dispatch(signInRequest(obj));
        })
        .catch(err => {
          showErrorAlert('Please connect to internet');
        });
    }
  };
  if (status == '' || AuthReducer.status != status) {
    switch (AuthReducer.status) {
      case 'Auth/signInRequest':
        status = AuthReducer.status;
        break;
      case 'Auth/signInSuccess':
        status = AuthReducer.status;
        setLoading(false);
        props.navigation.navigate('BottomTabNav');
        break;
      case 'Auth/signInFailure':
        status = AuthReducer.status;
        setLoading(false);
        break;
    }
  }
  return (
    <ImageBackground
      source={Images.appBG}
      resizeMode="cover"
      style={styles.onbordingStyle}
    >
      <Loader visible={loading} />
      <SafeAreaView style={{ flex: 1, width: '100%' }}>
        <View style={{ width: '100%', paddingHorizontal: normalize(10) }}>
          <View style={styles.headerContain}>
            <Image
              resizeMode="contain"
              style={{
                alignSelf: 'center',
                height: normalize(100),
                width: normalize(100),
                marginTop:-30
              }}
              source={Images.wblogo}
            />

            <Text style={[styles.headerText2,{fontSize:18,fontWeight:'bold'}]}>
              State Urban Development Agency
            </Text>
            <Text style={styles.headerText2}>
              Under Department of Urban Development & Municipal Affairs
            </Text>
            <Text style={[styles.headerText2,{fontSize:16,fontWeight:'bold'}]}>Government of West Bengal</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{
            // paddingHorizontal: normalize(20),
            maxHeight: windowHeight - normalize(200),
            backgroundColor: '#FFF',
            borderRadius: normalize(10),
            borderWidth:2,
            borderColor:Colors.green,
            padding: normalize(15),
            flex: 1,
            position: 'absolute',
            bottom: '10%',
            alignSelf: 'center',
            width: '90%',
          }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: isKeyboardVisible ? normalize(200) : normalize(20),
          }}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
          >
            <View
              style={{
                width: '100%',
                height: normalize(350),
                alignSelf: 'center',
                backgroundColor: Colors.white,
                borderRadius: normalize(10),
                alignItems: 'center',
              }}
            >
              <Text style={styles.headerText1}>Login</Text>
              <TextInputWithButton
                show={true}
                icon={true}
                height={normalize(45)}
                inputWidth={'100%'}
                marginTop={normalize(25)}
                textColor={Colors.textInputColor}
                InputHeaderText={'User Name'}
                placeholder={'Enter username'}
                placeholderTextColor={Colors.black}
                paddingLeft={normalize(25)}
                borderColor={Colors.inputGreyBorder}
                borderRadius={normalize(5)}
                editable={true}
                fontFamily={Fonts.MulishRegular}
                isheadertext={true}
                value={phone}
                fontSize={normalize(14)}
                headertxtsize={normalize(13)}
                onChangeText={e => setPhone(e)}
                tintColor={Colors.tintGrey}
              />
              <TextInputWithButton
                show={true}
                icon={true}
                height={normalize(45)}
                inputWidth={'100%'}
                marginTop={normalize(25)}
                textColor={Colors.textInputColor}
                InputHeaderText={'New Password'}
                placeholder={'Enter password'}
                keyboardType={'email'}
                placeholderTextColor={Colors.black}
                paddingLeft={normalize(25)}
                borderColor={Colors.inputGreyBorder}
                borderRadius={normalize(5)}
                editable={true}
                fontFamily={Fonts.MulishRegular}
                isheadertext={true}
                value={password}
                fontSize={normalize(14)}
                headertxtsize={normalize(13)}
                onChangeText={e => setPassword(e)}
                isRightIconVisible
                rightimage={Images.eyeclose}
                rightimageheight={normalize(15)}
                rightimagewidth={normalize(15)}
                tintColor={Colors.tintGrey}
                secureTextEntry={secure1}
                onRightPress={() => {
                  setSecure1(!secure1);
                }}
              />

              <Button
                height={normalize(45)}
                marginTop={normalize(25)}
                borderRadius={normalize(10)}
                backgroundColor={Colors.button}
                title={'Signin'}
                fontSize={normalize(15)}
                fontFamily={Fonts.MulishSemiBold}
                textColor={'white'}
                onPress={() => {
                  employeeLogin();
                }}
              />
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default Signin;

const styles = StyleSheet.create({
  onbordingStyle: {
    flex: 1,
  },

  headerContain: {
    alignSelf: 'flex-start',
    marginTop: normalize(80),

    width: '100%',
  },
  underline: {
    width: normalize(55),
    height: normalize(3),
    borderRadius: normalize(15),
    backgroundColor: Colors.lightYellow,
    marginTop: normalize(5),
  },
  headerText1: {
    // fontFamily: Fonts.MulishRegular,
    fontSize: normalize(22),
    marginTop: normalize(15),
    color: Colors.green,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerText2: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: normalize(12),
    color: Colors.black,

    textAlign: 'center',
  },
  text1: {
    fontSize: normalize(12),
    color: '#B4B3BB',
    fontFamily: Fonts.MulishRegular,
  },
  fontregular: {
    fontSize: normalize(12),
    color: Colors.textInputColor,
    fontFamily: Fonts.MulishRegular,
  },
  contentWrapper: {
    // // height: normalize(370),
    // // position: 'absolute',
    // backgroundColor: Colors.white,
    // borderRadius: normalize(10),
    // width: '100%',
    // bottom: normalize(20),
    // padding: normalize(15)
  },
});
