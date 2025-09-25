import { API } from '@app/utils/constants';
import { instance } from '@app/utils/server/instance';
import { AxiosResponse } from 'axios';
import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';

import { createFrom } from '@app/utils/helpers/Validation';
import { showMessage } from '@app/utils/helpers/Toast';
import { assignedParkFailure, assignedParkSuccess } from '../slice/user.slice';

const { user } = API;

// Define the payload type for your action
interface AssignedParkPayload {
  // Add any parameters you need to pass
  userId?: string;
  parkId?: string;
  // Add other fields as needed
}

function* fetchAssignedParkInfo() {
  try {
    const result: AxiosResponse<any> = yield call(instance.get, user.assignedParkData);

    const {status, data} = result;

    if (status === 200) {
      yield put(assignedParkFailure(data));
    }
  } catch (error: any) {
    showMessage(error?.response?.data?.message || error.message);
    yield put(
      assignedParkSuccess(error?.response?.data?.message || error.message),
    );
  }
}



function* userSaga() {
  yield takeLatest('user/assignedParkRequest', fetchAssignedParkInfo);
}

export default userSaga;