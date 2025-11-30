import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { ChevronLeft, ChevronRight, Plus, Keyboard, Download } from 'lucide-react';
import { Avatar } from '../components/ToastNotification';
import { ScheduleFilterBar } from '../components/ScheduleFilterBar';
import { ScheduleJobCard, ScheduleJobCardCompact } from '../components/ScheduleJobCard';
import { ScheduleContextMenu } from '../components/ScheduleContextMenu';
import { ScheduleCreateWorkOrderModal, ScheduleEditWorkOrderModal } from '../components/ScheduleWorkOrderModals';
import { WorkOrderDetailModal } from '../components/WorkOrderDetailModal';
import ConfirmationModal from '../components/ConfirmationModal';
import type { WorkOrder } from '../types/index';

type ViewMode = 'week' | 'month';

const Schedule = () => {
  const {
    technicians,
    workOrders,
    currentUser,
    updateWorkOrder,
    addWorkOrder,
    deleteWorkOrder,
    addWorkOrderResource,
    deleteWorkOrderResource,
    addWorkOrderNote,
    deleteWorkOrderNote,
    customers,
    invoices,
    addNotification
  } = useFSMStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsedTechs, setCollapsedTechs] = useState<Set<string>>(new Set());

  const [draggedWorkOrder, setDraggedWorkOrder] = useState<WorkOrder | null>(null);
  const [, setDragOverSlot] = useState<{ techId: string; hour: number; minute: number } | null>(null);
  const [, setIsDragging] = useState(false);

  const [isNewWorkOrderModalOpen, setIsNewWorkOrderModalOpen] = useState(false);
  const [isEditWorkOrderModalOpen, setIsEditWorkOrderModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; workOrder: WorkOrder } | null>(null);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; workOrderId: string; workOrderTitle: string } | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  const [newWorkOrderData, setNewWorkOrderData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as const,
    technicianId: '',
    scheduledStart: '',
    scheduledEnd: '',
    estimatedDuration: 60,
    location: { address: '', lat: 0, lng: 0 }
  });

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
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  const handleNextDay = useCallback(() => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else if (viewMode === 'month') {
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

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const displayedTechs = useMemo(() => {
    let techs = currentUser?.role === 'Technician'
      ? technicians.filter(t => t.id === currentUser.id)
      : technicians;

    // For technicians, if no technicians in the array, create a display object from current user data
    if (currentUser?.role === 'Technician' && techs.length === 0) {
      techs = [{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role as any,
        avatar: currentUser.avatar,
        skills: (currentUser as any).skills || [],
        status: (currentUser as any).status || 'Available',
        location: (currentUser as any).location || { lat: 0, lng: 0, address: '' },
        lastUpdate: new Date().toISOString(),
        accuracy: 0
      }];
    }

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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'n':
          if ((event.ctrlKey || event.metaKey) && currentUser?.role !== 'Technician') {
            event.preventDefault();
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
          }
          break;
        case 'ArrowLeft':
          if (event.altKey) {
            event.preventDefault();
            handlePrevDay();
          }
          break;
        case 'ArrowRight':
          if (event.altKey) {
            event.preventDefault();
            handleNextDay();
          }
          break;
        case 'Home':
          if (event.altKey) {
            event.preventDefault();
            setCurrentDate(new Date());
          }
          break;
        case 'Escape':
          if (contextMenu) {
            setContextMenu(null);
          }
          if (deleteConfirmation) {
            setDeleteConfirmation(null);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [contextMenu, deleteConfirmation, handlePrevDay, handleNextDay]);



  const handleDragStart = useCallback((workOrder: WorkOrder) => {
    setDraggedWorkOrder(workOrder);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedWorkOrder(null);
    setDragOverSlot(null);
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((techId: string, hour: number, minute: number = 0) => {
    setDragOverSlot({ techId, hour, minute });
  }, []);

  const handleDrop = useCallback(async (techId: string, hour: number, minute: number = 0) => {
    if (!draggedWorkOrder) return;

    const newScheduledStart = new Date(currentDate);
    newScheduledStart.setHours(hour, minute, 0, 0);

    const oldStart = new Date(draggedWorkOrder.scheduledStart);
    const oldEnd = new Date(draggedWorkOrder.scheduledEnd);
    const duration = oldEnd.getTime() - oldStart.getTime();

    const newScheduledEnd = new Date(newScheduledStart.getTime() + duration);

    const updatedWorkOrder = {
      ...draggedWorkOrder,
      technicianIds: [techId],
      scheduledStart: newScheduledStart.toISOString(),
      scheduledEnd: newScheduledEnd.toISOString(),
    };

    await updateWorkOrder(draggedWorkOrder.id, updatedWorkOrder);
    handleDragEnd();
  }, [draggedWorkOrder, currentDate, updateWorkOrder, handleDragEnd]);

  const handleDoubleClick = useCallback((techId: string, hour: number, minute: number = 0) => {
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

  const handleWorkOrderClick = useCallback((workOrder: WorkOrder, event: React.MouseEvent) => {
    if (isBulkMode) {
      if (bulkSelection.includes(workOrder.id)) {
        setBulkSelection(bulkSelection.filter(id => id !== workOrder.id));
      } else {
        setBulkSelection([...bulkSelection, workOrder.id]);
      }
    } else if (event.ctrlKey || event.metaKey) {
      if (bulkSelection.includes(workOrder.id)) {
        setBulkSelection(bulkSelection.filter(id => id !== workOrder.id));
      } else {
        setBulkSelection([...bulkSelection, workOrder.id]);
      }
    } else {
      setSelectedWorkOrder(workOrder);
      setIsDetailModalOpen(true);
    }
  }, [isBulkMode, bulkSelection]);

  const handleContextMenu = useCallback((workOrder: WorkOrder, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      workOrder
    });
  }, []);

  const handleCreateWorkOrder = useCallback(async () => {
    if (!newWorkOrderData.title || !newWorkOrderData.technicianId) {
      alert('Please fill in the required fields');
      return;
    }

    const workOrder: WorkOrder = {
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
        lat: newWorkOrderData.location.lat || 0,
        lng: newWorkOrderData.location.lng || 0,
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
    if (!selectedWorkOrder) return;
    await updateWorkOrder(selectedWorkOrder.id, selectedWorkOrder);
    setIsEditWorkOrderModalOpen(false);
    setSelectedWorkOrder(null);
  }, [selectedWorkOrder, updateWorkOrder]);

  const handleDeleteWorkOrder = useCallback(async (workOrderId: string) => {
    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    if (workOrder) {
      setDeleteConfirmation({
        isOpen: true,
        workOrderId,
        workOrderTitle: workOrder.title
      });
    }
    setContextMenu(null);
  }, [workOrders]);

  const confirmDeleteWorkOrder = useCallback(async () => {
    if (deleteConfirmation) {
      await deleteWorkOrder(deleteConfirmation.workOrderId);
      setDeleteConfirmation(null);
    }
  }, [deleteConfirmation, deleteWorkOrder]);

  const cancelDeleteWorkOrder = useCallback(() => {
    setDeleteConfirmation(null);
  }, []);

  const handleDuplicate = useCallback(async (workOrder: WorkOrder) => {
    const duplicatedWorkOrder: WorkOrder = {
      ...workOrder,
      id: `wo-${Date.now()}`,
      title: `${workOrder.title} (Copy)`,
      status: 'New'
    };
    await addWorkOrder(duplicatedWorkOrder);
    setContextMenu(null);
  }, [addWorkOrder]);

  const getDayJobs = useCallback((techId: string, date: Date) => {
    return filteredWorkOrders.filter(wo => {
      const start = new Date(wo.scheduledStart);
      return wo.technicianIds.includes(techId) && isSameDay(start, date);
    });
  }, [filteredWorkOrders]);

  const toggleTechCollapse = useCallback((techId: string) => {
    const newCollapsed = new Set(collapsedTechs);
    if (newCollapsed.has(techId)) {
      newCollapsed.delete(techId);
    } else {
      newCollapsed.add(techId);
    }
    setCollapsedTechs(newCollapsed);
  }, [collapsedTechs]);

  const getJobsForTimeSlot = useCallback((techId: string, hour: number, minute: number = 0) => {
    return filteredWorkOrders.filter(wo => {
      const start = new Date(wo.scheduledStart);
      const end = new Date(wo.scheduledEnd);

      if (!isSameDay(start, currentDate)) return false;

      if (!wo.technicianIds.includes(techId)) return false;

      const jobStartHour = start.getHours();
      const jobStartMinute = start.getMinutes();
      const jobEndHour = end.getHours();
      const jobEndMinute = end.getMinutes();

      const slotTime = hour * 60 + minute;
      const jobStartTime = jobStartHour * 60 + jobStartMinute;
      const jobEndTime = jobEndHour * 60 + jobEndMinute;

      return slotTime >= jobStartTime && slotTime < jobEndTime;
    });
  }, [filteredWorkOrders, currentDate]);

  const handleBulkStatusUpdate = useCallback(async (status: string) => {
    for (const id of bulkSelection) {
      const workOrder = workOrders.find(wo => wo.id === id);
      if (workOrder) {
        await updateWorkOrder(id, { ...workOrder, status: status as any });
      }
    }
    setBulkSelection([]);
    setIsBulkMode(false);
  }, [bulkSelection, workOrders, updateWorkOrder]);

  const handleBulkDelete = useCallback(async () => {
    if (confirm(`Delete ${bulkSelection.length} work order${bulkSelection.length > 1 ? 's' : ''}?`)) {
      for (const id of bulkSelection) {
        await deleteWorkOrder(id);
      }
      setBulkSelection([]);
      setIsBulkMode(false);
    }
  }, [bulkSelection, deleteWorkOrder]);

  const exportToCSV = useCallback(() => {
    const headers = ['Title', 'Description', 'Service Type', 'Status', 'Priority', 'Technician', 'Customer', 'Scheduled Start', 'Scheduled End', 'Location', 'Price'];
    const csvData = filteredWorkOrders.map(wo => {
      const technician = technicians.find(t => t.id === wo.technicianIds[0]);
      const customer = customers.find(c => c.id === wo.customerId);
      return [
        wo.title,
        wo.description || '',
        wo.serviceType,
        wo.status,
        wo.priority,
        technician?.name || 'Unassigned',
        customer?.name || 'Unknown',
        new Date(wo.scheduledStart).toLocaleString(),
        new Date(wo.scheduledEnd).toLocaleString(),
        wo.location?.address || '',
        wo.price || 0
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `work-orders-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addNotification('Work orders exported successfully.', 'success');
  }, [filteredWorkOrders, technicians, customers]);

  return (
    <div className={`h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${isMobile ? 'mobile-schedule' : ''}`}>
      {/* Bulk Operations Bar */}
      {bulkSelection.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{bulkSelection.length} selected</span>
          <div className="flex gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusUpdate(e.target.value);
                  e.target.value = '';
                }
              }}
              className="px-3 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
            >
              <option value="">Change Status...</option>
              <option value="New">New</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Delete All
            </button>
            <button
              onClick={() => {
                setBulkSelection([]);
                setIsBulkMode(false);
              }}
              className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Schedule</h2>
          <div className="flex items-center gap-4">
            {/* View Mode Selector */}
            <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-1">
              {(['week', 'month'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm font-medium rounded capitalize ${
                    viewMode === mode ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-1">
              <button onClick={handlePrevDay} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded dark:text-gray-100">
                Today
              </button>
              <span className="text-sm font-medium px-2 min-w-[120px] text-center text-gray-900 dark:text-gray-100">
                {viewMode === 'week' && `${weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                {viewMode === 'month' && currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={handleNextDay} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Export Button - Hidden from Technicians */}
            {currentUser?.role !== 'Technician' && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                title="Export to CSV"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}

            {/* Keyboard Shortcuts Help */}
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
              title="Keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Create Button - Hidden from Technicians */}
            {currentUser?.role !== 'Technician' && (
              <button
                onClick={() => {
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
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                title="Create new work order"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            )}
          </div>
        </div>

        <ScheduleFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedTechnicians={selectedTechnicians}
          onTechniciansChange={setSelectedTechnicians}
          selectedPriorities={selectedPriorities}
          onPrioritiesChange={setSelectedPriorities}
          selectedStatuses={selectedStatuses}
          onStatusesChange={setSelectedStatuses}
          technicians={technicians}
          showTechnicianDropdown={showTechnicianDropdown}
          onTechnicianDropdownToggle={setShowTechnicianDropdown}
          showPriorityDropdown={showPriorityDropdown}
          onPriorityDropdownToggle={setShowPriorityDropdown}
          showStatusDropdown={showStatusDropdown}
          onStatusDropdownToggle={setShowStatusDropdown}
          onClearFilters={clearFilters}
          currentUserRole={currentUser?.role}
        />
      </div>

      {/* Calendar Grid */}
      <div className={`flex-1 overflow-auto ${isMobile ? 'mobile-grid' : ''}`}>
        <div className={`min-w-[800px] ${isMobile ? 'mobile-min-width' : ''}`}>
          {/* Header Row */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div className="w-48 p-3 border-r border-b border-gray-200 dark:border-gray-800 font-medium text-gray-500 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 content-center text-center">Technician</div>
            {viewMode === 'week' && weekDays.map(day => (
              <div key={day.toISOString()} className="flex-1 p-3 text-center border-r border-gray-100 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 min-w-[120px]">
                <div className="font-medium">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                <div className="text-xs">{day.getDate()}</div>
              </div>
            ))}
            {viewMode === 'month' && (
              <div className="flex-1 p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                Monthly View
              </div>
            )}
          </div>

          {/* Empty State */}
          {displayedTechs.length === 0 && (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <p>No technicians to display</p>
            </div>
          )}





          {(viewMode === 'week' || viewMode === 'month') && displayedTechs.map(tech => {
            const isTechCollapsed = isMobile && collapsedTechs.has(tech.id);
            const techJobs = getDayJobs(tech.id, currentDate);
            
            return (
              <div key={tech.id} className={`flex border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isMobile ? 'mobile-tech-row' : ''}`}>
                <div
                  className={`w-48 p-3 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-700 font-medium items-center gap-3 sticky left-0 flex z-20 ${isMobile ? 'mobile-tech-header cursor-pointer' : ''}`}
                  onClick={() => isMobile && toggleTechCollapse(tech.id)}
                >
                  {isMobile && (
                    <span className="text-lg mr-1">{isTechCollapsed ? '▶' : '▼'}</span>
                  )}
                  <Avatar
                    src={tech.avatar}
                    name={tech.name}
                    size={32}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tech.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tech.skills?.[0] || 'General'}</p>
                  </div>
                </div>

                {!isTechCollapsed && viewMode === 'week' && weekDays.map(day => (
                  <div key={day.toISOString()} className="flex-1 border-r border-gray-100 min-w-[120px] p-2">
                    {getDayJobs(tech.id, day).map(job => (
                      <div key={job.id} className="mb-1">
                        <ScheduleJobCardCompact
                          job={job}
                          isSelected={bulkSelection.includes(job.id)}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onClick={handleWorkOrderClick}
                          onContextMenu={handleContextMenu}
                        />
                      </div>
                    ))}
                  </div>
                ))}

                {!isTechCollapsed && viewMode === 'month' && (
                  <div className="flex-1 p-2">
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dayJobs = getDayJobs(tech.id, dayDate);

                        return (
                          <div key={day} className="min-h-[60px] border border-gray-200 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-700">
                            <div className="text-xs font-medium mb-1 text-gray-900 dark:text-gray-100">{day}</div>
                            {dayJobs.slice(0, 2).map(job => (
                              <div
                                key={job.id}
                                className={`text-xs p-1 mb-1 rounded truncate cursor-pointer hover:shadow-md transition-shadow ${
                                  job.priority === 'Critical' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                                  job.priority === 'High' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' :
                                  'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                                }`}
                                title={job.title}
                                onClick={(e) => handleWorkOrderClick(job, e)}
                              >
                                {job.title}
                              </div>
                            ))}
                            {dayJobs.length > 2 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">+{dayJobs.length - 2} more</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ScheduleContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          workOrder={contextMenu.workOrder}
          onEdit={(wo) => {
            setSelectedWorkOrder(wo);
            setIsEditWorkOrderModalOpen(true);
            setContextMenu(null);
          }}
          onDuplicate={currentUser?.role !== 'Technician' ? handleDuplicate : undefined}
          onDelete={currentUser?.role !== 'Technician' ? handleDeleteWorkOrder : undefined}
        />
      )}

      {/* Modals */}
      <ScheduleCreateWorkOrderModal
        isOpen={isNewWorkOrderModalOpen}
        onClose={() => setIsNewWorkOrderModalOpen(false)}
        formData={newWorkOrderData}
        onFormChange={setNewWorkOrderData}
        technicians={technicians}
        onCreate={handleCreateWorkOrder}
      />

      <ScheduleEditWorkOrderModal
        isOpen={isEditWorkOrderModalOpen}
        onClose={() => setIsEditWorkOrderModalOpen(false)}
        workOrder={selectedWorkOrder}
        onWorkOrderChange={setSelectedWorkOrder}
        onUpdate={handleUpdateWorkOrder}
      />

       {selectedWorkOrder && (
         <WorkOrderDetailModal
           workOrderId={selectedWorkOrder.id}
           isOpen={isDetailModalOpen}
           onClose={() => setIsDetailModalOpen(false)}
           onAddResource={addWorkOrderResource}
           onDeleteResource={deleteWorkOrderResource}
           onAddNote={addWorkOrderNote}
           onDeleteNote={deleteWorkOrderNote}
           currentUserName={currentUser?.name || 'Unknown'}
           currentUserId={currentUser?.id || ''}
           technicians={technicians}
           customers={customers}
           invoices={invoices}
           canEdit={
             selectedWorkOrder.technicianIds.includes(currentUser?.id || '') ||
             currentUser?.role === 'Manager' ||
             currentUser?.role === 'Owner' ||
             currentUser?.role === 'SuperAdmin'
           }
         />
       )}

       {/* Delete Confirmation Modal */}
       {deleteConfirmation && (
         <ConfirmationModal
           isOpen={deleteConfirmation.isOpen}
           title="Delete Work Order"
           message={`Are you sure you want to delete "${deleteConfirmation.workOrderTitle}"? This action cannot be undone.`}
           confirmText="Delete"
           cancelText="Cancel"
           onConfirm={confirmDeleteWorkOrder}
           onCancel={cancelDeleteWorkOrder}
           type="danger"
         />
       )}

       {/* Keyboard Shortcuts Help Modal */}
       {showKeyboardHelp && (
         <div className="fixed inset-0 z-50 overflow-y-auto">
           <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
             <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowKeyboardHelp(false)} />

             <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <Keyboard className="w-6 h-6 text-blue-500" />
                   <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h3>
                 </div>
                 <button
                   onClick={() => setShowKeyboardHelp(false)}
                   className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                 >
                   ✕
                 </button>
               </div>

               <div className="space-y-3">
                 <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                   <span className="text-sm text-gray-600 dark:text-gray-400">Create work order</span>
                   <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-900 dark:text-gray-100">Ctrl+N</kbd>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                   <span className="text-sm text-gray-600 dark:text-gray-400">Previous period</span>
                   <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-900 dark:text-gray-100">Alt+←</kbd>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                   <span className="text-sm text-gray-600 dark:text-gray-400">Next period</span>
                   <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-900 dark:text-gray-100">Alt+→</kbd>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                   <span className="text-sm text-gray-600 dark:text-gray-400">Go to today</span>
                   <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-900 dark:text-gray-100">Alt+Home</kbd>
                 </div>
                 <div className="flex justify-between items-center py-2">
                   <span className="text-sm text-gray-600 dark:text-gray-400">Close modals/menus</span>
                   <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-900 dark:text-gray-100">Esc</kbd>
                 </div>
               </div>

               <div className="mt-6 flex justify-end">
                 <button
                   onClick={() => setShowKeyboardHelp(false)}
                   className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                 >
                   Got it!
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
   </div>
 );
};

export default Schedule;
