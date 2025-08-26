import { BASE_URL } from '@env';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { API } from '../constants';
import { store } from '@app/store';
import { setToken, logoutRequest } from '@app/store/slice/auth.slice';
import Storage from '../storage';

export const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    //'Content-Type': 'application/json,multipart/form-data',
  },
});

export const instance1 = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const instance2 = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Since your API doesn't provide refresh token, you might want to remove this function
// or modify it based on your actual refresh token endpoint
const refreshToken = async () => {
  const { auth } = API;
  
  // Get current token from store
  const { token } = store.getState().auth;
  console.log('current token --- .....', token);

  if (!token) {
    return null;
  }

  // If you don't have a refresh token endpoint, you might want to:
  // 1. Remove this function entirely
  // 2. Or implement a different token refresh mechanism
  // 3. Or just logout the user when token expires
  
  try {
    // This is commented out since your API structure doesn't include refresh token
    /*
    const response = await axios.post(`${BASE_URL}${auth.refreshToken}`, {
      accessToken: token,
    });

    const { status, data } = response;
    if (status === 200 && data.meta.status) {
      // Update store with new token and user data
      store.dispatch(
        setToken({
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
      Storage.setItem('token', data.data.access_token);
      return data.data.access_token;
    }
    */
    
    // For now, just return null to trigger logout
    return null;
  } catch (error: any) {
    console.log('refreshToken error:', error.response?.data);
    store.dispatch(logoutRequest());
    throw error;
  }
};

instance.interceptors.request.use(async config => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    throw new axios.Cancel(
      'No internet connection. Please connect to the internet.',
    );
  }

  const { token } = store.getState().auth;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Log full API path
  const fullUrl = `${config.baseURL}${config.url}`;
  console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${fullUrl}`);
  
  return config;
});

instance1.interceptors.request.use(async config => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    throw new axios.Cancel(
      'No internet connection. Please connect to the internet.',
    );
  }

  // Log full API path
  const fullUrl = `${config.baseURL}${config.url}`;
  console.log(`[API REQUEST - Instance1] ${config.method?.toUpperCase()} ${fullUrl}`);

  return config;
});

instance2.interceptors.request.use(async config => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    throw new axios.Cancel(
      'No internet connection. Please connect to the internet.',
    );
  }

  const { token } = store.getState().auth;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Log full API path
  const fullUrl = `${config.baseURL}${config.url}`;
  console.log(`[API REQUEST - Instance2] ${config.method?.toUpperCase()} ${fullUrl}`);

  return config;
});

instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Check if the error is due to an expired token and the request hasn't already been retried
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const newToken = await refreshToken();

        if (newToken) {
          // Update the token in the headers
          instance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Retry the original request
          return instance(originalRequest);
        } else {
          // No new token received, logout user
          store.dispatch(logoutRequest());
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // If the refresh fails, reset the auth state and reject the promise
        store.dispatch(logoutRequest());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

instance2.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Check if the error is due to an expired token and the request hasn't already been retried
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const newToken = await refreshToken();

        if (newToken) {
          // Update the token in the headers
          instance2.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Retry the original request
          return instance2(originalRequest);
        } else {
          // No new token received, logout user
          store.dispatch(logoutRequest());
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // If the refresh fails, reset the auth state and reject the promise
        store.dispatch(logoutRequest());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);