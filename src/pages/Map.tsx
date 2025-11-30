import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { useFSMStore } from '../store/useFSMStore';
import { Icon, LatLngExpression } from 'leaflet';
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
  const [lastUpdate, setLastUpdate] = useState<string>('');
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
  const center: [number, number] = [36.8065, 10.1815];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      <MapContainer center={center as LatLngExpression} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Technician Markers */}
        {technicians.map((tech) => (
          <Marker 
            key={tech.id} 
            position={[tech.location.lat, tech.location.lng] as LatLngExpression}
            icon={TechnicianIcon}
          >
            <Popup>
              <div className="p-2 w-48">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar
                    src={tech.avatar}
                    name={tech.name}
                    size={32}
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{tech.name}</h3>
                    <p className="text-xs text-gray-500">{tech.role}</p>
                  </div>
                </div>
                <div className="text-xs space-y-1 border-t pt-1">
                  <p><strong>Status:</strong> <span className={`px-2 py-0.5 rounded text-xs ${
                    tech.status === 'Available' ? 'bg-green-100 text-green-700' :
                    tech.status === 'Busy' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{tech.status}</span></p>
                  <p><strong>Skills:</strong> {tech.skills?.length > 0 ? tech.skills.join(', ') : 'None'}</p>
                  {tech.accuracy && <p><strong>Accuracy:</strong> ±{Number(tech.accuracy).toFixed(0)}m</p>}
                  {tech.lastUpdate && <p className="text-gray-400"><strong>Last Update:</strong> {new Date(tech.lastUpdate).toLocaleTimeString()}</p>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Job Markers */}
        {activeJobs.map((job) => (
          <Marker 
            key={job.id} 
            position={[job.location.lat, job.location.lng] as LatLngExpression}
            icon={JobIcon} 
          >
            <Popup>
              <div className="p-2 w-48">
                <h3 className="font-bold text-sm mb-1">{job.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{job.serviceType}</p>
                <div className="flex gap-1 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    job.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {job.priority}
                  </span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-medium">
                    {job.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend & Status Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-lg shadow-md max-w-xs">
        <div className="mb-3">
          <h4 className="font-bold text-xs mb-2">Live Tracking</h4>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 flex items-center justify-center">
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" alt="tech" className="w-4" />
            </div>
            <span className="text-xs">Technicians ({technicians.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" alt="job" className="w-4" />
            </div>
            <span className="text-xs">Active Jobs ({activeJobs.length})</span>
          </div>
        </div>
        <div className="border-t pt-2 text-xs">
          <p className="text-gray-500">Last updated: {lastUpdate || 'Just now'}</p>
          <p className="text-gray-500">Auto-refresh: every 10s</p>
        </div>
      </div>
    </div>
  );
};

export default MapView;
