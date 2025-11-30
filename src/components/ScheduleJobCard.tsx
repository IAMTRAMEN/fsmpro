import { Copy, Edit, Trash2 } from 'lucide-react';
import type { WorkOrder } from '../types/index';

interface ScheduleJobCardProps {
  job: WorkOrder;
  isSelected: boolean;
  isDragging: boolean;
  height?: string;
  variant?: 'compact' | 'full';
  onDragStart: (job: WorkOrder) => void;
  onDragEnd: () => void;
  onClick: (job: WorkOrder, event: React.MouseEvent) => void;
  onContextMenu: (job: WorkOrder, event: React.MouseEvent) => void;
}

const getPriorityColor = (priority: string, status: string): string => {
  if (priority === 'Critical') return 'bg-red-100 border-red-200 text-red-800';
  if (priority === 'High') return 'bg-orange-100 border-orange-200 text-orange-800';
  if (status === 'Completed') return 'bg-green-100 border-green-200 text-green-800';
  if (status === 'In Progress') return 'bg-blue-500 border-blue-600 text-white';
  return 'bg-gray-100 border-gray-200 text-gray-800';
};

export const ScheduleJobCard = ({
  job,
  isSelected,
  isDragging,
  height,
  variant = 'compact',
  onDragStart,
  onDragEnd,
  onClick,
  onContextMenu
}: ScheduleJobCardProps) => {
  const colorClass = getPriorityColor(job.priority, job.status);
  const jobStart = new Date(job.scheduledStart);
  const jobEnd = new Date(job.scheduledEnd);
  const startTime = jobStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = jobEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const durationMinutes = Math.round((jobEnd.getTime() - jobStart.getTime()) / (1000 * 60));
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;
  const durationStr = durationHours > 0 
    ? `${durationHours}h${durationMins > 0 ? durationMins + 'm' : ''}` 
    : `${durationMins}m`;
  
  return (
    <div
      draggable
      onDragStart={() => onDragStart(job)}
      onDragEnd={onDragEnd}
      onClick={(e) => onClick(job, e)}
      onContextMenu={(e) => onContextMenu(job, e)}
      className={`relative w-full h-full rounded p-2 text-xs overflow-hidden shadow-sm border cursor-move hover:shadow-lg transition-shadow flex flex-col ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
      } ${colorClass} ${isDragging ? 'opacity-50' : ''}`}
      title={`${job.title}\n${startTime} - ${endTime} (${durationStr})\n${job.location?.address || 'Unknown Location'}\nClick to edit, Right-click for menu, Drag to reschedule`}
    >
      <p className="font-bold truncate text-xs leading-tight">{job.title}</p>
      <p className="text-xs opacity-90 font-semibold leading-tight">{startTime} - {endTime}</p>
      {height !== '100%' && (
        <>
          <p className="text-xs opacity-75 truncate leading-tight">{durationStr}</p>
          <p className="text-xs opacity-75 truncate text-ellipsis">{job.location?.address || 'Unknown'}</p>
        </>
      )}
    </div>
  );
};

interface ScheduleJobCardCompactProps {
  job: WorkOrder;
  isSelected: boolean;
  onDragStart: (job: WorkOrder) => void;
  onDragEnd: () => void;
  onClick: (job: WorkOrder, event: React.MouseEvent) => void;
  onContextMenu: (job: WorkOrder, event: React.MouseEvent) => void;
}

export const ScheduleJobCardCompact = ({
  job,
  isSelected,
  onDragStart,
  onDragEnd,
  onClick,
  onContextMenu
}: ScheduleJobCardCompactProps) => {
  const colorClass = getPriorityColor(job.priority, job.status);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(job)}
      onDragEnd={onDragEnd}
      onClick={(e) => onClick(job, e)}
      onContextMenu={(e) => onContextMenu(job, e)}
      className={`p-2 rounded text-xs border cursor-pointer hover:shadow-md transition-shadow ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${colorClass}`}
      title={`${job.title} - ${job.location?.address || 'Unknown Location'}`}
    >
      <p className="font-bold truncate">{job.title}</p>
      <p className="truncate opacity-80">
        {new Date(job.scheduledStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </p>
    </div>
  );
};
