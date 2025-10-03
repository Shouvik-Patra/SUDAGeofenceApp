import { call, put, select, takeLatest } from 'redux-saga/effects';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApi, postApi } from '../../utils/helpers/ApiRequest';

import {
  createParkGeofenceFailure,
  createParkGeofenceSuccess,
  getParkGeofencesListFailure,
  getParkGeofencesListSuccess,
  geofencedArealistSuccess,
geofencedArealistFailure
} from '../reducer/ProfileReducer';
import showErrorAlert from '../../utils/helpers/Toast';
let getItem = state => state.AuthReducer;

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

    const response = yield call(postApi, 'createParkGeofence', action.payload, Header);
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
  }
}
const watchFunction = [

  (function* () {
    yield takeLatest('Profile/getParkGeofencesListRequest', getParkGeofences);
  })(),
  (function* () {
    yield takeLatest('Profile/createParkGeofenceRequest', createParkGeofenceSaga);
  })(),
  (function* () {
    yield takeLatest('Profile/geofencedArealistRequest', getgeofencedAreaList);
  })(),
];

export default watchFunction;
