import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  loading: boolean;
  error: string | null;
  geoFenceAreaInfo: any;
  assignedParkInfo: any;
  // Other user-related state properties
}

const initialState: UserState = {
  assignedParkInfo: null,
  geoFenceAreaInfo: null,
  loading: true,
  error: null,
  // Initialize other state properties
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // assigned park information
    assignedParkRequest(state) {
      state.loading = true;
      state.error = null;
    },
    assignedParkSuccess(state, action: PayloadAction<any | null>) {
      state.loading = false;
      state.assignedParkInfo = action.payload;
      state.error = null;
    },
    assignedParkFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    // geofence park information
    geoFenceAreaRequest(state) {
      state.loading = true;
      state.error = null;
    },
    geoFenceAreaSuccess(state, action: PayloadAction<any | null>) {
      state.loading = false;
      state.geoFenceAreaInfo = action.payload;
      state.error = null;
    },
    geoFenceAreaFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  assignedParkRequest,
  assignedParkSuccess,
  assignedParkFailure,

  geoFenceAreaRequest,
  geoFenceAreaSuccess,
  geoFenceAreaFailure,
  
} = userSlice.actions;

export default userSlice.reducer;
