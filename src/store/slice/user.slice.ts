
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface UserState {
  loading: boolean;
  error: string | null;
  geoFenceAreaInfo: any;
  // Other user-related state properties
}

const initialState: UserState = {
  geoFenceAreaInfo: null,
  loading: true,
  error: null,
  // Initialize other state properties
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
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
  // fetch user information
  geoFenceAreaRequest,
  geoFenceAreaSuccess,
  geoFenceAreaFailure,
  
} = userSlice.actions;

export default userSlice.reducer;
