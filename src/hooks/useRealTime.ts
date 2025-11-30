import { useEffect } from 'react';
import { useFSMStore } from '../store/useFSMStore';

export const useRealTime = () => {
  const { addNotification } = useFSMStore();

  useEffect(() => {
    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different event types
        switch (event.type) {
          case 'work-order-updated':
            // Update work order in store
            useFSMStore.getState().updateWorkOrder(data.id, data);
            addNotification(`Work order "${data.title}" was updated`, 'info');
            break;
          case 'work-order-created':
            // Add new work order to store
            useFSMStore.getState().addWorkOrder(data);
            addNotification(`New work order "${data.title}" was created`, 'info');
            break;
          case 'work-order-deleted':
            // Remove work order from store
            useFSMStore.getState().deleteWorkOrder(data.id);
            addNotification('Work order was deleted', 'info');
            break;
          default:
            // Unknown event type - silently ignore
            break;
        }
      } catch (error) {
        console.error('Error parsing real-time event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Optionally implement reconnection logic here
    };

    return () => {
      eventSource.close();
    };
  }, [addNotification]);
};