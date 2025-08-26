import {AnyIfEmpty} from 'react-redux';

export type RootStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
  Settings: undefined;
  Resources: undefined;
  Notifications: undefined;
};

// -------------------------- API PROPS ----------------------------------

export interface SIGN_IN_TYPE {
  username: string;
  password: string;
}

export interface UPDATE_USER_INFORMATION {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: any;
}
