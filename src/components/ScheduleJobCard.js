import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
const getPriorityColor = (priority, status) => {
    if (priority === 'Critical')
        return 'bg-red-100 border-red-200 text-red-800';
    if (priority === 'High')
        return 'bg-orange-100 border-orange-200 text-orange-800';
    if (status === 'Completed')
        return 'bg-green-100 border-green-200 text-green-800';
    if (status === 'In Progress')
        return 'bg-blue-500 border-blue-600 text-white';
    return 'bg-gray-100 border-gray-200 text-gray-800';
};
export const ScheduleJobCard = ({ job, isSelected, isDragging, height, variant = 'compact', onDragStart, onDragEnd, onClick, onContextMenu }) => {
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
    return (_jsxs("div", { draggable: true, onDragStart: () => onDragStart(job), onDragEnd: onDragEnd, onClick: (e) => onClick(job, e), onContextMenu: (e) => onContextMenu(job, e), className: `relative w-full h-full rounded p-2 text-xs overflow-hidden shadow-sm border cursor-move hover:shadow-lg transition-shadow flex flex-col ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''} ${colorClass} ${isDragging ? 'opacity-50' : ''}`, title: `${job.title}\n${startTime} - ${endTime} (${durationStr})\n${job.location?.address || 'Unknown Location'}\nClick to edit, Right-click for menu, Drag to reschedule`, children: [_jsx("p", { className: "font-bold truncate text-xs leading-tight", children: job.title }), _jsxs("p", { className: "text-xs opacity-90 font-semibold leading-tight", children: [startTime, " - ", endTime] }), height !== '100%' && (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-xs opacity-75 truncate leading-tight", children: durationStr }), _jsx("p", { className: "text-xs opacity-75 truncate text-ellipsis", children: job.location?.address || 'Unknown' })] }))] }));
};
export const ScheduleJobCardCompact = ({ job, isSelected, onDragStart, onDragEnd, onClick, onContextMenu }) => {
    const colorClass = getPriorityColor(job.priority, job.status);
    return (_jsxs("div", { draggable: true, onDragStart: () => onDragStart(job), onDragEnd: onDragEnd, onClick: (e) => onClick(job, e), onContextMenu: (e) => onContextMenu(job, e), className: `p-2 rounded text-xs border cursor-pointer hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''} ${colorClass}`, title: `${job.title} - ${job.location?.address || 'Unknown Location'}`, children: [_jsx("p", { className: "font-bold truncate", children: job.title }), _jsx("p", { className: "truncate opacity-80", children: new Date(job.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }));
};
