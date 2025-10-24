import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  status: {},
  isLoading: true,
  error: {},
  userDetailsResponse: {},
  getParkGeofencesListResponse: {},
  createParkGeofenceResponse: {},
  geofencedArealistResponse: {},
};

const ProfileSlice = createSlice({
  name: 'Profile',
  initialState,
  reducers: {
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
  },
});

export const {
  getParkGeofencesListRequest,
  getParkGeofencesListSuccess,
  getParkGeofencesListFailure,

  createParkGeofenceRequest,
  createParkGeofenceSuccess,
  createParkGeofenceFailure,

  geofencedArealistRequest,
  geofencedArealistSuccess,
  geofencedArealistFailure,
} = ProfileSlice.actions;

export default ProfileSlice.reducer;
