import {API} from '@app/utils/constants';
import {instance} from '@app/utils/server/instance';
import {AxiosResponse} from 'axios';
import {call, put, takeLatest} from 'redux-saga/effects';

import {createFrom} from '@app/utils/helpers/Validation';
import {showMessage} from '@app/utils/helpers/Toast';

const {user} = API;

const _header = {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
};

// function* handleUserInfo() {
//   try {
//     const result: AxiosResponse<any> = yield call(instance.get, user.profile);

//     const {status, data} = result;

//     if (status === 200) {
//       yield put(getUserInfoSuccess(data));
//     }
//   } catch (error: any) {
//     showMessage(error?.response?.data?.message || error.message);
//     yield put(
//       getUserInfoFailure(error?.response?.data?.message || error.message),
//     );
//   }
// }

// function* handleUpdateUserInfo(action: any) {
//   try {
//     const result: AxiosResponse<any> = yield call(
//       instance.put,
//       user.editProfile,
//       createFrom(action.payload),
//       _header,
//     );

//     const {status, data} = result;

//     if (status === 200) {
//       yield put(updateUserInfoSuccess());
//       yield put(getUserInfoRequest());
//     }
//   } catch (error: any) {
//     showMessage(error?.response?.data?.message || error.message);
//     yield put(
//       updateUserInfoFailure(error?.response?.data?.message || error.message),
//     );
//   }
// }

function* userSaga() {
  // yield takeLatest('user/getUserInfoRequest', handleUserInfo);
  // yield takeLatest('user/updateUserInfoRequest', handleUpdateUserInfo);
}

export default userSaga;
