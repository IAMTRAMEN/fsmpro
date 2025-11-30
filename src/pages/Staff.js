import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { Search, MapPin, Mail, Shield, Briefcase, Wrench, User as UserIcon, Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { Avatar } from '../components/ToastNotification';
const Staff = () => {
    const { users, workOrders, currentUser, addUser, updateUser, deleteUser } = useFSMStore();
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
        location: { lat: 0, lng: 0, address: '' },
        password: ''
    });
    // Filter users based on permissions
    const getVisibleUsers = () => {
        if (!currentUser)
            return [];
        let visibleUsers = users;
        if (currentUser.role === 'Manager') {
            visibleUsers = users.filter(u => u.role === 'Technician');
        }
        else if (currentUser.role === 'Owner') {
            visibleUsers = users.filter(u => ['Technician', 'Manager'].includes(u.role));
        }
        else if (currentUser.role === 'SuperAdmin') {
            visibleUsers = users; // See everyone
        }
        else {
            return []; // Technicians don't see this page usually
        }
        return visibleUsers.filter(u => (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (u.role?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    };
    const filteredUsers = getVisibleUsers();
    // Permission Logic for Actions
    const canManageRole = (targetRole) => {
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
    const getAllowedRoles = () => {
        if (!currentUser)
            return [];
        if (currentUser.role === 'SuperAdmin')
            return ['SuperAdmin', 'Owner', 'Manager', 'Technician'];
        if (currentUser.role === 'Owner')
            return ['Manager', 'Technician'];
        if (currentUser.role === 'Manager')
            return ['Technician'];
        return [];
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            updateUser(editingId, formData);
        }
        else {
            const newUser = {
                id: `u${Date.now()}`,
                ...formData,
                avatar: undefined // Will be handled by the Avatar component
            };
            addUser(newUser);
        }
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', email: '', role: 'Technician', skills: [], status: 'Available', location: { lat: 0, lng: 0, address: '' } });
    };
    const handleEdit = (user) => {
        setEditingId(user.id);
        // Cast to Technician to access skills/status if they exist, otherwise they'll be undefined which is fine
        setFormData(user);
        setIsModalOpen(true);
    };
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteUser(id);
        }
    };
    const getRoleIcon = (role) => {
        switch (role) {
            case 'SuperAdmin': return _jsx(Shield, { className: "w-5 h-5 text-purple-600" });
            case 'Owner': return _jsx(UserIcon, { className: "w-5 h-5 text-blue-600" });
            case 'Manager': return _jsx(Briefcase, { className: "w-5 h-5 text-orange-600" });
            case 'Technician': return _jsx(Wrench, { className: "w-5 h-5 text-green-600" });
            default: return _jsx(UserIcon, { className: "w-5 h-5 text-gray-600" });
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Staff Management" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Manage users and permissions" })] }), _jsxs("button", { onClick: () => {
                            setEditingId(null);
                            setFormData({ name: '', email: '', role: 'Technician', skills: [], status: 'Available', location: { lat: 0, lng: 0, address: '' } });
                            setIsModalOpen(true);
                        }, className: "bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), " Add Staff"] })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "Search by name, email, or role...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredUsers.map((user) => {
                    const isDeletable = canManageRole(user.role);
                    const isTechnician = user.role === 'Technician';
                    const techData = user;
                    const activeJob = isTechnician
                        ? workOrders.find(wo => wo.technicianIds.includes(user.id) && wo.status === 'In Progress')
                        : null;
                    return (_jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group", children: [isDeletable && (_jsxs("div", { className: "absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx("button", { onClick: () => handleEdit(user), className: "p-1 text-gray-400 hover:text-blue-600", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(user.id), className: "p-1 text-gray-400 hover:text-red-600", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })), _jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx(Avatar, { src: user.avatar, name: user.name, size: 64, showStatus: isTechnician, status: techData?.status }), _jsxs("div", { className: "mt-8 flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full", children: [getRoleIcon(user.role), _jsx("span", { className: "text-xs font-medium text-gray-700 dark:text-gray-300", children: user.role })] })] }), _jsx("h3", { className: "font-bold text-gray-900 dark:text-white text-lg", children: user.name }), _jsxs("div", { className: "flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4", children: [_jsx(Mail, { className: "w-4 h-4" }), " ", user.email] }), isTechnician && techData.skills && (_jsx("div", { className: "flex flex-wrap gap-2 mb-4", children: techData.skills.map(skill => (_jsx("span", { className: "px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded-md font-medium", children: skill }, skill))) })), isTechnician && techData.location && (_jsx("div", { className: "space-y-2 pt-4 border-t border-gray-50 dark:border-gray-600", children: _jsxs("div", { className: "flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm", children: [_jsx(MapPin, { className: "w-4 h-4 text-gray-400 dark:text-gray-500" }), techData.location.address || 'No location data'] }) })), activeJob && (_jsxs("div", { className: "mt-4 bg-blue-50 dark:bg-blue-900 p-3 rounded-lg", children: [_jsx("p", { className: "text-xs text-blue-600 dark:text-blue-400 font-medium mb-1", children: "Currently Working On:" }), _jsx("p", { className: "text-sm font-medium text-blue-900 dark:text-blue-100 truncate", children: activeJob.title })] }))] }, user.id));
                }) }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: editingId ? "Edit Staff" : "Add Staff", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Name" }), _jsx("input", { type: "text", required: true, className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2", value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Email" }), _jsx("input", { type: "email", required: true, className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2", value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Password" }), _jsx("input", { type: "password", className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2", value: formData.password || '', onChange: e => setFormData({ ...formData, password: e.target.value }), placeholder: editingId ? "Leave blank to keep current" : "Required", required: !editingId })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Role" }), _jsx("select", { className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2", value: formData.role, onChange: e => setFormData({ ...formData, role: e.target.value }), children: getAllowedRoles().map(role => (_jsx("option", { value: role, children: role }, role))) })] }), formData.role === 'Technician' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Skills (comma separated)" }), _jsx("input", { type: "text", className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2", value: formData.skills?.join(', '), onChange: e => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()) }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Address" }), _jsx("input", { type: "text", className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2", value: formData.location?.address, onChange: e => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } }) })] })] })), _jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [_jsx("button", { type: "button", onClick: () => setIsModalOpen(false), className: "px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: editingId ? 'Update' : 'Add' })] })] }) })] }));
};
export default Staff;
