import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

interface UiState {
  sidebarOpen: boolean;
  notifications: NotificationItem[];
  queueProgress: {
    logId: string;
    campaignId: string;
    recipientEmail: string;
    status: string;
    errorMessage?: string | null;
  } | null;
}

const initialState: UiState = {
  sidebarOpen: true,
  notifications: [],
  queueProgress: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    addNotification(state, action: PayloadAction<Omit<NotificationItem, 'id' | 'timestamp' | 'read'>>) {
      state.notifications.unshift({
        id: Math.random().toString(36).substring(2, 10),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      });
    },
    markNotificationAsRead(state, action: PayloadAction<string>) {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearNotifications(state) {
      state.notifications = [];
    },
    setQueueProgress(state, action: PayloadAction<UiState['queueProgress']>) {
      state.queueProgress = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
  setQueueProgress,
} = uiSlice.actions;

export default uiSlice.reducer;
