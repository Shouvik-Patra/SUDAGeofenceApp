import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { logger } from 'redux-logger';

import rootSaga from './service/rootSaga';

import authReducer from './slice/auth.slice';

const rootReducer = combineReducers({
  auth: authReducer,
});


const createSagaMiddleware = require('redux-saga');
const sagaMiddleware = createSagaMiddleware.default();


const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      thunk: false, // Disable thunk middleware
      serializableCheck: false, // Disable serializable check for redux-persist
    }).concat(logger, sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export { store };


