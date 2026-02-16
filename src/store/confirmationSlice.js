import { createSlice } from '@reduxjs/toolkit';

const confirmationSlice = createSlice({
  name: 'confirmation',
  initialState: {
    open: false,
    title: '',
    message: '',
    confirmLabel: 'OK',
    cancelLabel: 'Cancel',
    variant: 'default', // 'default' | 'danger'
    onConfirm: null,
    onCancel: null,
  },
  reducers: {
    showConfirmation: (state, action) => {
      const {
        title = 'Confirm',
        message,
        confirmLabel = 'OK',
        cancelLabel = 'Cancel',
        variant = 'default',
        onConfirm,
        onCancel,
      } = action.payload;
      state.open = true;
      state.title = title;
      state.message = message;
      state.confirmLabel = confirmLabel;
      state.cancelLabel = cancelLabel;
      state.variant = variant;
      state.onConfirm = onConfirm;
      state.onCancel = onCancel;
    },
    hideConfirmation: (state) => {
      state.open = false;
      state.onConfirm = null;
      state.onCancel = null;
    },
  },
});

export const { showConfirmation, hideConfirmation } = confirmationSlice.actions;
export default confirmationSlice.reducer;
