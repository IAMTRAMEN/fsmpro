import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
let DefaultIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
const DEFAULT_LOCATION = { lat: 48.8566, lng: 2.3522, address: 'Paris, France' };
const LocationMarker = ({ position, setPosition, onSelect }) => {
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
    return position ? _jsx(Marker, { position: position, icon: DefaultIcon }) : null;
};
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (map && center.lat !== 0) {
            map.setView([center.lat, center.lng], map.getZoom());
        }
    }, [map, center]);
    return null;
};
const LocationPicker = ({ initialLocation, onLocationSelect }) => {
    const [position, setPosition] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        if (initialLocation && initialLocation.lat !== 0) {
            setPosition({ lat: initialLocation.lat, lng: initialLocation.lng });
            setIsInitialized(true);
        }
        else {
            setPosition({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng });
            setIsInitialized(true);
        }
    }, [initialLocation]);
    if (!isInitialized) {
        return (_jsx("div", { className: "h-64 w-full rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center bg-gray-50", children: _jsx("p", { className: "text-gray-500", children: "Loading map..." }) }));
    }
    const center = position || { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };
    return (_jsxs("div", { className: "h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0", children: [_jsxs(MapContainer, { center: [center.lat, center.lng], zoom: 13, style: { height: '100%', width: '100%' }, className: "rounded-lg", children: [_jsx(TileLayer, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }), _jsx(MapUpdater, { center: center }), _jsx(LocationMarker, { position: position, setPosition: setPosition, onSelect: onLocationSelect })] }, `${center.lat}-${center.lng}`), _jsx("div", { className: "absolute bottom-2 left-2 bg-white px-2 py-1 rounded shadow text-xs z-[1000] pointer-events-none", children: "Click map to set location" })] }));
};
export default LocationPicker;
