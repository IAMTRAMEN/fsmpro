import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { Search, MapPin, Mail, Plus, Trash2, Edit2 } from 'lucide-react';
import Modal from '../components/Modal';
import { Avatar } from '../components/ToastNotification';
const Technicians = () => {
    const { technicians, workOrders, currentUser, addUser, updateUser, deleteUser } = useFSMStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Technician',
        skills: [],
        status: 'Available',
        location: { lat: 0, lng: 0, address: '' }
    });
    const filteredTechs = technicians.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())));
    // Permission Logic
    const canManageTechs = ['Manager', 'Owner', 'SuperAdmin'].includes(currentUser?.role || '');
    const canDelete = (targetRole) => {
        if (!currentUser)
            return false;
        if (currentUser.role === 'SuperAdmin')
            return true;
        if (currentUser.role === 'Owner' && ['Technician', 'Manager'].includes(targetRole))
            return true;
        if (currentUser.role === 'Manager' && targetRole === 'Technician')
            return true;
        return false;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            updateUser(editingId, formData);
        }
        else {
            const newUser = {
                id: `t${Date.now()}`,
                name: formData.name || '',
                email: formData.email || '',
                role: 'Technician',
                skills: formData.skills || [],
                status: formData.status || 'Available',
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
    const handleEdit = (tech) => {
        setEditingId(tech.id);
        setFormData(tech);
        setIsModalOpen(true);
    };
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this technician?')) {
            deleteUser(id);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-gray-100", children: "Technicians" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Manage field staff and availability" })] }), canManageTechs && (_jsxs("button", { onClick: () => {
                            setEditingId(null);
                            setFormData({ name: '', email: '', role: 'Technician', skills: [], status: 'Available', location: { lat: 0, lng: 0, address: '' } });
                            setIsModalOpen(true);
                        }, className: "bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), " Add Technician"] }))] }), _jsx("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "Search by name or skill...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredTechs.map((tech) => {
                    const activeJob = workOrders.find(wo => wo.technicianIds.includes(tech.id) && wo.status === 'In Progress');
                    const isDeletable = canDelete(tech.role);
                    return (_jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group", children: [isDeletable && (_jsxs("div", { className: "absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx("button", { onClick: () => handleEdit(tech), className: "p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(tech.id), className: "p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })), _jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx(Avatar, { src: tech.avatar, name: tech.name, size: 64, showStatus: true, status: tech.status }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${tech.status === 'Available' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                                            tech.status === 'Busy' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                                                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`, children: tech.status })] }), _jsx("h3", { className: "font-bold text-gray-900 dark:text-gray-100 text-lg", children: tech.name }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-4", children: tech.role }), _jsx("div", { className: "flex flex-wrap gap-2 mb-4", children: tech.skills.map(skill => (_jsx("span", { className: "px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs rounded-md font-medium", children: skill }, skill))) }), _jsxs("div", { className: "space-y-2 pt-4 border-t border-gray-50 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm", children: [_jsx(Mail, { className: "w-4 h-4 text-gray-400 dark:text-gray-500" }), tech.email] }), _jsxs("div", { className: "flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm", children: [_jsx(MapPin, { className: "w-4 h-4 text-gray-400 dark:text-gray-500" }), tech.location.address] })] }), activeJob && (_jsxs("div", { className: "mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg", children: [_jsx("p", { className: "text-xs text-blue-600 dark:text-blue-300 font-medium mb-1", children: "Currently Working On:" }), _jsx("p", { className: "text-sm font-medium text-blue-900 dark:text-blue-100 truncate", children: activeJob.title })] }))] }, tech.id));
                }) }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: editingId ? "Edit Technician" : "Add Technician", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Name" }), _jsx("input", { type: "text", required: true, className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Email" }), _jsx("input", { type: "email", required: true, className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Skills (comma separated)" }), _jsx("input", { type: "text", className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.skills?.join(', '), onChange: e => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()) }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Address" }), _jsx("input", { type: "text", className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", value: formData.location?.address, onChange: e => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } }) })] }), _jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [_jsx("button", { type: "button", onClick: () => setIsModalOpen(false), className: "px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: editingId ? 'Update' : 'Add' })] })] }) })] }));
};
export default Technicians;
