import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setQueueProgress, addNotification } from '@/store/slices/uiSlice';

/**
 * Custom hook to open an EventSource connection to the queue SSE route.
 * Dispatches progress metrics and notifications directly into the Redux UI state.
 */
export function useEmailQueue() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Instantiate EventSource connection
    const eventSource = new EventSource('/api/sse/queue');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload && payload.logId) {
          // Push job progress updates to global state
          dispatch(setQueueProgress(payload));

          // Trigger automated user notifications on final states
          if (payload.status === 'SENT') {
            dispatch(
              addNotification({
                message: `Personalized email successfully sent to ${payload.recipientEmail}`,
                type: 'success',
              })
            );
          } else if (payload.status === 'FAILED') {
            dispatch(
              addNotification({
                message: `Failed to dispatch email to ${payload.recipientEmail}: ${payload.errorMessage || 'Unknown Error'}`,
                type: 'error',
              })
            );
          }
        }
      } catch (err) {
        console.error('Failed to parse SSE queue payload:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE event stream closed or lost connection. Reconnecting...', err);
    };

    return () => {
      eventSource.close();
    };
  }, [dispatch]);
}
