import React, { useState } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { Search, MapPin, Mail, Shield, Briefcase, Wrench, User as UserIcon, Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { Avatar } from '../components/ToastNotification';
import { User, Technician, Role } from '../types';

const Staff = () => {
  const { users, workOrders, currentUser, addUser, updateUser, deleteUser } = useFSMStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<User & { skills?: string[]; status?: string; location?: any; password?: string }>>({
    name: '',
    email: '',
    role: 'Technician',
    skills: [],
    status: 'Available',
    location: { lat: 0, lng: 0, address: '' },
    password: ''
  });

  // Filter users based on permissions
  const getVisibleUsers = () => {
    if (!currentUser) return [];
    
    let visibleUsers = users;
    
    if (currentUser.role === 'Manager') {
      visibleUsers = users.filter(u => u.role === 'Technician');
    } else if (currentUser.role === 'Owner') {
      visibleUsers = users.filter(u => ['Technician', 'Manager'].includes(u.role));
    } else if (currentUser.role === 'SuperAdmin') {
      visibleUsers = users; // See everyone
    } else {
      return []; // Technicians don't see this page usually
    }

    return visibleUsers.filter(u =>
      (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (u.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  };

  const filteredUsers = getVisibleUsers();

  // Permission Logic for Actions
  const canManageRole = (targetRole: Role) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SuperAdmin') return true;
    if (currentUser.role === 'Owner' && ['Technician', 'Manager'].includes(targetRole)) return true;
    if (currentUser.role === 'Manager' && targetRole === 'Technician') return true;
    return false;
  };

  const getAllowedRoles = (): Role[] => {
    if (!currentUser) return [];
    if (currentUser.role === 'SuperAdmin') return ['SuperAdmin', 'Owner', 'Manager', 'Technician'];
    if (currentUser.role === 'Owner') return ['Manager', 'Technician'];
    if (currentUser.role === 'Manager') return ['Technician'];
    return [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateUser(editingId, formData);
    } else {
      const newUser: User | Technician = {
        id: `u${Date.now()}`,
        ...formData as any,
        avatar: undefined // Will be handled by the Avatar component
      };
      addUser(newUser);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', email: '', role: 'Technician', skills: [], status: 'Available', location: { lat: 0, lng: 0, address: '' } });
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    // Cast to Technician to access skills/status if they exist, otherwise they'll be undefined which is fine
    setFormData(user as Technician);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'SuperAdmin': return <Shield className="w-5 h-5 text-purple-600" />;
      case 'Owner': return <UserIcon className="w-5 h-5 text-blue-600" />;
      case 'Manager': return <Briefcase className="w-5 h-5 text-orange-600" />;
      case 'Technician': return <Wrench className="w-5 h-5 text-green-600" />;
      default: return <UserIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage users and permissions</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', email: '', role: 'Technician', skills: [], status: 'Available', location: { lat: 0, lng: 0, address: '' } });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          const isDeletable = canManageRole(user.role);
          const isTechnician = user.role === 'Technician';
          const techData = user as Technician;
          
          const activeJob = isTechnician 
            ? workOrders.find(wo => wo.technicianIds.includes(user.id) && wo.status === 'In Progress')
            : null;

          return (
            <div key={user.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group">
              {isDeletable && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(user)} className="p-1 text-gray-400 hover:text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  size={64}
                  showStatus={isTechnician}
                  status={techData?.status}
                />
                <div className="mt-8 flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {getRoleIcon(user.role)}
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{user.role}</span>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{user.name}</h3>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4">
                <Mail className="w-4 h-4" /> {user.email}
              </div>
              
              {isTechnician && techData.skills && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {techData.skills.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded-md font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {isTechnician && techData.location && (
                <div className="space-y-2 pt-4 border-t border-gray-50 dark:border-gray-600">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {techData.location.address || 'No location data'}
                  </div>
                </div>
              )}

              {activeJob && (
                <div className="mt-4 bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Currently Working On:</p>
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
        title={editingId ? "Edit Staff" : "Add Staff"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
              value={formData.password || ''}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder={editingId ? "Leave blank to keep current" : "Required"}
              required={!editingId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as Role})}
            >
              {getAllowedRoles().map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {formData.role === 'Technician' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
                  value={formData.skills?.join(', ')}
                  onChange={e => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
                  value={formData.location?.address}
                  onChange={e => setFormData({...formData, location: { ...formData.location!, address: e.target.value }})}
                />
              </div>
            </>
          )}

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

export default Staff;
