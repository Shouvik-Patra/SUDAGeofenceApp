import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  status: {},
  isLoading: true,
  error: {},
  userDetailsResponse: {},
  getParkGeofencesListResponse: {},
  createParkGeofenceResponse: {},
  geofencedArealistResponse: {},
  deletegeofencedAreaResponse: {},
};

const ProfileSlice = createSlice({
  name: 'Profile',
  initialState,
  reducers: {
    userDetailsRequest(state, action) {
      state.status = action.type;
    },
    userDetailsSuccess(state, action) {
      state.userDetailsResponse = action.payload;
      state.status = action.type;
    },
    userDetailsFailure(state, action) {
      state.error = action.error;
      state.status = action.type;
    },

    getParkGeofencesListRequest(state, action) {
      state.status = action.type;
    },
    getParkGeofencesListSuccess(state, action) {
      state.getParkGeofencesListResponse = action.payload;
      state.status = action.type;
    },
    getParkGeofencesListFailure(state, action) {
      state.error = action.error;
      state.status = action.type;
    },
    createParkGeofenceRequest(state, action) {
      state.status = action.type;
    },
    createParkGeofenceSuccess(state, action) {
      state.createParkGeofenceResponse = action.payload;
      state.status = action.type;
    },
    createParkGeofenceFailure(state, action) {
      state.error = action.error;
      state.status = action.type;
    },

    geofencedArealistRequest(state, action) {
      state.status = action.type;
    },
    geofencedArealistSuccess(state, action) {
      state.geofencedArealistResponse = action.payload;
      state.status = action.type;
    },
    geofencedArealistFailure(state, action) {
      state.error = action.error;
      state.status = action.type;
    },

    deletegeofencedAreaRequest(state, action) {
      state.status = action.type;
    },
    deletegeofencedAreaSuccess(state, action) {
      state.geofencedArealistResponse = action.payload;
      state.status = action.type;
    },
    deletegeofencedAreaFailure(state, action) {
      state.error = action.error;
      state.status = action.type;
    },
  },
});

export const {
  userDetailsRequest,
  userDetailsSuccess,
  userDetailsFailure,

  getParkGeofencesListRequest,
  getParkGeofencesListSuccess,
  getParkGeofencesListFailure,

  createParkGeofenceRequest,
  createParkGeofenceSuccess,
  createParkGeofenceFailure,

  geofencedArealistRequest,
  geofencedArealistSuccess,
  geofencedArealistFailure,

  deletegeofencedAreaRequest,
  deletegeofencedAreaSuccess,
  deletegeofencedAreaFailure,
} = ProfileSlice.actions;

export default ProfileSlice.reducer;
