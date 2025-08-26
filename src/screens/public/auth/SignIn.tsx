import {
  Dimensions,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardEvent,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { Colors, Fonts, Images } from '@app/themes';
import { moderateScale } from '@app/utils/orientation';
import Button from '@app/components/Button';
import TextInputWithButton from '@app/components/TextInputWithBotton';
import Loader from '@app/utils/helpers/Loader';
import {showMessage} from '@app/utils/helpers/Toast';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { APP_VERSION } from '@env';
import { signInRequest } from '@app/store/slice/auth.slice';

// Types
interface SigninProps {
  navigation: any; // You can type this more specifically based on your navigation setup
}

interface AuthState {
  status: string;
  // Add other auth state properties as needed
}

interface RootState {
  AuthReducer: AuthState;
}

interface LoginPayload {
  username: string;
  password: string;
  app_version: string;
}

const windowHeight = Dimensions.get('window').height;
let status = '';

const Login: React.FC<SigninProps> = (props) => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const AuthReducer = useSelector((state: RootState) => state.AuthReducer);
  console.log('login>>', AuthReducer);

  const [userName, setUserName] = useState<string>('development-Municipality');
  const [secure1, setSecure1] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('123456');
  const [keyboardShown, setKeyboardShown] = useState<boolean>(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event: KeyboardEvent) => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      (event: KeyboardEvent) => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app requires access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS case
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const employeeLogin = (): void => {
 if (userName === '') {
      showMessage('Please Enter username');
    } else if (password == '') {
      showMessage('Please Enter Password');
    } else {
       try {
        dispatch(
          signInRequest({
            username: userName.toLowerCase(),
            password,
            // expiresInMins: 1,
          }),
        );
      } catch (error) {
        console.log('Error in handleSignIn:', error);
      }
    }
  };



  return (
    <ImageBackground
      source={Images.pageBackground}
      resizeMode="cover"
      style={styles.onbordingStyle}
    >
      <Loader visible={AuthReducer?.status === 'Auth/signInRequest'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 15,
            paddingBottom: isKeyboardVisible ? moderateScale(200) : moderateScale(20),
          }}
        >
          <View style={{ width: '100%', paddingHorizontal: moderateScale(10) }}>
            <View style={styles.headerContain}>
              <Image
                resizeMode="contain"
                style={{
                  alignSelf: 'center',
                  height: moderateScale(100),
                  width: moderateScale(100),
                  marginTop: -30,
                }}
                source={Images.wb_logo}
              />

              <Text
                style={[
                  styles.headerText2,
                  { fontSize: 18, fontWeight: 'bold' },
                ]}
              >
                State Urban Development Agency
              </Text>
              <Text style={styles.headerText2}>
                Under Department of Urban Development & Municipal Affairs
              </Text>
              <Text
                style={[
                  styles.headerText2,
                  { fontSize: 16, fontWeight: 'bold' },
                ]}
              >
                Government of West Bengal
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              flex: 1,
              alignSelf: 'center',
              backgroundColor: Colors.white,
              borderRadius: moderateScale(10),
              alignItems: 'center',
              padding: 15,
              marginTop: 15,
            }}
          >
            <Text style={styles.headerText1}>Login</Text>
            <TextInputWithButton
              show={true}
              icon={true}
              height={moderateScale(45)}
              inputWidth={'100%'}
              marginTop={moderateScale(25)}
              textColor={Colors.textInputColor}
              InputHeaderText={'User Name'}
              placeholder={'Enter username'}
              placeholderTextColor={Colors.black}
              paddingLeft={moderateScale(25)}
              borderColor={Colors.inputGreyBorder}
              borderRadius={moderateScale(5)}
              editable={true}
              fontFamily={Fonts.MulishRegular}
              isheadertext={true}
              value={userName}
              fontSize={moderateScale(14)}
              headertxtsize={moderateScale(13)}
              onChangeText={(text: string) => setUserName(text)}
              tintColor={Colors.tintGrey}
            />
            <TextInputWithButton
              show={true}
              icon={true}
              height={moderateScale(45)}
              inputWidth={'100%'}
              marginTop={moderateScale(25)}
              textColor={Colors.textInputColor}
              InputHeaderText={'Password'}
              placeholder={'Enter password'}
              keyboardType={'email-address'}
              placeholderTextColor={Colors.black}
              paddingLeft={moderateScale(25)}
              borderColor={Colors.inputGreyBorder}
              borderRadius={moderateScale(5)}
              editable={true}
              fontFamily={Fonts.MulishRegular}
              isheadertext={true}
              value={password}
              fontSize={moderateScale(14)}
              headertxtsize={moderateScale(13)}
              onChangeText={(text: string) => setPassword(text)}
              isRightIconVisible
              rightimage={Images.eyeclose}
              rightimageheight={moderateScale(15)}
              rightimagewidth={moderateScale(15)}
              tintColor={Colors.tintGrey}
              secureTextEntry={secure1}
              onRightPress={() => {
                setSecure1(!secure1);
              }}
            />

          <Button title="Sign In" onPress={employeeLogin} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default Login;

const styles = StyleSheet.create({
  onbordingStyle: {
    flex: 1,
  },
  headerContain: {
    alignSelf: 'flex-start',
    marginTop: moderateScale(80),
    width: '100%',
  },
  underline: {
    width: moderateScale(55),
    height: moderateScale(3),
    borderRadius: moderateScale(15),
    backgroundColor: Colors.lightYellow,
    marginTop: moderateScale(5),
  },
  headerText1: {
    fontSize: moderateScale(22),
    marginTop: moderateScale(15),
    color: Colors.darkblue,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerText2: {
    fontFamily: Fonts.MulishSemiBold,
    fontSize: moderateScale(12),
    color: Colors.fontWhite,
    textAlign: 'center',
  },
  text1: {
    fontSize: moderateScale(12),
    color: '#B4B3BB',
    fontFamily: Fonts.MulishRegular,
  },
  fontregular: {
    fontSize: moderateScale(12),
    color: Colors.textInputColor,
    fontFamily: Fonts.MulishRegular,
  },
});