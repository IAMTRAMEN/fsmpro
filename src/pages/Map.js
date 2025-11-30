import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useFSMStore } from '../store/useFSMStore';
import { Icon } from 'leaflet';
import { Avatar } from '../components/ToastNotification';
import 'leaflet/dist/leaflet.css';
const TechnicianIcon = new Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
const JobIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
const MapView = () => {
    const { technicians, workOrders, fetchLiveTechnicianLocations } = useFSMStore();
    const [lastUpdate, setLastUpdate] = useState('');
    const activeJobs = workOrders.filter(wo => wo.status === 'In Progress' || wo.status === 'Assigned');
    useEffect(() => {
        fetchLiveTechnicianLocations();
        const interval = setInterval(() => {
            fetchLiveTechnicianLocations();
            setLastUpdate(new Date().toLocaleTimeString());
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchLiveTechnicianLocations]);
    // Center map on Tunis, Tunisia
    const center = [36.8065, 10.1815];
    return (_jsxs("div", { className: "h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative", children: [_jsxs(MapContainer, { center: center, zoom: 12, style: { height: '100%', width: '100%' }, children: [_jsx(TileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), technicians.map((tech) => (_jsx(Marker, { position: [tech.location.lat, tech.location.lng], icon: TechnicianIcon, children: _jsx(Popup, { children: _jsxs("div", { className: "p-2 w-48", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Avatar, { src: tech.avatar, name: tech.name, size: 32 }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-bold text-sm", children: tech.name }), _jsx("p", { className: "text-xs text-gray-500", children: tech.role })] })] }), _jsxs("div", { className: "text-xs space-y-1 border-t pt-1", children: [_jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", _jsx("span", { className: `px-2 py-0.5 rounded text-xs ${tech.status === 'Available' ? 'bg-green-100 text-green-700' :
                                                            tech.status === 'Busy' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'}`, children: tech.status })] }), _jsxs("p", { children: [_jsx("strong", { children: "Skills:" }), " ", tech.skills?.length > 0 ? tech.skills.join(', ') : 'None'] }), tech.accuracy && _jsxs("p", { children: [_jsx("strong", { children: "Accuracy:" }), " \u00B1", Number(tech.accuracy).toFixed(0), "m"] }), tech.lastUpdate && _jsxs("p", { className: "text-gray-400", children: [_jsx("strong", { children: "Last Update:" }), " ", new Date(tech.lastUpdate).toLocaleTimeString()] })] })] }) }) }, tech.id))), activeJobs.map((job) => (_jsx(Marker, { position: [job.location.lat, job.location.lng], icon: JobIcon, children: _jsx(Popup, { children: _jsxs("div", { className: "p-2 w-48", children: [_jsx("h3", { className: "font-bold text-sm mb-1", children: job.title }), _jsx("p", { className: "text-xs text-gray-600 mb-2", children: job.serviceType }), _jsxs("div", { className: "flex gap-1 mb-1", children: [_jsx("span", { className: `px-2 py-0.5 rounded text-[10px] font-medium ${job.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`, children: job.priority }), _jsx("span", { className: "bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-medium", children: job.status })] })] }) }) }, job.id)))] }), _jsxs("div", { className: "absolute top-4 right-4 z-[1000] bg-white p-3 rounded-lg shadow-md max-w-xs", children: [_jsxs("div", { className: "mb-3", children: [_jsx("h4", { className: "font-bold text-xs mb-2", children: "Live Tracking" }), _jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "w-6 h-6 flex items-center justify-center", children: _jsx("img", { src: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png", alt: "tech", className: "w-4" }) }), _jsxs("span", { className: "text-xs", children: ["Technicians (", technicians.length, ")"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-6 h-6 flex items-center justify-center", children: _jsx("img", { src: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png", alt: "job", className: "w-4" }) }), _jsxs("span", { className: "text-xs", children: ["Active Jobs (", activeJobs.length, ")"] })] })] }), _jsxs("div", { className: "border-t pt-2 text-xs", children: [_jsxs("p", { className: "text-gray-500", children: ["Last updated: ", lastUpdate || 'Just now'] }), _jsx("p", { className: "text-gray-500", children: "Auto-refresh: every 10s" })] })] })] }));
};
export default MapView;
