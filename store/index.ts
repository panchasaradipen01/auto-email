import { configureStore } from '@reduxjs/toolkit';
import templateReducer from './slices/templateSlice';
import campaignReducer from './slices/campaignSlice';
import uiReducer from './slices/uiSlice';

/**
 * Configure the global Redux Store root for local/UI states.
 * Data fetching and query-caching is handled separately via Apollo Client.
 */
export const store = configureStore({
  reducer: {
    template: templateReducer,
    campaign: campaignReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
