import { useState, useEffect } from 'react';
import { X, MapPin, Clock, DollarSign, User } from 'lucide-react';
import { useFSMStore } from '../store/useFSMStore';
import type { WorkOrder, WorkOrderResource, WorkOrderNote, Invoice, Customer } from '../types/index';
import { WorkOrderResources } from './WorkOrderResources';
import { WorkOrderNotes } from './WorkOrderNotes';

interface WorkOrderDetailModalProps {
  workOrderId: string;
  isOpen: boolean;
  onClose: () => void;
  onAddResource: (workOrderId: string, file: File, description?: string) => Promise<void>;
  onDeleteResource: (workOrderId: string, resourceId: string) => Promise<void>;
  onAddNote: (workOrderId: string, content: string) => Promise<void>;
  onDeleteNote: (workOrderId: string, noteId: string) => Promise<void>;
  currentUserName: string;
  currentUserId: string;
  technicians: { id: string; name: string }[];
  customers?: Customer[];
  invoices?: Invoice[];
  canEdit: boolean;
}

export const WorkOrderDetailModal = ({
  workOrderId,
  isOpen,
  onClose,
  onAddResource,
  onDeleteResource,
  onAddNote,
  onDeleteNote,
  currentUserName,
  currentUserId,
  technicians,
  customers = [],
  invoices = [],
  canEdit
}: WorkOrderDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'resources' | 'notes'>('details');
  const { workOrders, fetchWorkOrders } = useFSMStore();

  const workOrder = workOrders.find(wo => wo.id === workOrderId);

  useEffect(() => {
    if (!isOpen) return;

    const pollInterval = setInterval(() => {
      fetchWorkOrders().catch(err => console.error('Auto-poll failed:', err));
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isOpen, fetchWorkOrders]);

  if (!isOpen || !workOrder) return null;

  const getTechnicianName = (id: string) => {
    return technicians.find(t => t.id === id)?.name || 'Unknown';
  };

  const getCustomerName = () => {
    if (workOrder.customerName) return workOrder.customerName;
    const customer = customers.find(c => c.id === workOrder.customerId);
    return customer?.name || 'Unknown';
  };

  const getInvoiceTotal = () => {
    const invoice = invoices.find(inv => inv.workOrderId === workOrder.id);
    return invoice?.total || Number(workOrder.price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{workOrder.title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700">
          {['details', 'resources', 'notes'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{workOrder.status}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Priority</label>
                  <p className={`text-sm font-medium capitalize ${
                    workOrder.priority === 'Critical' ? 'text-red-600 dark:text-red-400' :
                    workOrder.priority === 'High' ? 'text-orange-600 dark:text-orange-400' :
                    workOrder.priority === 'Medium' ? 'text-blue-600 dark:text-blue-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {workOrder.priority}
                  </p>
                </div>
              </div>

              {/* Customer & Service Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Customer</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{getCustomerName()}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Service Type</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{workOrder.serviceType}</p>
                </div>
              </div>

              {/* Description */}
              {workOrder.description && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Description</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{workOrder.description}</p>
                </div>
              )}

              {/* Location */}
              <div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" />
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Location</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{workOrder.location.address}</p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" />
                  <div className="flex-1">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Scheduled</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {formatDateTime(workOrder.scheduledStart)} - {formatDateTime(workOrder.scheduledEnd)}
                    </p>
                  </div>
                </div>
                {workOrder.actualStart && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-green-500 dark:text-green-400 mt-1" />
                    <div className="flex-1">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Actual</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDateTime(workOrder.actualStart)} {workOrder.actualEnd && `- ${formatDateTime(workOrder.actualEnd)}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Technicians */}
              <div>
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" />
                  <div className="flex-1">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Assigned Technicians</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {workOrder.technicianIds.map(techId => (
                        <span key={techId} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                          {getTechnicianName(techId)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" />
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Price</label>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">${Number(getInvoiceTotal()).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <WorkOrderResources
              resources={workOrder.resources || []}
              onAddResource={(file, description) => onAddResource(workOrder.id, file, description)}
              onDeleteResource={(resourceId) => onDeleteResource(workOrder.id, resourceId)}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'notes' && (
            <WorkOrderNotes
              notes={workOrder.notes || []}
              onAddNote={(content) => onAddNote(workOrder.id, content)}
              onDeleteNote={(noteId) => onDeleteNote(workOrder.id, noteId)}
              currentUserName={currentUserName}
              currentUserId={currentUserId}
              canEdit={canEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
};
