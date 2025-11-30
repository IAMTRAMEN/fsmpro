import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
export const GPSTracker = ({ technicianId, enabled = true }) => {
    const [isSharing, setIsSharing] = useState(enabled);
    const [status, setStatus] = useState('idle');
    const [accuracy, setAccuracy] = useState(null);
    const [lastUpdate, setLastUpdate] = useState('');
    const handleLocationUpdate = (coords) => {
        setStatus('tracking');
        setAccuracy(coords.accuracy);
        setLastUpdate(new Date().toLocaleTimeString());
    };
    const { isSupported } = useGeolocation(isSharing ? technicianId : undefined, isSharing, handleLocationUpdate, 5000);
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
    return (_jsxs("div", { className: "bg-white p-4 rounded-lg border border-gray-200 space-y-3 dark:bg-gray-800 dark:border-gray-600", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "font-semibold text-gray-900 flex items-center gap-2 dark:text-gray-100", children: [_jsx(MapPin, { className: "w-4 h-4" }), "Live Location Tracking"] }), _jsx("button", { onClick: toggleGPS, disabled: status === 'unsupported', className: `px-3 py-1 rounded-full text-xs font-medium transition-colors ${isSharing
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'} ${status === 'unsupported' ? 'opacity-50 cursor-not-allowed' : ''}`, children: isSharing ? 'Stop Sharing' : 'Start Sharing' })] }), _jsxs("div", { className: "flex items-start gap-2 text-sm", children: [status === 'tracking' && (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-green-700 font-medium", children: "Location tracking active" }), accuracy && (_jsxs("p", { className: "text-gray-600 text-xs dark:text-gray-400", children: ["Accuracy: \u00B1", accuracy.toFixed(0), "m"] })), lastUpdate && (_jsxs("p", { className: "text-gray-500 text-xs dark:text-gray-400", children: ["Last update: ", lastUpdate] }))] })] })), status === 'idle' && !isSharing && (_jsx("p", { className: "text-gray-600 text-xs", children: "GPS sharing disabled" })), status === 'unsupported' && (_jsxs(_Fragment, { children: [_jsx(AlertCircle, { className: "w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-orange-700", children: "Geolocation not supported on this device" })] }))] })] }));
};
