import { useState, useEffect } from 'react';
import { Search, Filter, X, Users, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';
import type { Technician } from '../types/index';

interface ScheduleFilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedTechnicians: string[];
  onTechniciansChange: (techs: string[]) => void;
  selectedPriorities: string[];
  onPrioritiesChange: (priorities: string[]) => void;
  selectedStatuses: string[];
  onStatusesChange: (statuses: string[]) => void;
  technicians: Technician[];
  showTechnicianDropdown: boolean;
  onTechnicianDropdownToggle: (show: boolean) => void;
  showPriorityDropdown: boolean;
  onPriorityDropdownToggle: (show: boolean) => void;
  showStatusDropdown: boolean;
  onStatusDropdownToggle: (show: boolean) => void;
  onClearFilters: () => void;
  currentUserRole?: string;
}

export const ScheduleFilterBar = ({
  searchTerm,
  onSearchChange,
  selectedTechnicians,
  onTechniciansChange,
  selectedPriorities,
  onPrioritiesChange,
  selectedStatuses,
  onStatusesChange,
  technicians,
  showTechnicianDropdown,
  onTechnicianDropdownToggle,
  showPriorityDropdown,
  onPriorityDropdownToggle,
  showStatusDropdown,
  onStatusDropdownToggle,
  onClearFilters,
  currentUserRole = 'Manager'
}: ScheduleFilterBarProps) => {
  const hasActiveFilters = searchTerm || selectedTechnicians.length > 0 || selectedPriorities.length > 0 || selectedStatuses.length > 0;

  return (
    <div className="px-4 pb-4 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs or locations..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[250px] bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {/* Technician Filter */}
          {currentUserRole !== 'Technician' && (
            <div className="relative dropdown-container">
              <button
                onClick={() => onTechnicianDropdownToggle(!showTechnicianDropdown)}
                className="flex items-center gap-2 pl-10 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[160px] hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 " />
                <span className="text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                  {selectedTechnicians.length > 0
                    ? `${selectedTechnicians.length} selected`
                    : 'Select technicians...'}
                </span>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </button>

              {showTechnicianDropdown && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                  {technicians.map(tech => (
                    <label key={tech.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedTechnicians.includes(tech.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onTechniciansChange([...selectedTechnicians, tech.id]);
                          } else {
                            onTechniciansChange(selectedTechnicians.filter(t => t !== tech.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-100">{tech.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Priority Filter */}
          <div className="relative dropdown-container">
            <button
              onClick={() => onPriorityDropdownToggle(!showPriorityDropdown)}
              className="flex items-center gap-2 pl-10 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px] hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
              <span className="text-gray-700 dark:text-gray-100">
                {selectedPriorities.length > 0
                  ? `${selectedPriorities.length} selected`
                  : 'Select priorities...'}
              </span>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </button>

            {showPriorityDropdown && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto dark:text-gray-100">
                {[
                  { value: 'Critical', label: 'Critical', color: 'text-red-600' },
                  { value: 'High', label: 'High', color: 'text-orange-600' },
                  { value: 'Medium', label: 'Medium', color: 'text-yellow-600' },
                  { value: 'Low', label: 'Low', color: 'text-green-600' }
                ].map(priority => (
                  <label key={priority.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-700 dark:bg-gray-800 dark:text-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedPriorities.includes(priority.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onPrioritiesChange([...selectedPriorities, priority.value]);
                        } else {
                          onPrioritiesChange(selectedPriorities.filter(p => p !== priority.value));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 "
                    />
                    <span className={`text-sm ${priority.color}`}>{priority.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative dropdown-container">
            <button
              onClick={() => onStatusDropdownToggle(!showStatusDropdown)}
              className="flex items-center gap-2 pl-10 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[150px] hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-100">
                {selectedStatuses.length > 0
                  ? `${selectedStatuses.length} selected`
                  : 'Select status...'}
              </span>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </button>

            {showStatusDropdown && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto dark:hover:bg-gray-700 dark:bg-gray-800 dark:text-gray-100">
                {[
                  { value: 'New', label: '⏳ New', color: 'text-gray-600 dark:text-gray-100' },
                  { value: 'Assigned', label: '📋 Assigned', color: 'text-blue-600' },
                  { value: 'In Progress', label: '🔄 In Progress', color: 'text-purple-600' },
                  { value: 'Completed', label: '✅ Completed', color: 'text-green-600' }
                ].map(status => (
                  <label key={status.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-700 dark:bg-gray-800 dark:text-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onStatusesChange([...selectedStatuses, status.value]);
                        } else {
                          onStatusesChange(selectedStatuses.filter(s => s !== status.value));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className={`text-sm ${status.color}`}>{status.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200 bg-red-25"
          >
            <X className="w-4 h-4" />
            Clear All Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Filters:</span>
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Search: "{searchTerm}"
              <button onClick={() => onSearchChange('')} className="hover:bg-blue-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedTechnicians.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
              {selectedTechnicians.length} technician{selectedTechnicians.length > 1 ? 's' : ''}
              <button onClick={() => onTechniciansChange([])} className="hover:bg-purple-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedPriorities.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
              {selectedPriorities.length} priorit{selectedPriorities.length > 1 ? 'ies' : 'y'}
              <button onClick={() => onPrioritiesChange([])} className="hover:bg-orange-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedStatuses.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              {selectedStatuses.length} status{selectedStatuses.length > 1 ? 'es' : ''}
              <button onClick={() => onStatusesChange([])} className="hover:bg-green-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
