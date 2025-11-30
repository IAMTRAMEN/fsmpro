import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { Search, MapPin, Phone, Mail, History, Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
const Customers = () => {
    const { customers, workOrders, currentUser, addCustomer, updateCustomer, deleteCustomer } = useFSMStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: { lat: 0, lng: 0, address: '' },
        serviceHistory: []
    });
    const filteredCustomers = customers.filter(c => (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    const canManageCustomers = ['Manager', 'Owner', 'SuperAdmin'].includes(currentUser?.role || '');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            updateCustomer(editingId, formData);
        }
        else {
            const newCustomer = {
                ...formData,
                id: `c${Date.now()}`,
                serviceHistory: []
            };
            addCustomer(newCustomer);
        }
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', email: '', phone: '', location: { lat: 0, lng: 0, address: '' }, serviceHistory: [] });
    };
    const handleEdit = (customer) => {
        setEditingId(customer.id);
        setFormData(customer);
        setIsModalOpen(true);
    };
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            deleteCustomer(id);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-gray-100", children: "Customers" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Manage client database and history" })] }), canManageCustomers && (_jsxs("button", { onClick: () => {
                            setEditingId(null);
                            setFormData({ name: '', email: '', phone: '', location: { lat: 0, lng: 0, address: '' }, serviceHistory: [] });
                            setIsModalOpen(true);
                        }, className: "bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), " Add Customer"] }))] }), _jsx("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "Search customers by name or email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredCustomers.map((customer) => {
                    const customerJobs = workOrders.filter(wo => wo.customerId === customer.id);
                    const lastJob = customerJobs.sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime())[0];
                    return (_jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group", children: [canManageCustomers && (_jsxs("div", { className: "absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl p-1", children: [_jsx("button", { onClick: () => handleEdit(customer), className: "p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(customer.id), className: "p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })), _jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl", children: customer.name.charAt(0) }), _jsxs("span", { className: "mt-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs font-medium", children: [customerJobs.length, " Jobs"] })] }), _jsx("h3", { className: "font-bold text-gray-900 dark:text-gray-100 text-lg mb-1", children: customer.name }), _jsxs("div", { className: "space-y-2 mt-4", children: [_jsxs("div", { className: "flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm", children: [_jsx(Mail, { className: "w-4 h-4 text-gray-400 dark:text-gray-500" }), customer.email] }), _jsxs("div", { className: "flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm", children: [_jsx(Phone, { className: "w-4 h-4 text-gray-400 dark:text-gray-500" }), customer.phone] }), _jsxs("div", { className: "flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm", children: [_jsx(MapPin, { className: "w-4 h-4 text-gray-400 dark:text-gray-500" }), customer.location.address] })] }), lastJob && (_jsxs("div", { className: "mt-6 pt-4 border-t border-gray-50 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400", children: [_jsx(History, { className: "w-3 h-3" }), "Last Service: ", new Date(lastJob.scheduledStart).toLocaleDateString()] }), _jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 truncate", children: lastJob.title })] }))] }, customer.id));
                }) }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: editingId ? "Edit Customer" : "Add Customer", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Name" }), _jsx("input", { type: "text", required: true, className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Email" }), _jsx("input", { type: "email", required: true, className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Phone" }), _jsx("input", { type: "text", required: true, className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.phone, onChange: e => setFormData({ ...formData, phone: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Address" }), _jsx("input", { type: "text", className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.location?.address, onChange: e => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } }) })] }), _jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [_jsx("button", { type: "button", onClick: () => setIsModalOpen(false), className: "px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: editingId ? 'Update' : 'Add' })] })] }) })] }));
};
export default Customers;
