import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Location } from '../types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

let DefaultIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  initialLocation?: Location;
  onLocationSelect: (location: Location) => void;
}

const DEFAULT_LOCATION = { lat: 48.8566, lng: 2.3522, address: 'Paris, France' };

const LocationMarker = ({ position, setPosition, onSelect }: any) => {
  useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      onSelect({
        lat: newPos.lat,
        lng: newPos.lng,
        address: `${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`
      });
    },
  });

  return position ? <Marker position={position} icon={DefaultIcon} /> : null;
};

const MapUpdater = ({ center }: { center: { lat: number; lng: number } }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map && center.lat !== 0) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [map, center]);

  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ initialLocation, onLocationSelect }) => {
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (initialLocation && initialLocation.lat !== 0) {
      setPosition({ lat: initialLocation.lat, lng: initialLocation.lng });
      setIsInitialized(true);
    } else {
      setPosition({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng });
      setIsInitialized(true);
    }
  }, [initialLocation]);

  if (!isInitialized) {
    return (
      <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  const center = position || { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
      <MapContainer 
        key={`${center.lat}-${center.lng}`}
        center={[center.lat, center.lng]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater center={center} />
        <LocationMarker 
          position={position} 
          setPosition={setPosition} 
          onSelect={onLocationSelect} 
        />
      </MapContainer>
      <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded shadow text-xs z-[1000] pointer-events-none">
        Click map to set location
      </div>
    </div>
  );
};

export default LocationPicker;
