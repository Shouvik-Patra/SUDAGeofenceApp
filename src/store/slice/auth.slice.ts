import { SIGN_IN_TYPE } from '@app/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserData {
  id: number;
  name: string;
  phone: string;
  role_id: number;
  role_name: string;
  district_id: number;
  municipality_id: number;
  district_name: string;
  municipality_name: string;
}

interface AuthState {
  refreshToken: string;
  token: string;
  user: UserData | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  refreshToken: '',
  token: '',
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Sign-in
    signInRequest(state, action: PayloadAction<SIGN_IN_TYPE>) {
      state.loading = true;
      state.error = null;
    },
    signInSuccess(
      state,
      action: PayloadAction<{ token: string; user: UserData }>,
    ) {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
    },
    signInFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // logout
    logoutRequest(state) {
      state.loading = true;
      state.error = null;
    },
    logoutSuccess(state) {
      state.token = '';
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    logoutFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    setToken(state, action: PayloadAction<{ token: string; user?: UserData }>) {
      state.loading = false;
      state.token = action.payload.token;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
      state.error = null;
    },
  },
});

export const {
  // Sign-in
  signInRequest,
  signInSuccess,
  signInFailure,

  //logout
  logoutRequest,
  logoutSuccess,
  logoutFailure,

  // set token
  setToken,
} = authSlice.actions;

export default authSlice.reducer;
