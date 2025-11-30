import { useState } from 'react';
import Modal from './Modal';
import type { WorkOrder, Technician } from '../types/index';
import LocationPicker from './LocationPicker';

interface NewWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    technicianId: string;
    scheduledStart: string;
    scheduledEnd: string;
    estimatedDuration: number;
    location: { address: string; lat: number; lng: number };
  };
  onFormChange: (data: any) => void;
  technicians: Technician[];
  onCreate: () => void;
}

export const ScheduleCreateWorkOrderModal = ({
  isOpen,
  onClose,
  formData,
  onFormChange,
  technicians,
  onCreate
}: NewWorkOrderModalProps) => {
  const [showMap, setShowMap] = useState(false);

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    onFormChange({
      ...formData,
      location: location
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Work Order"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            placeholder="Work order title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Work order description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => onFormChange({ ...formData, priority: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Technician</label>
            <select
              value={formData.technicianId}
              onChange={(e) => onFormChange({ ...formData, technicianId: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select technician</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={formData.scheduledStart}
              onChange={(e) => onFormChange({ ...formData, scheduledStart: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
            <input
              type="datetime-local"
              value={formData.scheduledEnd}
              onChange={(e) => onFormChange({ ...formData, scheduledEnd: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
          <div className="space-y-2">
            <input
              type="text"
              value={formData.location.address}
              onChange={(e) => onFormChange({
                ...formData,
                location: { ...formData.location, address: e.target.value }
              })}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Job location address"
            />
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {showMap ? 'Hide Map' : 'Pick Location on Map'}
            </button>
            {showMap && (
              <LocationPicker
                initialLocation={formData.location}
                onLocationSelect={handleLocationSelect}
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Work Order
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface EditWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  onWorkOrderChange: (workOrder: WorkOrder) => void;
  onUpdate: () => void;
}

export const ScheduleEditWorkOrderModal = ({
  isOpen,
  onClose,
  workOrder,
  onWorkOrderChange,
  onUpdate
}: EditWorkOrderModalProps) => {
  if (!workOrder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Work Order"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={workOrder.title}
            onChange={(e) => onWorkOrderChange({ ...workOrder, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={workOrder.description || ''}
            onChange={(e) => onWorkOrderChange({ ...workOrder, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={workOrder.status}
              onChange={(e) => onWorkOrderChange({ ...workOrder, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="New">New</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={workOrder.priority}
              onChange={(e) => onWorkOrderChange({ ...workOrder, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={workOrder.location?.address || ''}
            onChange={(e) => onWorkOrderChange({
              ...workOrder,
              location: {
                lat: workOrder.location?.lat || 0,
                lng: workOrder.location?.lng || 0,
                address: e.target.value
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onUpdate}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Update Work Order
          </button>
        </div>
      </div>
    </Modal>
  );
};
