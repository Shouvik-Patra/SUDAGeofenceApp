import { call, put, select, takeLatest } from 'redux-saga/effects';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApi, postApi } from '../../utils/helpers/ApiRequest';

import {
  createParkGeofenceFailure,
  createParkGeofenceSuccess,
  getParkGeofencesListFailure,
  getParkGeofencesListSuccess,
  geofencedArealistSuccess,
  geofencedArealistFailure,
  userDetailsSuccess,
  userDetailsFailure,
} from '../reducer/ProfileReducer';
import showErrorAlert from '../../utils/helpers/Toast';
import { getTokenSuccess, logoutSuccess } from '../reducer/AuthReducer';
import constants from '../../utils/helpers/constants';
let getItem = state => state.AuthReducer;

export function* getParkUserDetailsfences(action) {
  let items = yield select(getItem);

  let header = {
    Accept: 'application/json',
    contenttype: 'application/json',
    accesstoken: items?.getTokenResponse,
  };

  try {
    let response = yield call(getApi, 'park/getParkAdminDetails', header);

    if (response?.data?.meta?.code == 200) {
      yield put(userDetailsSuccess(response?.data?.data));
    } else {
      yield put(userDetailsFailure(response?.data?.data));
      showErrorAlert(response?.data?.meta?.message);
    }
  } catch (error) {
    console.log('add address error:', error);
    yield put(userDetailsFailure(error));
    if (error?.response?.data?.meta?.message == 'Token is invalid or expired') {
      yield call(AsyncStorage.removeItem, constants.TOKEN);
      yield put(getTokenSuccess(null));
      yield put(logoutSuccess());
    }
  }
}
export function* getParkGeofences(action) {
  let items = yield select(getItem);

  let header = {
    Accept: 'application/json',
    contenttype: 'application/json',
    accesstoken: items?.getTokenResponse,
  };

  try {
    let response = yield call(getApi, 'parkDetails', header);

    if (response?.data?.meta?.code == 200) {
      yield put(getParkGeofencesListSuccess(response?.data?.data));
    } else {
      yield put(getParkGeofencesListFailure(response?.data?.data));
      showErrorAlert(response?.data?.meta?.message);
    }
  } catch (error) {
    console.log('add address error:', error);
    yield put(getParkGeofencesListFailure(error));
    if (error?.response?.data?.meta?.message == 'Token is invalid or expired') {
      yield call(AsyncStorage.removeItem, constants.TOKEN);
      yield put(getTokenSuccess(null));
      yield put(logoutSuccess());
    }
  }
}

export function* createParkGeofenceSaga(action) {
  let items = yield select(getItem);

  try {
    let Header = {
      Accept: 'application/json',
      contenttype: 'application/json',
      accesstoken: items?.getTokenResponse,
    };

    const response = yield call(
      postApi,
      'createParkGeofence',
      action.payload,
      Header,
    );
    if (response?.data?.meta?.code == 200) {
      yield put(createParkGeofenceSuccess(response?.data?.data));
      // showErrorAlert(response?.data?.meta?.message);
      showErrorAlert(response?.data?.meta?.message, 'success');
    } else {
      yield put(createParkGeofenceFailure(response?.data?.data));
      // showErrorAlert(response?.data?.meta?.message);
      showErrorAlert(response?.data?.meta?.message, 'error');
    }
  } catch (error) {
    yield put(createParkGeofenceFailure(error?.response?.data));
    // showErrorAlert(error?.response?.data?.meta?.message);
  }
}

export function* getgeofencedAreaList(action) {
  let items = yield select(getItem);

  let header = {
    Accept: 'application/json',
    contenttype: 'application/json',
    accesstoken: items?.getTokenResponse,
  };

  try {
    let response = yield call(getApi, 'getParkGeofences', header);

    if (response?.data?.meta?.code == 200) {
      yield put(geofencedArealistSuccess(response?.data?.data));
    } else {
      yield put(geofencedArealistFailure(response?.data?.data));
      showErrorAlert(response?.data?.meta?.message);
    }
  } catch (error) {
    console.log('add address error:', error);
    yield put(geofencedArealistFailure(error));
    if (error?.response?.data?.meta?.message == 'Token is invalid or expired') {
      yield call(AsyncStorage.removeItem, constants.TOKEN);
      yield put(getTokenSuccess(null));
      yield put(logoutSuccess());
    }
  }
}
const watchFunction = [
  (function* () {
    yield takeLatest('Profile/userDetailsRequest', getParkUserDetailsfences);
  })(),
  (function* () {
    yield takeLatest('Profile/getParkGeofencesListRequest', getParkGeofences);
  })(),
  (function* () {
    yield takeLatest(
      'Profile/createParkGeofenceRequest',
      createParkGeofenceSaga,
    );
  })(),
  (function* () {
    yield takeLatest('Profile/geofencedArealistRequest', getgeofencedAreaList);
  })(),
];

export default watchFunction;
