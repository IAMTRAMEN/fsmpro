import React, { useState, useEffect } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { 
  Search, Filter, Plus, MapPin, 
  AlertCircle, Edit, Trash2, ChevronDown
} from 'lucide-react';
import Modal from '../components/Modal';
import LocationPicker from '../components/LocationPicker';
import { WorkOrder } from '../types';
import { Avatar } from '../components/ToastNotification';

const WorkOrders = () => {
  const { workOrders, customers, technicians, addWorkOrder, updateWorkOrder, deleteWorkOrder, currentUser } = useFSMStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'New' | 'Assigned' | 'In Progress' | 'Completed' | 'All'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  // Form State
  const [newOrder, setNewOrder] = useState<Partial<WorkOrder>>({
    priority: 'Medium',
    serviceType: 'Repair',
    status: 'New',
    technicianIds: [],
    location: { lat: 36.7999, lng: 10.1832, address: 'Tunis, Tunsia' }
  });

  // Update location when customer changes
  useEffect(() => {
    if (newOrder.customerId) {
      const customer = customers.find(c => c.id === newOrder.customerId);
      if (customer && customer.location) {
        setNewOrder(prev => ({ ...prev, location: customer.location }));
      }
    }
  }, [newOrder.customerId, customers]);

  const filteredOrders = workOrders.filter(wo => {
    // Filter by Search
    const matchesSearch = wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wo.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by Status
    const matchesStatus = statusFilter === 'All' || wo.status === statusFilter;
    
    // Filter by Role (Technician sees only their jobs)
    const matchesRole = currentUser?.role === 'Technician' 
      ? wo.technicianIds.includes(currentUser.id)
      : true;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.title || !newOrder.customerId) return;
    
    const order: WorkOrder = {
      id: `wo${Date.now()}`,
      customerId: newOrder.customerId,
      customerName: customers.find(c => c.id === newOrder.customerId)?.name || 'Unknown Customer',
      technicianIds: newOrder.technicianIds || [],
      title: newOrder.title,
      description: newOrder.description || '',
      serviceType: newOrder.serviceType || 'Maintenance',
      status: newOrder.technicianIds?.length ? 'Assigned' : 'New',
      priority: newOrder.priority as 'Low' | 'Medium' | 'High' | 'Critical',
      scheduledStart: newOrder.scheduledStart || new Date().toISOString(),
      scheduledEnd: newOrder.scheduledEnd || new Date(Date.now() + 3600000).toISOString(),
      location: newOrder.location || { lat: 0, lng: 0, address: 'Unknown' },
      price: 0,
      estimatedDuration: newOrder.estimatedDuration || 60
    };

    addWorkOrder(order);
    setIsCreateModalOpen(false);
    setNewOrder({ 
      priority: 'Medium', 
      serviceType: 'Repair', 
      status: 'New', 
      technicianIds: [],
      location: { lat: 48.8566, lng: 2.3522, address: 'Paris, France' }
    });
  };

  const toggleTechnicianSelection = (techId: string, isEdit = false) => {
    const target = isEdit ? editingOrder : newOrder;
    const currentIds = target?.technicianIds || [];
    const updatedIds = currentIds.includes(techId)
      ? currentIds.filter(id => id !== techId)
      : [...currentIds, techId];
    
    if (isEdit && editingOrder) {
      setEditingOrder({ ...editingOrder, technicianIds: updatedIds });
    } else {
      setNewOrder({ ...newOrder, technicianIds: updatedIds });
    }
  };

  const handleEditOrder = (order: WorkOrder) => {
    setEditingOrder({ ...order });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    await updateWorkOrder(editingOrder.id, editingOrder);
    setIsEditModalOpen(false);
    setEditingOrder(null);
  };

  const handleDeleteOrder = async (id: string) => {
    await deleteWorkOrder(id);
    setDeleteConfirm(null);
  };

  const handleStatusChange = async (workOrderId: string, newStatus: 'New' | 'Assigned' | 'In Progress' | 'Completed') => {
    await updateWorkOrder(workOrderId, { status: newStatus });
    setStatusDropdown(null);
  };

  const canManageOrder = currentUser?.role !== 'Technician';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {currentUser?.role === 'Technician' ? 'My Jobs' : 'Work Orders'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and track all service jobs</p>
        </div>
        {canManageOrder && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Job
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search work orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="All">All Status</option>
            <option value="New">New</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Order ID</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Customer</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Status</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Priority</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Technicians</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Date</th>
                {canManageOrder && <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((wo) => {
                  const customer = customers.find(c => c.id === wo.customerId);
                  const assignedTechs = technicians.filter(t => wo.technicianIds.includes(t.id));
                  
                  return (
                    <tr key={wo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{wo.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">#{wo.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{customer?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{wo.location.address}</div>
                      </td>
                      <td className="px-6 py-4">
                        {canManageOrder ? (
                          <div className="relative">
                            <button
                              onClick={() => setStatusDropdown(statusDropdown === wo.id ? null : wo.id)}
                              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                wo.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                                wo.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                                wo.status === 'Assigned' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {wo.status}
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {statusDropdown === wo.id && (
                              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-32">
                                {(['New', 'Assigned', 'In Progress', 'Completed'] as const).map(status => (
                                  <button
                                    key={status}
                                    onClick={() => handleStatusChange(wo.id, status)}
                                    className="block w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 first:rounded-t-lg last:rounded-b-lg"
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            wo.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                            wo.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                            wo.status === 'Assigned' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {wo.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 text-sm ${
                          wo.priority === 'Critical' ? 'text-red-600 dark:text-red-400 font-medium' :
                          wo.priority === 'High' ? 'text-orange-600 dark:text-orange-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          <AlertCircle className="w-3 h-3" />
                          {wo.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {assignedTechs.length > 0 ? (
                          <div className="flex -space-x-2 overflow-hidden">
                            {assignedTechs.map(tech => (
                              <div key={tech.id} className="ring-2 ring-white dark:ring-gray-800 rounded-full">
                                <Avatar
                                  src={tech.avatar}
                                  name={tech.name}
                                  size={32}
                                  showStatus={true}
                                  status={tech.status}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(wo.scheduledStart).toLocaleDateString()}
                      </td>
                      {canManageOrder && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditOrder(wo)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setDeleteConfirm(deleteConfirm === wo.id ? null : wo.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {deleteConfirm === wo.id && (
                                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 p-3 w-48">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Delete this work order?</p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOrder(wo.id)}
                                      className="flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No work orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Work Order"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={newOrder.title || ''}
              onChange={e => setNewOrder({...newOrder, title: e.target.value})}
              placeholder="e.g. AC Repair"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={newOrder.customerId || ''}
              onChange={e => setNewOrder({...newOrder, customerId: e.target.value})}
            >
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={newOrder.priority}
                onChange={e => setNewOrder({...newOrder, priority: e.target.value as 'Low' | 'Medium' | 'High' | 'Critical'})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={newOrder.serviceType}
                onChange={e => setNewOrder({...newOrder, serviceType: e.target.value})}
              >
                <option value="Repair">Repair</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Installation">Installation</option>
                <option value="Inspection">Inspection</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
            <input
              type="date"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={newOrder.scheduledStart ? new Date(newOrder.scheduledStart).toISOString().split('T')[0] : ''}
              onChange={e => {
                if (e.target.value) {
                  const date = new Date(e.target.value);
                  const startTime = newOrder.scheduledStart ? new Date(newOrder.scheduledStart).getHours() : 9;
                  const endTime = newOrder.scheduledEnd ? new Date(newOrder.scheduledEnd).getHours() : startTime + 2;
                  
                  date.setHours(startTime, 0, 0, 0);
                  const scheduledStart = date.toISOString();
                  
                  date.setHours(endTime, 0, 0, 0);
                  const scheduledEnd = date.toISOString();
                  
                  setNewOrder({...newOrder, scheduledStart, scheduledEnd});
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newOrder.scheduledStart ? new Date(newOrder.scheduledStart).toTimeString().slice(0, 5) : '09:00'}
                onChange={e => {
                  const [hours, minutes] = e.target.value.split(':');
                  const date = newOrder.scheduledStart ? new Date(newOrder.scheduledStart) : new Date();
                  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  setNewOrder({...newOrder, scheduledStart: date.toISOString()});
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newOrder.scheduledEnd ? new Date(newOrder.scheduledEnd).toTimeString().slice(0, 5) : '11:00'}
                onChange={e => {
                  const [hours, minutes] = e.target.value.split(':');
                  const date = newOrder.scheduledEnd ? new Date(newOrder.scheduledEnd) : new Date();
                  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  setNewOrder({...newOrder, scheduledEnd: date.toISOString()});
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Technicians (Optional)</label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
              {technicians.map(tech => (
                <label key={tech.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input 
                    type="checkbox"
                    checked={(newOrder.technicianIds || []).includes(tech.id)}
                    onChange={() => toggleTechnicianSelection(tech.id)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{tech.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{tech.status}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {newOrder.location?.address || 'No location selected'}
            </div>
            <LocationPicker 
              initialLocation={newOrder.location}
              onLocationSelect={(loc) => setNewOrder({...newOrder, location: loc})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
              value={newOrder.description || ''}
              onChange={e => setNewOrder({...newOrder, description: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingOrder(null);
        }}
        title="Edit Work Order"
      >
        {editingOrder && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editingOrder.title || ''}
                onChange={e => setEditingOrder({...editingOrder, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
                value={editingOrder.description || ''}
                onChange={e => setEditingOrder({...editingOrder, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={editingOrder.priority}
                  onChange={e => setEditingOrder({...editingOrder, priority: e.target.value as 'Low' | 'Medium' | 'High' | 'Critical'})}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={editingOrder.serviceType}
                  onChange={e => setEditingOrder({...editingOrder, serviceType: e.target.value})}
                >
                  <option value="Repair">Repair</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Installation">Installation</option>
                  <option value="Inspection">Inspection</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editingOrder.scheduledStart ? new Date(editingOrder.scheduledStart).toISOString().split('T')[0] : ''}
                onChange={e => {
                  if (e.target.value) {
                    const date = new Date(e.target.value);
                    const startTime = editingOrder.scheduledStart ? new Date(editingOrder.scheduledStart).getHours() : 9;
                    const endTime = editingOrder.scheduledEnd ? new Date(editingOrder.scheduledEnd).getHours() : startTime + 2;
                    
                    date.setHours(startTime, 0, 0, 0);
                    const scheduledStart = date.toISOString();
                    
                    date.setHours(endTime, 0, 0, 0);
                    const scheduledEnd = date.toISOString();
                    
                    setEditingOrder({...editingOrder, scheduledStart, scheduledEnd});
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editingOrder.scheduledStart ? new Date(editingOrder.scheduledStart).toTimeString().slice(0, 5) : '09:00'}
                  onChange={e => {
                    const [hours, minutes] = e.target.value.split(':');
                    const date = editingOrder.scheduledStart ? new Date(editingOrder.scheduledStart) : new Date();
                    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    setEditingOrder({...editingOrder, scheduledStart: date.toISOString()});
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editingOrder.scheduledEnd ? new Date(editingOrder.scheduledEnd).toTimeString().slice(0, 5) : '11:00'}
                  onChange={e => {
                    const [hours, minutes] = e.target.value.split(':');
                    const date = editingOrder.scheduledEnd ? new Date(editingOrder.scheduledEnd) : new Date();
                    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    setEditingOrder({...editingOrder, scheduledEnd: date.toISOString()});
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Technicians</label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                {technicians.map(tech => (
                  <label key={tech.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input 
                      type="checkbox"
                      checked={editingOrder.technicianIds.includes(tech.id)}
                      onChange={() => toggleTechnicianSelection(tech.id, true)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{tech.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{tech.status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={editingOrder.status}
                onChange={e => setEditingOrder({...editingOrder, status: e.target.value as 'New' | 'Assigned' | 'In Progress' | 'Completed'})}
              >
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {editingOrder.location?.address || 'No location selected'}
              </div>
              <LocationPicker 
                initialLocation={editingOrder.location}
                onLocationSelect={(loc) => setEditingOrder({...editingOrder, location: loc})}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingOrder(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default WorkOrders;
