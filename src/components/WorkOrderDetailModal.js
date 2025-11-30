import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, MapPin, Clock, DollarSign, User } from 'lucide-react';
import { useFSMStore } from '../store/useFSMStore';
import { WorkOrderResources } from './WorkOrderResources';
import { WorkOrderNotes } from './WorkOrderNotes';
export const WorkOrderDetailModal = ({ workOrderId, isOpen, onClose, onAddResource, onDeleteResource, onAddNote, onDeleteNote, currentUserName, currentUserId, technicians, customers = [], invoices = [], canEdit }) => {
    const [activeTab, setActiveTab] = useState('details');
    const { workOrders, fetchWorkOrders } = useFSMStore();
    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    useEffect(() => {
        if (!isOpen)
            return;
        const pollInterval = setInterval(() => {
            fetchWorkOrders().catch(err => console.error('Auto-poll failed:', err));
        }, 5000);
        return () => clearInterval(pollInterval);
    }, [isOpen, fetchWorkOrders]);
    if (!isOpen || !workOrder)
        return null;
    const getTechnicianName = (id) => {
        return technicians.find(t => t.id === id)?.name || 'Unknown';
    };
    const getCustomerName = () => {
        if (workOrder.customerName)
            return workOrder.customerName;
        const customer = customers.find(c => c.id === workOrder.customerId);
        return customer?.name || 'Unknown';
    };
    const getInvoiceTotal = () => {
        const invoice = invoices.find(inv => inv.workOrderId === workOrder.id);
        return invoice?.total || Number(workOrder.price);
    };
    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString();
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-gray-100", children: workOrder.title }), _jsx("button", { onClick: onClose, className: "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition", children: _jsx(X, { className: "w-6 h-6 text-gray-500 dark:text-gray-400" }) })] }), _jsx("div", { className: "flex gap-0 border-b border-gray-200 dark:border-gray-700", children: ['details', 'resources', 'notes'].map(tab => (_jsx("button", { onClick: () => setActiveTab(tab), className: `px-4 py-3 font-medium capitalize transition-colors ${activeTab === tab
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'}`, children: tab }, tab))) }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [activeTab === 'details' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Status" }), _jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-gray-100 capitalize", children: workOrder.status })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Priority" }), _jsx("p", { className: `text-sm font-medium capitalize ${workOrder.priority === 'Critical' ? 'text-red-600 dark:text-red-400' :
                                                        workOrder.priority === 'High' ? 'text-orange-600 dark:text-orange-400' :
                                                            workOrder.priority === 'Medium' ? 'text-blue-600 dark:text-blue-400' :
                                                                'text-green-600 dark:text-green-400'}`, children: workOrder.priority })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Customer" }), _jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-gray-100", children: getCustomerName() })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Service Type" }), _jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-gray-100", children: workOrder.serviceType })] })] }), workOrder.description && (_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Description" }), _jsx("p", { className: "text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap", children: workOrder.description })] })), _jsx("div", { children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(MapPin, { className: "w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Location" }), _jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-gray-100", children: workOrder.location.address })] })] }) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Clock, { className: "w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Scheduled" }), _jsxs("p", { className: "text-sm text-gray-900 dark:text-gray-100", children: [formatDateTime(workOrder.scheduledStart), " - ", formatDateTime(workOrder.scheduledEnd)] })] })] }), workOrder.actualStart && (_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Clock, { className: "w-4 h-4 text-green-500 dark:text-green-400 mt-1" }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Actual" }), _jsxs("p", { className: "text-sm text-gray-900 dark:text-gray-100", children: [formatDateTime(workOrder.actualStart), " ", workOrder.actualEnd && `- ${formatDateTime(workOrder.actualEnd)}`] })] })] }))] }), _jsx("div", { children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(User, { className: "w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Assigned Technicians" }), _jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: workOrder.technicianIds.map(techId => (_jsx("span", { className: "px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded", children: getTechnicianName(techId) }, techId))) })] })] }) }), _jsx("div", { children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(DollarSign, { className: "w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Price" }), _jsxs("p", { className: "text-sm font-bold text-gray-900 dark:text-gray-100", children: ["$", Number(getInvoiceTotal()).toFixed(2)] })] })] }) })] })), activeTab === 'resources' && (_jsx(WorkOrderResources, { resources: workOrder.resources || [], onAddResource: (file, description) => onAddResource(workOrder.id, file, description), onDeleteResource: (resourceId) => onDeleteResource(workOrder.id, resourceId), canEdit: canEdit })), activeTab === 'notes' && (_jsx(WorkOrderNotes, { notes: workOrder.notes || [], onAddNote: (content) => onAddNote(workOrder.id, content), onDeleteNote: (noteId) => onDeleteNote(workOrder.id, noteId), currentUserName: currentUserName, currentUserId: currentUserId, canEdit: canEdit }))] })] }) }));
};
