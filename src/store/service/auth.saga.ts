import { API } from '@app/utils/constants';
import { instance } from '@app/utils/server/instance';
import { AxiosResponse } from 'axios';
import { call, put, takeLatest } from 'redux-saga/effects';
import {
  // logout
  logoutFailure,
  logoutSuccess,
  // Sign-in
  signInFailure,
  signInSuccess,
} from '../slice/auth.slice';
import Storage from '@app/utils/storage';
import { showMessage } from '@app/utils/helpers/Toast';

const { auth } = API;

const _header = {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
};

// Worker Saga: Handles the sign-in API call
function* handleSignIn(action: any) {
  try {
    const result: AxiosResponse<any> = yield call(
      instance.post,
      auth.login,
      action.payload,
    );
    console.log('result>>>>>', result);

    const { status, data } = result;

    if (status === 200 && data.meta.status) {
      yield put(
        signInSuccess({
          token: data.data.access_token,
          user: {
            id: data.data.id,
            name: data.data.name,
            phone: data.data.phone,
            role_id: data.data.role_id,
            role_name: data.data.role_name,
            district_id: data.data.district_id,
            municipality_id: data.data.municipality_id,
            district_name: data.data.district_name,
            municipality_name: data.data.municipality_name,
          },
        }),
      );
      showMessage(
        data.meta.message ||
          'Login Successful, You have been logged in successfully!',
      );
    } else {
      // Handle case where API returns 200 but meta.status is false
      const errorMessage = data.meta.message || 'Login failed';
      showMessage(errorMessage);
      yield put(signInFailure(errorMessage));
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.meta?.message ||
      error?.response?.data?.message ||
      error.message;
    showMessage(errorMessage);
    yield put(signInFailure(errorMessage));
  }
}

// Worker Saga: Handles the logout process
function* handleLogout() {
  try {
    /*
        const result: AxiosResponse<any> = yield call(instance.get, auth.logout);

        const {status, data} = result;

        if (status === 200) {
        // Clear local storage (if needed)
        yield call(Storage.clearAll);

        // Purge the persisted data
        yield call(persistor.purge);

        // Dispatch the logout action to reset the state
        yield put(logoutSuccess());
        }
    */

    // Clear local storage (if needed)
    yield call(Storage.clearAll);

    // Purge the persisted data
    // yield call(persistor.purge);

    // Dispatch the logout action to reset the state
    yield put(logoutSuccess());
    showMessage('Logout Successful, You have been logged out successfully!');
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.meta?.message ||
      error?.response?.data?.message ||
      error.message;
    showMessage(errorMessage);
    yield put(logoutFailure(errorMessage));
  }
}

function* authSaga() {
  yield takeLatest('auth/signInRequest', handleSignIn);
  yield takeLatest('auth/logoutRequest', handleLogout);
}

export default authSaga;
