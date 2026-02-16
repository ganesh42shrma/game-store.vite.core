import { configureStore } from '@reduxjs/toolkit';
import toastReducer from './toastSlice.js';
import confirmationReducer from './confirmationSlice.js';

export const store = configureStore({
  reducer: {
    toast: toastReducer,
    confirmation: confirmationReducer,
  },
});
