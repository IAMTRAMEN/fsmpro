import React, { useState } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { Search, MapPin, Phone, Mail, History, Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { Customer } from '../types';

const Customers = () => {
  const { customers, workOrders, currentUser, addCustomer, updateCustomer, deleteCustomer } = useFSMStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    location: { lat: 0, lng: 0, address: '' },
    serviceHistory: []
  });

  const filteredCustomers = customers.filter(c =>
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const canManageCustomers = ['Manager', 'Owner', 'SuperAdmin'].includes(currentUser?.role || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateCustomer(editingId, formData);
    } else {
      const newCustomer: Customer = {
        ...formData as Customer,
        id: `c${Date.now()}`,
        serviceHistory: []
      };
      addCustomer(newCustomer);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', location: { lat: 0, lng: 0, address: '' }, serviceHistory: [] });
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData(customer);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage client database and history</p>
        </div>
        {canManageCustomers && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', email: '', phone: '', location: { lat: 0, lng: 0, address: '' }, serviceHistory: [] });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => {
          const customerJobs = workOrders.filter(wo => wo.customerId === customer.id);
          const lastJob = customerJobs.sort((a, b) => 
            new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime()
          )[0];

          return (
            <div key={customer.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group">
              {canManageCustomers && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl p-1">
                  <button onClick={() => handleEdit(customer)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(customer.id)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl">
                  {customer.name.charAt(0)}
                </div>
                <span className="mt-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs font-medium">
                  {customerJobs.length} Jobs
                </span>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">{customer.name}</h3>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {customer.email}
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {customer.phone}
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {customer.location.address}
                </div>
              </div>

              {lastJob && (
                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <History className="w-3 h-3" />
                    Last Service: {new Date(lastJob.scheduledStart).toLocaleDateString()}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 truncate">
                    {lastJob.title}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Customer" : "Add Customer"}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
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

export default Customers;
