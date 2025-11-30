import { useFSMStore } from '../store/useFSMStore';
import { FileText, Clock, AlertCircle, Wrench, DollarSign } from 'lucide-react';
import { Avatar } from '../components/ToastNotification';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
  </div>
);

const ManagerDashboard = () => {
  const { workOrders, technicians, customers, invoices } = useFSMStore();


  const activeJobs = workOrders.filter(wo => wo.status === 'In Progress').length;
  const pendingJobs = workOrders.filter(wo => wo.status === 'New' || wo.status === 'Assigned').length;
  const completedJobs = workOrders.filter(wo => wo.status === 'Completed').length;
  const availableTechs = technicians.filter(t => t.status === 'Available').length;
  const totalRevenue = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((acc, inv) => acc + (inv.amount || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back, here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Jobs" 
          value={activeJobs} 
          icon={Clock} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Pending Orders" 
          value={pendingJobs} 
          icon={AlertCircle} 
          color="bg-orange-500" 
        />
        <StatCard 
          title="Available Techs" 
          value={`${availableTechs}/${technicians.length}`} 
          icon={Wrench} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toFixed(2)}`} 
          icon={DollarSign} 
          color="bg-green-500" 
          trend="+12%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Work Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Recent Work Orders</h2>
            <a href="./work-orders" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">View All</a>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {workOrders.length === 0 ? (

                <div className="p-6 text-center">
                  <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No recent work orders found.</p>
                </div>
            ) : (
              workOrders.slice(0, 5).map((wo) => (
                <div key={wo.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${
                      wo.priority === 'Critical' ? 'bg-red-500' :
                      wo.priority === 'High' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{wo.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{wo.serviceType} • {new Date(wo.scheduledStart).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      wo.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                      wo.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {wo.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Technician Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Technician Status</h2>
          </div>
          <div className="p-4 space-y-4">
            {technicians.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={tech.avatar}
                    name={tech.name}
                    size={40}
                    showStatus={true}
                    status={tech.status}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{tech.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tech.skills?.join(', ') || 'No skills'}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{tech.location?.address || 'No location'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
