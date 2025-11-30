import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

interface GPSTrackerProps {
  technicianId: string;
  enabled?: boolean;
}

export const GPSTracker = ({ technicianId, enabled = true }: GPSTrackerProps) => {
  const [isSharing, setIsSharing] = useState(enabled);
  const [status, setStatus] = useState<'idle' | 'tracking' | 'error' | 'unsupported'>('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const handleLocationUpdate = (coords: any) => {
    setStatus('tracking');
    setAccuracy(coords.accuracy);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const { isSupported } = useGeolocation(
    isSharing ? technicianId : undefined,
    isSharing,
    handleLocationUpdate,
    5000
  );

  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported');
    }
  }, [isSupported]);

  const toggleGPS = () => {
    if (!isSupported) {
      setStatus('unsupported');
      return;
    }
    setIsSharing(!isSharing);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3 dark:bg-gray-800 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 dark:text-gray-100">
          <MapPin className="w-4 h-4" />
          Live Location Tracking
        </h3>
        <button
          onClick={toggleGPS}
          disabled={status === 'unsupported'}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isSharing
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          } ${status === 'unsupported' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSharing ? 'Stop Sharing' : 'Start Sharing'}
        </button>
      </div>

      <div className="flex items-start gap-2 text-sm">
        {status === 'tracking' && (
          <>
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-700 font-medium">Location tracking active</p>
              {accuracy && (
                <p className="text-gray-600 text-xs dark:text-gray-400">Accuracy: ±{accuracy.toFixed(0)}m</p>
              )}
              {lastUpdate && (
                <p className="text-gray-500 text-xs dark:text-gray-400">Last update: {lastUpdate}</p>
              )}
            </div>
          </>
        )}
        {status === 'idle' && !isSharing && (
          <p className="text-gray-600 text-xs">GPS sharing disabled</p>
        )}
        {status === 'unsupported' && (
          <>
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-orange-700">Geolocation not supported on this device</p>
          </>
        )}
      </div>
    </div>
  );
};
