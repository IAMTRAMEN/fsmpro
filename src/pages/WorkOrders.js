import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { Search, Filter, Plus, MapPin, AlertCircle, Edit, Trash2, ChevronDown } from 'lucide-react';
import Modal from '../components/Modal';
import LocationPicker from '../components/LocationPicker';
import { Avatar } from '../components/ToastNotification';
const WorkOrders = () => {
    const { workOrders, customers, technicians, addWorkOrder, updateWorkOrder, deleteWorkOrder, currentUser } = useFSMStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [statusDropdown, setStatusDropdown] = useState(null);
    // Form State
    const [newOrder, setNewOrder] = useState({
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
    const handleCreateOrder = (e) => {
        e.preventDefault();
        if (!newOrder.title || !newOrder.customerId)
            return;
        const order = {
            id: `wo${Date.now()}`,
            customerId: newOrder.customerId,
            customerName: customers.find(c => c.id === newOrder.customerId)?.name || 'Unknown Customer',
            technicianIds: newOrder.technicianIds || [],
            title: newOrder.title,
            description: newOrder.description || '',
            serviceType: newOrder.serviceType || 'Maintenance',
            status: newOrder.technicianIds?.length ? 'Assigned' : 'New',
            priority: newOrder.priority,
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
    const toggleTechnicianSelection = (techId, isEdit = false) => {
        const target = isEdit ? editingOrder : newOrder;
        const currentIds = target?.technicianIds || [];
        const updatedIds = currentIds.includes(techId)
            ? currentIds.filter(id => id !== techId)
            : [...currentIds, techId];
        if (isEdit && editingOrder) {
            setEditingOrder({ ...editingOrder, technicianIds: updatedIds });
        }
        else {
            setNewOrder({ ...newOrder, technicianIds: updatedIds });
        }
    };
    const handleEditOrder = (order) => {
        setEditingOrder({ ...order });
        setIsEditModalOpen(true);
    };
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingOrder)
            return;
        await updateWorkOrder(editingOrder.id, editingOrder);
        setIsEditModalOpen(false);
        setEditingOrder(null);
    };
    const handleDeleteOrder = async (id) => {
        await deleteWorkOrder(id);
        setDeleteConfirm(null);
    };
    const handleStatusChange = async (workOrderId, newStatus) => {
        await updateWorkOrder(workOrderId, { status: newStatus });
        setStatusDropdown(null);
    };
    const canManageOrder = currentUser?.role !== 'Technician';
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-gray-100", children: currentUser?.role === 'Technician' ? 'My Jobs' : 'Work Orders' }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Manage and track all service jobs" })] }), canManageOrder && (_jsxs("button", { onClick: () => setIsCreateModalOpen(true), className: "bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), " Create Job"] }))] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "Search work orders...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { className: "text-gray-400 w-4 h-4" }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100", children: [_jsx("option", { value: "All", children: "All Status" }), _jsx("option", { value: "New", children: "New" }), _jsx("option", { value: "Assigned", children: "Assigned" }), _jsx("option", { value: "In Progress", children: "In Progress" }), _jsx("option", { value: "Completed", children: "Completed" })] })] })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm", children: "Order ID" }), _jsx("th", { className: "px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm", children: "Customer" }), _jsx("th", { className: "px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm", children: "Status" }), _jsx("th", { className: "px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm", children: "Priority" }), _jsx("th", { className: "px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm", children: "Technicians" }), _jsx("th", { className: "px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm", children: "Date" }), canManageOrder && _jsx("th", { className: "px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-100 dark:divide-gray-700", children: filteredOrders.length > 0 ? (filteredOrders.map((wo) => {
                                    const customer = customers.find(c => c.id === wo.customerId);
                                    const assignedTechs = technicians.filter(t => wo.technicianIds.includes(t.id));
                                    return (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: [_jsxs("td", { className: "px-6 py-4", children: [_jsx("div", { className: "font-medium text-gray-900 dark:text-gray-100", children: wo.title }), _jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: ["#", wo.id] })] }), _jsxs("td", { className: "px-6 py-4", children: [_jsx("div", { className: "text-sm text-gray-900 dark:text-gray-100", children: customer?.name }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: wo.location.address })] }), _jsx("td", { className: "px-6 py-4", children: canManageOrder ? (_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setStatusDropdown(statusDropdown === wo.id ? null : wo.id), className: `px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${wo.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                                                                wo.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                                                                    wo.status === 'Assigned' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' :
                                                                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`, children: [wo.status, _jsx(ChevronDown, { className: "w-3 h-3" })] }), statusDropdown === wo.id && (_jsx("div", { className: "absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-32", children: ['New', 'Assigned', 'In Progress', 'Completed'].map(status => (_jsx("button", { onClick: () => handleStatusChange(wo.id, status), className: "block w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 first:rounded-t-lg last:rounded-b-lg", children: status }, status))) }))] })) : (_jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${wo.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                                                        wo.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                                                            wo.status === 'Assigned' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' :
                                                                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`, children: wo.status })) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("span", { className: `flex items-center gap-1 text-sm ${wo.priority === 'Critical' ? 'text-red-600 dark:text-red-400 font-medium' :
                                                        wo.priority === 'High' ? 'text-orange-600 dark:text-orange-400' :
                                                            'text-gray-600 dark:text-gray-400'}`, children: [_jsx(AlertCircle, { className: "w-3 h-3" }), wo.priority] }) }), _jsx("td", { className: "px-6 py-4", children: assignedTechs.length > 0 ? (_jsx("div", { className: "flex -space-x-2 overflow-hidden", children: assignedTechs.map(tech => (_jsx("div", { className: "ring-2 ring-white dark:ring-gray-800 rounded-full", children: _jsx(Avatar, { src: tech.avatar, name: tech.name, size: 32, showStatus: true, status: tech.status }) }, tech.id))) })) : (_jsx("span", { className: "text-sm text-gray-400 dark:text-gray-500 italic", children: "Unassigned" })) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-500 dark:text-gray-400", children: new Date(wo.scheduledStart).toLocaleDateString() }), canManageOrder && (_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => handleEditOrder(wo), className: "p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors", title: "Edit", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setDeleteConfirm(deleteConfirm === wo.id ? null : wo.id), className: "p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors", title: "Delete", children: _jsx(Trash2, { className: "w-4 h-4" }) }), deleteConfirm === wo.id && (_jsxs("div", { className: "absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 p-3 w-48", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-gray-100 mb-3", children: "Delete this work order?" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setDeleteConfirm(null), className: "flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300", children: "Cancel" }), _jsx("button", { onClick: () => handleDeleteOrder(wo.id), className: "flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700", children: "Delete" })] })] }))] })] }) }))] }, wo.id));
                                })) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-gray-500 dark:text-gray-400", children: "No work orders found." }) })) })] }) }) }), _jsx(Modal, { isOpen: isCreateModalOpen, onClose: () => setIsCreateModalOpen(false), title: "Create New Work Order", children: _jsxs("form", { onSubmit: handleCreateOrder, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Title" }), _jsx("input", { type: "text", required: true, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500", value: newOrder.title || '', onChange: e => setNewOrder({ ...newOrder, title: e.target.value }), placeholder: "e.g. AC Repair" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Customer" }), _jsxs("select", { required: true, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500", value: newOrder.customerId || '', onChange: e => setNewOrder({ ...newOrder, customerId: e.target.value }), children: [_jsx("option", { value: "", children: "Select Customer" }), customers.map(c => (_jsx("option", { value: c.id, children: c.name }, c.id)))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Priority" }), _jsxs("select", { className: "w-full border border-gray-300 rounded-lg px-3 py-2", value: newOrder.priority, onChange: e => setNewOrder({ ...newOrder, priority: e.target.value }), children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Critical", children: "Critical" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Type" }), _jsxs("select", { className: "w-full border border-gray-300 rounded-lg px-3 py-2", value: newOrder.serviceType, onChange: e => setNewOrder({ ...newOrder, serviceType: e.target.value }), children: [_jsx("option", { value: "Repair", children: "Repair" }), _jsx("option", { value: "Maintenance", children: "Maintenance" }), _jsx("option", { value: "Installation", children: "Installation" }), _jsx("option", { value: "Inspection", children: "Inspection" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Scheduled Date" }), _jsx("input", { type: "date", required: true, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500", value: newOrder.scheduledStart ? new Date(newOrder.scheduledStart).toISOString().split('T')[0] : '', onChange: e => {
                                        if (e.target.value) {
                                            const date = new Date(e.target.value);
                                            const startTime = newOrder.scheduledStart ? new Date(newOrder.scheduledStart).getHours() : 9;
                                            const endTime = newOrder.scheduledEnd ? new Date(newOrder.scheduledEnd).getHours() : startTime + 2;
                                            date.setHours(startTime, 0, 0, 0);
                                            const scheduledStart = date.toISOString();
                                            date.setHours(endTime, 0, 0, 0);
                                            const scheduledEnd = date.toISOString();
                                            setNewOrder({ ...newOrder, scheduledStart, scheduledEnd });
                                        }
                                    } })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Start Time" }), _jsx("input", { type: "time", className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500", value: newOrder.scheduledStart ? new Date(newOrder.scheduledStart).toTimeString().slice(0, 5) : '09:00', onChange: e => {
                                                const [hours, minutes] = e.target.value.split(':');
                                                const date = newOrder.scheduledStart ? new Date(newOrder.scheduledStart) : new Date();
                                                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                setNewOrder({ ...newOrder, scheduledStart: date.toISOString() });
                                            } })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "End Time" }), _jsx("input", { type: "time", className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500", value: newOrder.scheduledEnd ? new Date(newOrder.scheduledEnd).toTimeString().slice(0, 5) : '11:00', onChange: e => {
                                                const [hours, minutes] = e.target.value.split(':');
                                                const date = newOrder.scheduledEnd ? new Date(newOrder.scheduledEnd) : new Date();
                                                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                setNewOrder({ ...newOrder, scheduledEnd: date.toISOString() });
                                            } })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Assign Technicians (Optional)" }), _jsx("div", { className: "border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2", children: technicians.map(tech => (_jsxs("label", { className: "flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded", children: [_jsx("input", { type: "checkbox", checked: (newOrder.technicianIds || []).includes(tech.id), onChange: () => toggleTechnicianSelection(tech.id), className: "rounded text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700", children: tech.name }), _jsx("span", { className: "text-xs text-gray-400 ml-auto", children: tech.status })] }, tech.id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Location" }), _jsxs("div", { className: "mb-2 text-sm text-gray-500 flex items-center gap-2", children: [_jsx(MapPin, { className: "w-4 h-4" }), newOrder.location?.address || 'No location selected'] }), _jsx(LocationPicker, { initialLocation: newOrder.location, onLocationSelect: (loc) => setNewOrder({ ...newOrder, location: loc }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("textarea", { className: "w-full border border-gray-300 rounded-lg px-3 py-2", rows: 3, value: newOrder.description || '', onChange: e => setNewOrder({ ...newOrder, description: e.target.value }) })] }), _jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [_jsx("button", { type: "button", onClick: () => setIsCreateModalOpen(false), className: "px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Create Order" })] })] }) }), _jsx(Modal, { isOpen: isEditModalOpen, onClose: () => {
                    setIsEditModalOpen(false);
                    setEditingOrder(null);
                }, title: "Edit Work Order", children: editingOrder && (_jsxs("form", { onSubmit: handleSaveEdit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Title" }), _jsx("input", { type: "text", required: true, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500", value: editingOrder.title || '', onChange: e => setEditingOrder({ ...editingOrder, title: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("textarea", { className: "w-full border border-gray-300 rounded-lg px-3 py-2", rows: 3, value: editingOrder.description || '', onChange: e => setEditingOrder({ ...editingOrder, description: e.target.value }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Priority" }), _jsxs("select", { className: "w-full border border-gray-300 rounded-lg px-3 py-2", value: editingOrder.priority, onChange: e => setEditingOrder({ ...editingOrder, priority: e.target.value }), children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Critical", children: "Critical" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Type" }), _jsxs("select", { className: "w-full border border-gray-300 rounded-lg px-3 py-2", value: editingOrder.serviceType, onChange: e => setEditingOrder({ ...editingOrder, serviceType: e.target.value }), children: [_jsx("option", { value: "Repair", children: "Repair" }), _jsx("option", { value: "Maintenance", children: "Maintenance" }), _jsx("option", { value: "Installation", children: "Installation" }), _jsx("option", { value: "Inspection", children: "Inspection" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Scheduled Date" }), _jsx("input", { type: "date", required: true, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500", value: editingOrder.scheduledStart ? new Date(editingOrder.scheduledStart).toISOString().split('T')[0] : '', onChange: e => {
                                        if (e.target.value) {
                                            const date = new Date(e.target.value);
                                            const startTime = editingOrder.scheduledStart ? new Date(editingOrder.scheduledStart).getHours() : 9;
                                            const endTime = editingOrder.scheduledEnd ? new Date(editingOrder.scheduledEnd).getHours() : startTime + 2;
                                            date.setHours(startTime, 0, 0, 0);
                                            const scheduledStart = date.toISOString();
                                            date.setHours(endTime, 0, 0, 0);
                                            const scheduledEnd = date.toISOString();
                                            setEditingOrder({ ...editingOrder, scheduledStart, scheduledEnd });
                                        }
                                    } })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Start Time" }), _jsx("input", { type: "time", className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500", value: editingOrder.scheduledStart ? new Date(editingOrder.scheduledStart).toTimeString().slice(0, 5) : '09:00', onChange: e => {
                                                const [hours, minutes] = e.target.value.split(':');
                                                const date = editingOrder.scheduledStart ? new Date(editingOrder.scheduledStart) : new Date();
                                                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                setEditingOrder({ ...editingOrder, scheduledStart: date.toISOString() });
                                            } })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "End Time" }), _jsx("input", { type: "time", className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500", value: editingOrder.scheduledEnd ? new Date(editingOrder.scheduledEnd).toTimeString().slice(0, 5) : '11:00', onChange: e => {
                                                const [hours, minutes] = e.target.value.split(':');
                                                const date = editingOrder.scheduledEnd ? new Date(editingOrder.scheduledEnd) : new Date();
                                                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                setEditingOrder({ ...editingOrder, scheduledEnd: date.toISOString() });
                                            } })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Assign Technicians" }), _jsx("div", { className: "border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2", children: technicians.map(tech => (_jsxs("label", { className: "flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded", children: [_jsx("input", { type: "checkbox", checked: editingOrder.technicianIds.includes(tech.id), onChange: () => toggleTechnicianSelection(tech.id, true), className: "rounded text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700", children: tech.name }), _jsx("span", { className: "text-xs text-gray-400 ml-auto", children: tech.status })] }, tech.id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Status" }), _jsxs("select", { className: "w-full border border-gray-300 rounded-lg px-3 py-2", value: editingOrder.status, onChange: e => setEditingOrder({ ...editingOrder, status: e.target.value }), children: [_jsx("option", { value: "New", children: "New" }), _jsx("option", { value: "Assigned", children: "Assigned" }), _jsx("option", { value: "In Progress", children: "In Progress" }), _jsx("option", { value: "Completed", children: "Completed" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Location" }), _jsxs("div", { className: "mb-2 text-sm text-gray-500 flex items-center gap-2", children: [_jsx(MapPin, { className: "w-4 h-4" }), editingOrder.location?.address || 'No location selected'] }), _jsx(LocationPicker, { initialLocation: editingOrder.location, onLocationSelect: (loc) => setEditingOrder({ ...editingOrder, location: loc }) })] }), _jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [_jsx("button", { type: "button", onClick: () => {
                                        setIsEditModalOpen(false);
                                        setEditingOrder(null);
                                    }, className: "px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Save Changes" })] })] })) })] }));
};
export default WorkOrders;
