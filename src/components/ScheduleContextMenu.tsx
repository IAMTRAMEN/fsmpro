import { Copy, Edit, Trash2 } from 'lucide-react';
import type { WorkOrder } from '../types/index';

interface ScheduleContextMenuProps {
  x: number;
  y: number;
  workOrder: WorkOrder;
  onEdit: (workOrder: WorkOrder) => void;
  onDuplicate?: (workOrder: WorkOrder) => void;
  onDelete?: (workOrderId: string) => void;
}

export const ScheduleContextMenu = ({
  x,
  y,
  workOrder,
  onEdit,
  onDuplicate,
  onDelete
}: ScheduleContextMenuProps) => {
  return (
    <div
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-1 context-menu"
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => onEdit(workOrder)}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <Edit className="w-4 h-4" />
        Edit
      </button>
      {onDuplicate && (
        <>
          <button
            onClick={() => onDuplicate(workOrder)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <hr className="my-1" />
        </>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(workOrder.id)}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      )}
    </div>
  );
};
