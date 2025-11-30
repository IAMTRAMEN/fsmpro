import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ScheduleFilterBar } from '../components/ScheduleFilterBar';
import { ScheduleJobCard, ScheduleJobCardCompact } from '../components/ScheduleJobCard';
import { ScheduleContextMenu } from '../components/ScheduleContextMenu';
import { ScheduleCreateWorkOrderModal, ScheduleEditWorkOrderModal } from '../components/ScheduleWorkOrderModals';
import ConfirmationModal from '../components/ConfirmationModal';
import { Avatar } from '../components/ToastNotification';
const Schedule = () => {
    const { technicians, workOrders, currentUser, updateWorkOrder, addWorkOrder, deleteWorkOrder } = useFSMStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('day');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTechnicians, setSelectedTechnicians] = useState([]);
    const [selectedPriorities, setSelectedPriorities] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false);
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [draggedWorkOrder, setDraggedWorkOrder] = useState(null);
    const [dragOverSlot, setDragOverSlot] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isNewWorkOrderModalOpen, setIsNewWorkOrderModalOpen] = useState(false);
    const [isEditWorkOrderModalOpen, setIsEditWorkOrderModalOpen] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [bulkSelection, setBulkSelection] = useState([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState(null);
    const [newWorkOrderData, setNewWorkOrderData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        technicianId: '',
        scheduledStart: '',
        scheduledEnd: '',
        estimatedDuration: 60,
        location: { address: '', lat: 0, lng: 0 }
    });
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 8; hour < 20; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                slots.push({ hour, minute, label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` });
            }
        }
        return slots;
    }, []);
    const weekDays = useMemo(() => {
        const days = [];
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        return days;
    }, [currentDate]);
    const handlePrevDay = useCallback(() => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') {
            newDate.setDate(currentDate.getDate() - 1);
        }
        else if (viewMode === 'week') {
            newDate.setDate(currentDate.getDate() - 7);
        }
        else if (viewMode === 'month') {
            newDate.setMonth(currentDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    }, [currentDate, viewMode]);
    const handleNextDay = useCallback(() => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') {
            newDate.setDate(currentDate.getDate() + 1);
        }
        else if (viewMode === 'week') {
            newDate.setDate(currentDate.getDate() + 7);
        }
        else if (viewMode === 'month') {
            newDate.setMonth(currentDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    }, [currentDate, viewMode]);
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setSelectedTechnicians([]);
        setSelectedPriorities([]);
        setSelectedStatuses([]);
    }, []);
    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };
    const displayedTechs = useMemo(() => {
        let techs = currentUser?.role === 'Technician'
            ? technicians.filter(t => t.id === currentUser.id)
            : technicians;
        if (selectedTechnicians.length > 0) {
            techs = techs.filter(t => selectedTechnicians.includes(t.id));
        }
        return techs;
    }, [technicians, currentUser, selectedTechnicians]);
    const filteredWorkOrders = useMemo(() => {
        return workOrders.filter(wo => {
            if (searchTerm && !wo.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !(wo.location?.address || '').toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            if (selectedPriorities.length > 0 && !selectedPriorities.includes(wo.priority)) {
                return false;
            }
            if (selectedStatuses.length > 0 && !selectedStatuses.includes(wo.status)) {
                return false;
            }
            return true;
        });
    }, [workOrders, searchTerm, selectedPriorities, selectedStatuses]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            if (!target.closest('.dropdown-container')) {
                setShowTechnicianDropdown(false);
                setShowPriorityDropdown(false);
                setShowStatusDropdown(false);
            }
            if (!target.closest('.context-menu')) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    const handleDragStart = useCallback((workOrder) => {
        setDraggedWorkOrder(workOrder);
        setIsDragging(true);
    }, []);
    const handleDragEnd = useCallback(() => {
        setDraggedWorkOrder(null);
        setDragOverSlot(null);
        setIsDragging(false);
    }, []);
    const handleDragOver = useCallback((techId, hour, minute = 0) => {
        setDragOverSlot({ techId, hour, minute });
    }, []);
    const handleDrop = useCallback(async (techId, hour, minute = 0) => {
        if (!draggedWorkOrder)
            return;
        const newScheduledStart = new Date(currentDate);
        newScheduledStart.setHours(hour, minute, 0, 0);
        const newScheduledEnd = new Date(newScheduledStart);
        newScheduledEnd.setMinutes(newScheduledEnd.getMinutes() + (draggedWorkOrder.estimatedDuration || 60));
        const updatedWorkOrder = {
            ...draggedWorkOrder,
            technicianIds: [techId],
            scheduledStart: newScheduledStart.toISOString(),
            scheduledEnd: newScheduledEnd.toISOString(),
        };
        await updateWorkOrder(draggedWorkOrder.id, updatedWorkOrder);
        handleDragEnd();
    }, [draggedWorkOrder, currentDate, updateWorkOrder, handleDragEnd]);
    const handleDoubleClick = useCallback((techId, hour, minute = 0) => {
        const scheduledStart = new Date(currentDate);
        scheduledStart.setHours(hour, minute, 0, 0);
        const scheduledEnd = new Date(scheduledStart);
        scheduledEnd.setMinutes(scheduledEnd.getMinutes() + 60);
        setNewWorkOrderData({
            title: '',
            description: '',
            priority: 'Medium',
            technicianId: techId,
            scheduledStart: scheduledStart.toISOString().slice(0, 16),
            scheduledEnd: scheduledEnd.toISOString().slice(0, 16),
            estimatedDuration: 60,
            location: { address: '', lat: 0, lng: 0 }
        });
        setIsNewWorkOrderModalOpen(true);
    }, [currentDate]);
    const handleWorkOrderClick = useCallback((workOrder, event) => {
        if (isBulkMode) {
            if (bulkSelection.includes(workOrder.id)) {
                setBulkSelection(bulkSelection.filter(id => id !== workOrder.id));
            }
            else {
                setBulkSelection([...bulkSelection, workOrder.id]);
            }
        }
        else if (event.ctrlKey || event.metaKey) {
            if (bulkSelection.includes(workOrder.id)) {
                setBulkSelection(bulkSelection.filter(id => id !== workOrder.id));
            }
            else {
                setBulkSelection([...bulkSelection, workOrder.id]);
            }
        }
        else {
            setSelectedWorkOrder(workOrder);
            setIsEditWorkOrderModalOpen(true);
        }
    }, [isBulkMode, bulkSelection]);
    const handleContextMenu = useCallback((workOrder, event) => {
        event.preventDefault();
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            workOrder
        });
    }, []);
    const handleCreateWorkOrder = useCallback(async () => {
        if (!newWorkOrderData.title || !newWorkOrderData.technicianId) {
            // Show error toast notification
            return;
        }
        const workOrder = {
            id: `wo-${Date.now()}`,
            customerId: '',
            customerName: 'New Customer',
            technicianIds: [newWorkOrderData.technicianId],
            title: newWorkOrderData.title,
            description: newWorkOrderData.description,
            serviceType: 'General',
            status: 'Assigned',
            priority: newWorkOrderData.priority,
            scheduledStart: new Date(newWorkOrderData.scheduledStart).toISOString(),
            scheduledEnd: new Date(newWorkOrderData.scheduledEnd).toISOString(),
            location: {
                lat: 0,
                lng: 0,
                address: newWorkOrderData.location.address
            },
            price: 0,
            estimatedDuration: newWorkOrderData.estimatedDuration
        };
        await addWorkOrder(workOrder);
        setIsNewWorkOrderModalOpen(false);
        setNewWorkOrderData({
            title: '',
            description: '',
            priority: 'Medium',
            technicianId: '',
            scheduledStart: '',
            scheduledEnd: '',
            estimatedDuration: 60,
            location: { address: '', lat: 0, lng: 0 }
        });
    }, [newWorkOrderData, addWorkOrder]);
    const handleUpdateWorkOrder = useCallback(async () => {
        if (!selectedWorkOrder)
            return;
        await updateWorkOrder(selectedWorkOrder.id, selectedWorkOrder);
        setIsEditWorkOrderModalOpen(false);
        setSelectedWorkOrder(null);
    }, [selectedWorkOrder, updateWorkOrder]);
    const handleDeleteWorkOrder = useCallback(async (workOrderId) => {
        setConfirmationModal({
            isOpen: true,
            title: 'Delete Work Order',
            message: 'Are you sure you want to delete this work order? This action cannot be undone.',
            onConfirm: async () => {
                await deleteWorkOrder(workOrderId);
                setContextMenu(null);
                setConfirmationModal(null);
            }
        });
    }, [deleteWorkOrder]);
    const handleDuplicate = useCallback(async (workOrder) => {
        const duplicatedWorkOrder = {
            ...workOrder,
            id: `wo-${Date.now()}`,
            title: `${workOrder.title} (Copy)`,
            status: 'New'
        };
        await addWorkOrder(duplicatedWorkOrder);
        setContextMenu(null);
    }, [addWorkOrder]);
    const getDayJobs = useCallback((techId, date) => {
        return filteredWorkOrders.filter(wo => {
            const start = new Date(wo.scheduledStart);
            return wo.technicianIds.includes(techId) && isSameDay(start, date);
        });
    }, [filteredWorkOrders]);
    const getJobsForTimeSlot = useCallback((techId, hour, minute = 0) => {
        return filteredWorkOrders.filter(wo => {
            const start = new Date(wo.scheduledStart);
            const end = new Date(wo.scheduledEnd);
            if (!isSameDay(start, currentDate))
                return false;
            const jobStartHour = start.getHours();
            const jobStartMinute = start.getMinutes();
            const jobEndHour = end.getHours();
            const jobEndMinute = end.getMinutes();
            const slotTime = hour * 60 + minute;
            const jobStartTime = jobStartHour * 60 + jobStartMinute;
            const jobEndTime = jobEndHour * 60 + jobEndMinute;
            return wo.technicianIds.includes(techId) && slotTime >= jobStartTime && slotTime < jobEndTime;
        });
    }, [filteredWorkOrders, currentDate]);
    return (_jsxs("div", { className: `h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${isMobile ? 'mobile-schedule' : ''}`, children: [_jsxs("div", { className: "border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700", children: [_jsxs("div", { className: "p-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-bold text-gray-900 dark:text-gray-100", children: "Schedule" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 p-1", children: ['day', 'week', 'month'].map(mode => (_jsx("button", { onClick: () => setViewMode(mode), className: `px-3 py-1 text-sm font-medium rounded capitalize transition-colors ${viewMode === mode ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'}`, children: mode }, mode))) }), _jsxs("div", { className: "flex items-center gap-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 p-1", children: [_jsx("button", { onClick: handlePrevDay, className: "p-1 hover:bg-gray-100 dark:hover:bg-gray-500 rounded text-gray-600 dark:text-gray-300", children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setCurrentDate(new Date()), className: "px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-500 rounded text-gray-600 dark:text-gray-300", children: "Today" }), _jsxs("span", { className: "text-sm font-medium px-2 min-w-[120px] text-center text-gray-900 dark:text-gray-100", children: [viewMode === 'day' && currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }), viewMode === 'week' && `${weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`, viewMode === 'month' && currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })] }), _jsx("button", { onClick: handleNextDay, className: "p-1 hover:bg-gray-100 dark:hover:bg-gray-500 rounded text-gray-600 dark:text-gray-300", children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] }), _jsxs("button", { onClick: () => {
                                            const now = new Date();
                                            now.setHours(9, 0, 0, 0);
                                            const end = new Date(now);
                                            end.setHours(10, 0, 0, 0);
                                            setNewWorkOrderData({
                                                title: '',
                                                description: '',
                                                priority: 'Medium',
                                                technicianId: '',
                                                scheduledStart: now.toISOString().slice(0, 16),
                                                scheduledEnd: end.toISOString().slice(0, 16),
                                                estimatedDuration: 60,
                                                location: { address: '', lat: 0, lng: 0 }
                                            });
                                            setIsNewWorkOrderModalOpen(true);
                                        }, className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition", children: [_jsx(Plus, { className: "w-4 h-4" }), "Create"] })] })] }), _jsx(ScheduleFilterBar, { searchTerm: searchTerm, onSearchChange: setSearchTerm, selectedTechnicians: selectedTechnicians, onTechniciansChange: setSelectedTechnicians, selectedPriorities: selectedPriorities, onPrioritiesChange: setSelectedPriorities, selectedStatuses: selectedStatuses, onStatusesChange: setSelectedStatuses, technicians: technicians, showTechnicianDropdown: showTechnicianDropdown, onTechnicianDropdownToggle: setShowTechnicianDropdown, showPriorityDropdown: showPriorityDropdown, onPriorityDropdownToggle: setShowPriorityDropdown, showStatusDropdown: showStatusDropdown, onStatusDropdownToggle: setShowStatusDropdown, onClearFilters: clearFilters, currentUserRole: currentUser?.role })] }), _jsx("div", { className: `flex-1 overflow-auto ${isMobile ? 'mobile-grid' : ''}`, children: _jsxs("div", { className: `min-w-[800px] ${isMobile ? 'mobile-min-width' : ''}`, children: [_jsxs("div", { className: "flex border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10", children: [_jsx("div", { className: "w-48 p-3 border-r border-gray-200 dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700", children: "Technician" }), viewMode === 'day' && timeSlots.map((slot, index) => (_jsx("div", { className: "flex-1 p-3 text-center border-r border-gray-100 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 min-w-[60px]", children: slot.label }, index))), viewMode === 'week' && weekDays.map(day => (_jsxs("div", { className: "flex-1 p-3 text-center border-r border-gray-100 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 min-w-[120px]", children: [_jsx("div", { className: "font-medium", children: day.toLocaleDateString(undefined, { weekday: 'short' }) }), _jsx("div", { className: "text-xs", children: day.getDate() })] }, day.toISOString()))), viewMode === 'month' && (_jsx("div", { className: "flex-1 p-3 text-center text-sm text-gray-500 dark:text-gray-400", children: "Monthly View" }))] }), displayedTechs.map(tech => (_jsxs("div", { className: `flex border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isMobile ? 'mobile-tech-row' : ''}`, children: [_jsxs("div", { className: `w-48 p-3 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium items-center gap-3 sticky left-0 flex z-20 ${isMobile ? 'mobile-tech-header' : ''}`, children: [_jsx(Avatar, { src: tech.avatar, name: tech.name, size: 32 }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-gray-100 truncate", children: tech.name }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: tech.skills?.[0] || 'General' })] })] }), viewMode === 'day' && timeSlots.map((slot, index) => {
                                    const jobs = getJobsForTimeSlot(tech.id, slot.hour, slot.minute);
                                    const job = jobs.length > 0 ? jobs[0] : null;
                                    const isStart = job && new Date(job.scheduledStart).getHours() === slot.hour &&
                                        Math.floor(new Date(job.scheduledStart).getMinutes() / 15) === Math.floor(slot.minute / 15);
                                    return (_jsx("div", { className: `flex-1 border-r border-gray-100 dark:border-gray-600 min-w-[60px] relative p-0.5 cursor-default`, onDragOver: (e) => {
                                            e.preventDefault();
                                            handleDragOver(tech.id, slot.hour, slot.minute);
                                        }, onDrop: (e) => {
                                            e.preventDefault();
                                            handleDrop(tech.id, slot.hour, slot.minute);
                                        }, onDoubleClick: () => handleDoubleClick(tech.id, slot.hour, slot.minute), style: {
                                            backgroundColor: dragOverSlot?.techId === tech.id && dragOverSlot?.hour === slot.hour && Math.floor(dragOverSlot?.minute / 15) === Math.floor(slot.minute / 15)
                                                ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                        }, children: job && isStart && (_jsx(ScheduleJobCard, { job: job, isSelected: bulkSelection.includes(job.id), isDragging: isDragging && draggedWorkOrder?.id === job.id, height: `calc(${((new Date(job.scheduledEnd).getTime() - new Date(job.scheduledStart).getTime()) / (15 * 60 * 1000)) * 100}% - 4px)`, onDragStart: handleDragStart, onDragEnd: handleDragEnd, onClick: handleWorkOrderClick, onContextMenu: handleContextMenu })) }, index));
                                }), viewMode === 'week' && weekDays.map(day => (_jsx("div", { className: "flex-1 border-r border-gray-100 dark:border-gray-600 min-w-[120px] p-2", children: getDayJobs(tech.id, day).map(job => (_jsx("div", { className: "mb-1", children: _jsx(ScheduleJobCardCompact, { job: job, isSelected: bulkSelection.includes(job.id), onDragStart: handleDragStart, onDragEnd: handleDragEnd, onClick: handleWorkOrderClick, onContextMenu: handleContextMenu }) }, job.id))) }, day.toISOString()))), viewMode === 'month' && (_jsx("div", { className: "flex-1 p-2", children: _jsx("div", { className: "grid grid-cols-7 gap-1", children: Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                                            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                            const dayJobs = getDayJobs(tech.id, dayDate);
                                            return (_jsxs("div", { className: "min-h-[60px] border border-gray-200 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-700", children: [_jsx("div", { className: "text-xs font-medium mb-1 text-gray-900 dark:text-gray-100", children: day }), dayJobs.slice(0, 2).map(job => (_jsx("div", { className: `text-xs p-1 mb-1 rounded truncate cursor-pointer hover:shadow-md transition-shadow ${job.priority === 'Critical' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                                                            job.priority === 'High' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' :
                                                                'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'}`, title: job.title, onClick: (e) => handleWorkOrderClick(job, e), children: job.title }, job.id))), dayJobs.length > 2 && (_jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: ["+", dayJobs.length - 2, " more"] }))] }, day));
                                        }) }) }))] }, tech.id)))] }) }), contextMenu && (_jsx(ScheduleContextMenu, { x: contextMenu.x, y: contextMenu.y, workOrder: contextMenu.workOrder, onEdit: (wo) => {
                    setSelectedWorkOrder(wo);
                    setIsEditWorkOrderModalOpen(true);
                    setContextMenu(null);
                }, onDuplicate: handleDuplicate, onDelete: handleDeleteWorkOrder })), _jsx(ScheduleCreateWorkOrderModal, { isOpen: isNewWorkOrderModalOpen, onClose: () => setIsNewWorkOrderModalOpen(false), formData: newWorkOrderData, onFormChange: setNewWorkOrderData, technicians: technicians, onCreate: handleCreateWorkOrder }), _jsx(ScheduleEditWorkOrderModal, { isOpen: isEditWorkOrderModalOpen, onClose: () => setIsEditWorkOrderModalOpen(false), workOrder: selectedWorkOrder, onWorkOrderChange: setSelectedWorkOrder, onUpdate: handleUpdateWorkOrder }), _jsx(ConfirmationModal, { isOpen: confirmationModal?.isOpen || false, title: confirmationModal?.title || '', message: confirmationModal?.message || '', onConfirm: confirmationModal?.onConfirm || (() => { }), onCancel: () => setConfirmationModal(null) })] }));
};
export default Schedule;
