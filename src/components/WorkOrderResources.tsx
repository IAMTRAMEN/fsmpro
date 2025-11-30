import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Trash2, FileText, Image, Film, File, X, Search } from 'lucide-react';
import type { WorkOrderResource } from '../types/index';

interface WorkOrderResourcesProps {
  resources: WorkOrderResource[];
  onAddResource: (file: File, description?: string) => Promise<void>;
  onDeleteResource: (resourceId: string) => Promise<void>;
  canEdit: boolean;
}

const getFileIcon = (fileType?: string) => {
  if (!fileType) return <File className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
  if (fileType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
  if (fileType.startsWith('video/')) return <Film className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
  if (fileType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500 dark:text-red-400" />;
  return <File className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'Unknown';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatRelativeTime = (date: string | Date) => {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

interface OptimisticResource extends WorkOrderResource {
  optimistic?: boolean;
  progress?: number;
}

export const WorkOrderResources = ({
  resources,
  onAddResource,
  onDeleteResource,
  canEdit
}: WorkOrderResourcesProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [description, setDescription] = useState('');
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [optimisticResources, setOptimisticResources] = useState<OptimisticResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [imagePreview, setImagePreview] = useState<{ [key: string]: string }>({});
  const [refreshTime, setRefreshTime] = useState(0);

  const displayResources = [
    ...optimisticResources.filter(r => r.optimistic),
    ...resources.filter(r => !optimisticResources.some(o => o.id === r.id))
  ];

  const filteredResources = displayResources.filter(r =>
    r.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const interval = setInterval(() => setRefreshTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const simulateProgress = async () => {
    setUploadProgress(10);
    for (let i = 10; i < 90; i += Math.random() * 30) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(Math.min(i, 85));
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticResource: OptimisticResource = {
      id: optimisticId,
      workOrderId: '',
      fileName: file.name,
      fileType: file.type,
      filePath: '',
      fileSize: file.size,
      description,
      uploadedBy: 'You',
      uploadedAt: new Date().toISOString(),
      url: '',
      optimistic: true,
      progress: 0
    };

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(prev => ({ ...prev, [optimisticId]: result }));
      };
      reader.onerror = () => {
        console.warn('Failed to load image preview');
      };
      reader.readAsDataURL(file);
    }

    setOptimisticResources(prev => [...prev, optimisticResource]);
    setError(null);
    setSuccess(null);
    setIsUploading(true);
    
    try {
      simulateProgress();
      
      // Add timeout to prevent hanging requests
      const uploadPromise = onAddResource(file, description);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 30000)
      );
      
      await Promise.race([uploadPromise, timeoutPromise]);
      
      setOptimisticResources(prev => prev.filter(r => r.id !== optimisticId));
      setDescription('');
      setUploadProgress(0);
      setSuccess('Resource uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err?.message || 'Failed to upload resource. Please try again.');
      setOptimisticResources(prev => prev.filter(r => r.id !== optimisticId));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    setDeletingResourceId(resourceId);
    setError(null);
    try {
      setOptimisticResources(prev => prev.filter(r => r.id !== resourceId));
      await onDeleteResource(resourceId);
      setSuccess('Resource deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setOptimisticResources(prev => [
        ...prev,
        resources.find(r => r.id === resourceId)!
      ]);
      setError('Failed to delete resource. Please try again.');
      console.error('Delete resource error:', err);
      setDeletingResourceId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current--;
    if (dragOverRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Resources</h3>
        {displayResources.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {displayResources.length}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 animate-in">
          <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="flex-shrink-0 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2 animate-in">
          <p className="text-sm text-green-700 dark:text-green-300 flex-1">{success}</p>
          <button onClick={() => setSuccess(null)} className="flex-shrink-0 text-green-400 dark:text-green-500 hover:text-green-600 dark:hover:text-green-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      {canEdit && (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
          } ${isUploading ? 'opacity-50' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            disabled={isUploading}
            className="hidden"
          />
          <div className="text-center">
            <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Drag & drop files here or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:text-gray-400 dark:disabled:text-gray-500"
              >
                click to browse
              </button>
            </p>
            {isUploading && uploadProgress > 0 && (
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description Input */}
      {canEdit && (
        <div className="space-y-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description (optional)"
            disabled={isUploading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none text-sm"
            rows={2}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">{description.length} characters</p>
        </div>
      )}

      {/* Search */}
      {displayResources.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>
      )}

      {/* Resources List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredResources && filteredResources.length > 0 ? (
          filteredResources.map((resource, idx) => (
            <div 
              key={resource.id} 
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all animate-in ${
                (resource as OptimisticResource).optimistic 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 opacity-75' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {imagePreview[resource.id] ? (
                <div className="flex-shrink-0">
                  <img 
                    src={imagePreview[resource.id]} 
                    alt={resource.fileName}
                    className="w-12 h-12 rounded object-cover"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 mt-1">
                  {getFileIcon(resource.fileType)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{resource.fileName}</p>
                {resource.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{resource.description}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(resource.fileSize)} • {formatRelativeTime(resource.uploadedAt)} by {resource.uploadedBy}
                  {(resource as OptimisticResource).optimistic && <span className="ml-1 text-blue-600 dark:text-blue-400">• uploading</span>}
                </p>
              </div>
              <div className="flex-shrink-0 flex gap-2">
                {!(resource as OptimisticResource).optimistic && (
                  <a
                    href={resource.url}
                    download
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </a>
                )}
                {canEdit && !(resource as OptimisticResource).optimistic && (
                  <button
                    onClick={() => handleDeleteResource(resource.id)}
                    disabled={deletingResourceId === resource.id}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {displayResources.length === 0 ? 'No resources yet' : 'No matching resources'}
          </p>
        )}
      </div>
    </div>
  );
};
