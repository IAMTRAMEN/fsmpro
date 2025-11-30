import { useEffect, useRef } from 'react';

interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const getAuthHeaders = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem('currentUser');
    const user = stored ? JSON.parse(stored) : null;
    if (!user?.token) {
      console.warn('No auth token in localStorage for geolocation');
    }
    return user?.token
      ? {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      : { 'Content-Type': 'application/json' };
  } catch {
    console.warn('Error parsing auth headers for geolocation');
    return { 'Content-Type': 'application/json' };
  }
};

export const useGeolocation = (
  technicianId: string | undefined,
  enabled: boolean = true,
  onLocationUpdate?: (coords: GeolocationCoordinates) => void,
  interval: number = 10000
) => {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !technicianId) return;

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const coords: GeolocationCoordinates = { latitude, longitude, accuracy };

          onLocationUpdate?.(coords);

          fetch(`http://127.0.0.1:5000/api/technicians/${technicianId}/location`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(coords)
          }).catch(err => console.error('Location update failed:', err));
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Retry with lower accuracy if high accuracy fails
          if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const coords: GeolocationCoordinates = { latitude, longitude, accuracy };
                onLocationUpdate?.(coords);
                fetch(`http://127.0.0.1:5000/api/technicians/${technicianId}/location`, {
                  method: 'POST',
                  headers: getAuthHeaders(),
                  body: JSON.stringify(coords)
                }).catch(err => console.error('Location update failed:', err));
              },
              (fallbackError) => {
                console.error('Fallback geolocation also failed:', fallbackError);
              },
              {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 60000
              }
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    };

    sendLocation();
    intervalRef.current = setInterval(sendLocation, interval);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [technicianId, enabled, interval, onLocationUpdate]);

  return { isSupported: !!navigator.geolocation };
};
