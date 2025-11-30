import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { Search, MapPin, Phone, Mail, Truck, Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
const Providers = () => {
    const { providers, currentUser, addProvider, updateProvider, deleteProvider } = useFSMStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        serviceType: '',
        email: '',
        phone: '',
        address: '',
        status: 'Active'
    });
    const filteredProviders = providers.filter(p => (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.serviceType?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    const canManageProviders = ['Manager', 'Owner', 'SuperAdmin'].includes(currentUser?.role || '');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            updateProvider(editingId, formData);
        }
        else {
            const newProvider = {
                id: `p${Date.now()}`,
                name: formData.name || '',
                serviceType: formData.serviceType || '',
                email: formData.email || '',
                phone: formData.phone || '',
                address: formData.address || '',
                status: formData.status || 'Active'
            };
            addProvider(newProvider);
        }
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', serviceType: '', email: '', phone: '', address: '', status: 'Active' });
    };
    const handleEdit = (provider) => {
        setEditingId(provider.id);
        setFormData(provider);
        setIsModalOpen(true);
    };
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this provider?')) {
            deleteProvider(id);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-gray-100", children: "Providers" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Manage service providers and suppliers" })] }), canManageProviders && (_jsxs("button", { onClick: () => {
                            setEditingId(null);
                            setFormData({ name: '', serviceType: '', email: '', phone: '', address: '', status: 'Active' });
                            setIsModalOpen(true);
                        }, className: "bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), " Add Provider"] }))] }), _jsx("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "Search providers by name or service...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredProviders.map((provider) => (_jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group", children: [canManageProviders && (_jsxs("div", { className: "absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx("button", { onClick: () => handleEdit(provider), className: "p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(provider.id), className: "p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })), _jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("div", { className: "w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl", children: _jsx(Truck, { className: "w-6 h-6" }) }), _jsx("span", { className: `mt-6 px-2 py-1 rounded text-xs font-medium ${provider.status === 'Active' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`, children: provider.status })] }), _jsx("h3", { className: "font-bold text-gray-900 dark:text-gray-100 text-lg mb-1", children: provider.name }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-4", children: provider.serviceType }), _jsxs("div", { className: "space-y-2 pt-4 border-t border-gray-50 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm", children: [_jsx(Mail, { className: "w-4 h-4 text-gray-400 dark:text-gray-500" }), provider.email] }), _jsxs("div", { className: "flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm", children: [_jsx(Phone, { className: "w-4 h-4 text-gray-400 dark:text-gray-500" }), provider.phone] }), _jsxs("div", { className: "flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm", children: [_jsx(MapPin, { className: "w-4 h-4 text-gray-400 dark:text-gray-500" }), provider.address] })] })] }, provider.id))) }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: editingId ? "Edit Provider" : "Add Provider", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Name" }), _jsx("input", { type: "text", required: true, className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Service Type" }), _jsx("input", { type: "text", required: true, className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.serviceType, onChange: e => setFormData({ ...formData, serviceType: e.target.value }), placeholder: "e.g. Logistics, Parts" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Email" }), _jsx("input", { type: "email", required: true, className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Phone" }), _jsx("input", { type: "text", required: true, className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.phone, onChange: e => setFormData({ ...formData, phone: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Address" }), _jsx("input", { type: "text", className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.address, onChange: e => setFormData({ ...formData, address: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Status" }), _jsxs("select", { className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.status, onChange: e => setFormData({ ...formData, status: e.target.value }), children: [_jsx("option", { value: "Active", children: "Active" }), _jsx("option", { value: "Inactive", children: "Inactive" })] })] }), _jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [_jsx("button", { type: "button", onClick: () => setIsModalOpen(false), className: "px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: editingId ? 'Update' : 'Add' })] })] }) })] }));
};
export default Providers;
