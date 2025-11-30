import { useFSMStore } from '../store/useFSMStore';
import { GPSTracker } from '../components/GPSTracker';
import { 
  MapPin, Clock, CheckCircle, Navigation, 
  Calendar as CalendarIcon, ChevronRight 
} from 'lucide-react';

const TechnicianDashboard = () => {
  const { currentUser, workOrders, updateWorkOrderStatus, updateTechnicianStatus } = useFSMStore();
  const technician = currentUser as any; // Technician type
  
  // Filter jobs for this technician
  const myJobs = workOrders.filter(wo => wo.technicianIds.includes(currentUser?.id || ''));
  const currentJob = myJobs.find(wo => wo.status === 'In Progress');
  const upcomingJobs = myJobs.filter(wo => wo.status === 'Assigned').sort((a, b) => 
    new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
  );

  const handleStatusChange = (id: string, newStatus: any) => {
    updateWorkOrderStatus(id, newStatus);
    
    if (newStatus === 'In Progress' && currentUser?.id) {
      updateTechnicianStatus(currentUser.id, 'Busy');
    } else if (newStatus === 'Completed' && currentUser?.id) {
      updateTechnicianStatus(currentUser.id, 'Available');
    }
  };

  const handleNavigate = () => {
    if (currentJob && currentJob.location) {
      const { lat, lng } = currentJob.location;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Day</h1>
          <p className="text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          technician?.status === 'Busy' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
          technician?.status === 'Available' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}>
          {technician?.status || 'Available'}
        </div>
      </div>

      {/* GPS Tracker */}
      {currentUser && (
        <GPSTracker technicianId={currentUser.id} enabled={true} />
      )}

      {/* Current Job Card */}
      {currentJob ? (
        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full text-xs font-medium border border-blue-400">
              In Progress
            </span>
            <span className="text-blue-100 text-sm font-mono">#{currentJob.id}</span>
          </div>
          
          <h2 className="text-xl font-bold mb-2">{currentJob.title}</h2>
          <p className="text-blue-100 mb-6 line-clamp-2">{currentJob.description}</p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-blue-50">
              <MapPin className="w-5 h-5" />
              <span className="text-sm">{currentJob.location.address}</span>
            </div>
            <div className="flex items-center gap-3 text-blue-50">
              <Clock className="w-5 h-5" />
              <span className="text-sm">Started at {new Date(currentJob.scheduledStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleNavigate}
              className="bg-white text-blue-600 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <Navigation className="w-4 h-4" /> Navigate
            </button>
            <button 
              onClick={() => handleStatusChange(currentJob.id, 'Completed')}
              className="bg-green-500 text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Complete
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-600">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Active Job</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Pick a job from your schedule to start.</p>
        </div>
      )}

      {/* Upcoming Jobs */}
      <div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          Upcoming Jobs ({upcomingJobs.length})
        </h3>
        
        <div className="space-y-3">
          {upcomingJobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{job.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{job.serviceType}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  job.priority === 'Critical'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {job.priority}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="truncate">{job.location.address}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {new Date(job.scheduledStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                <button
                  onClick={() => handleStatusChange(job.id, 'In Progress')}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Start Job <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
