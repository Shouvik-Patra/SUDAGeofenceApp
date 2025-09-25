import { BASE_URL } from '@env';

export const API = {
  auth: {
    login: 'login',
    logout: '',
    refreshToken: 'auth/refresh',
  },
  user: {
    assignedParkData: 'parkDetails',
    profile: '',
    editProfile: '',
    deleteAccount: '',
  },
};

export const IMAGES_BUCKET_URL = {
  profile: `${BASE_URL}/uploads/users/`,
};
