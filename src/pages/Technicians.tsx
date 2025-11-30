import { useState } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { Search, MapPin, Mail, Plus, Trash2, Edit2 } from 'lucide-react';
import Modal from '../components/Modal';
import { Avatar } from '../components/ToastNotification';
import { Technician, Role } from '../types';

const Technicians = () => {
  const { technicians, workOrders, currentUser, addUser, updateUser, deleteUser } = useFSMStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Technician>>({
    name: '',
    email: '',
    role: 'Technician',
    skills: [],
    status: 'Available',
    location: { lat: 0, lng: 0, address: '' }
  });

  const filteredTechs = technicians.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Permission Logic
  const canManageTechs = ['Manager', 'Owner', 'SuperAdmin'].includes(currentUser?.role || '');
  
  const canDelete = (targetRole: Role) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SuperAdmin') return true;
    if (currentUser.role === 'Owner' && ['Technician', 'Manager'].includes(targetRole)) return true;
    if (currentUser.role === 'Manager' && targetRole === 'Technician') return true;
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateUser(editingId, formData);
    } else {
      const newUser: Technician = {
        id: `t${Date.now()}`,
        name: formData.name || '',
        email: formData.email || '',
        role: 'Technician',
        skills: formData.skills || [],
        status: (formData.status as any) || 'Available',
        location: formData.location || { lat: 0, lng: 0, address: '' },
        avatar: undefined, // Will be handled by the Avatar component
        lastUpdate: '',
        accuracy: 0
      };
      addUser(newUser);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', email: '', role: 'Technician', skills: [], status: 'Available', location: { lat: 0, lng: 0, address: '' } });
  };

  const handleEdit = (tech: Technician) => {
    setEditingId(tech.id);
    setFormData(tech);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this technician?')) {
      deleteUser(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Technicians</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage field staff and availability</p>
        </div>
        {canManageTechs && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', email: '', role: 'Technician', skills: [], status: 'Available', location: { lat: 0, lng: 0, address: '' } });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Technician
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechs.map((tech) => {
          const activeJob = workOrders.find(wo => wo.technicianIds.includes(tech.id) && wo.status === 'In Progress');
          const isDeletable = canDelete(tech.role);

          return (
            <div key={tech.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group">
              {isDeletable && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(tech)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(tech.id)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <Avatar
                  src={tech.avatar}
                  name={tech.name}
                  size={64}
                  showStatus={true}
                  status={tech.status}
                />
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  tech.status === 'Available' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                  tech.status === 'Busy' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {tech.status}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{tech.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tech.role}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {tech.skills.map(skill => (
                  <span key={skill} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs rounded-md font-medium">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-50 dark:border-gray-700">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {tech.email}
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {tech.location.address}
                </div>
              </div>

              {activeJob && (
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-300 font-medium mb-1">Currently Working On:</p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">{activeJob.title}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Technician" : "Add Technician"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma separated)</label>
            <input
              type="text"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.skills?.join(', ')}
              onChange={e => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input
              type="text"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.location?.address}
              onChange={e => setFormData({...formData, location: { ...formData.location!, address: e.target.value }})}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Technicians;
