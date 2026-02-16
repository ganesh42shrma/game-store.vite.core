import { createSlice } from '@reduxjs/toolkit';

let nextId = 0;

const toastSlice = createSlice({
  name: 'toast',
  initialState: { items: [] },
  reducers: {
    addToast: (state, action) => {
      const { message, type = 'info', duration = 4000, title } = action.payload;
      state.items.push({
        id: ++nextId,
        message,
        title,
        type,
        duration,
        createdAt: Date.now(),
      });
      // Keep max 5 toasts
      if (state.items.length > 5) state.items.shift();
    },
    removeToast: (state, action) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.items = [];
    },
  },
});

export const { addToast, removeToast, clearToasts } = toastSlice.actions;
export default toastSlice.reducer;
