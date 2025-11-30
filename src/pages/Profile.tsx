import React, { useState, useEffect } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { User } from '../types';
import { Save, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

// Helper function for auth headers (similar to store)
const API_URL = 'http://127.0.0.1:5000/api';

const Profile = () => {
  const { currentUser, updateUser, loading } = useFSMStore();
  const [formData, setFormData] = useState<Partial<User & { oldPassword?: string, newPassword?: string, address?: any }>>({
    name: '',
    email: '',
    avatar: '',
    address: { lat: 0, lng: 0, address: '' },
  });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      // Filter out old base64 avatars and use proper avatar URLs
      const avatar = currentUser.avatar && !currentUser.avatar.startsWith('data:') && !currentUser.avatar.includes('ui-avatars') ? currentUser.avatar : '';
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        avatar: avatar,
        address: (currentUser as any)?.address || { lat: 0, lng: 0, address: '' },
      }));
    }
  }, [currentUser?.avatar, currentUser?.name, currentUser?.email, currentUser?.address]);

  const getUIAvatarUrl = () => {
    const name = formData.name || currentUser?.name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&color=fff&size=96`;
  };

  const getDisplayImage = () => {
    if (formData.avatar && formData.avatar.trim() !== '') return formData.avatar;
    return getUIAvatarUrl();
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: 'error', text: 'Image must be smaller than 5MB' });
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);

      const storedUser = localStorage.getItem('currentUser');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (user?.token) {
        fd.append('token', user.token);
      }

      const response = await fetch(`${API_URL}/upload/avatar`, {
        method: 'POST',
        body: fd
      });

      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Upload error response:', errorData);
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Upload response data:', data);
      
      if (data.url) {
        // Update local form data
        setFormData(prev => ({ ...prev, avatar: data.url }));

        // Immediately update the global user state with the new avatar
        // This makes the avatar visible immediately without requiring a save
        try {
          await updateUser(currentUser!.id, { avatar: data.url });
        } catch (updateError) {
          // If updating global state fails, that's ok - the avatar is still in formData
          console.warn('Failed to update global user state:', updateError);
        }

        setMessage({ type: 'success', text: 'Avatar uploaded successfully' });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to upload avatar. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files?.[0]) {
      handleFileSelect(e.currentTarget.files[0]);
    }
    e.currentTarget.value = '';
  };

  const removeAvatar = async () => {
    if (!currentUser) return;

    try {
      const updateData = {
        name: currentUser.name || formData.name,
        email: currentUser.email || formData.email,
        avatar: '',
        address: (currentUser as any)?.address || formData.address
      };

      await updateUser(currentUser.id, updateData);
      setFormData(prev => ({ ...prev, avatar: '' }));
      setMessage({ type: 'success', text: 'Avatar removed successfully' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Failed to remove avatar' });
    }
  };

  const hasCustomAvatar = () => {
    return formData.avatar && formData.avatar.trim() !== '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentUser) return;

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar || currentUser?.avatar || '',
        address: formData.address
      };

      if (newPassword) {
        if (!oldPassword) {
            setMessage({ type: 'error', text: 'Old password is required to set a new password' });
            return;
        }
        updateData.oldPassword = oldPassword;
        updateData.newPassword = newPassword;
      }

      await updateUser(currentUser.id, updateData);
      
      setFormData(prev => ({
        ...prev,
        avatar: updateData.avatar
      }));
      
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setOldPassword('');
      setNewPassword('');
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Failed to update profile' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">My Profile</h1>
      
      {message && (
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
                <img
                  src={getDisplayImage()}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover bg-gray-200 dark:bg-gray-600"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    // Prevent infinite fallback loop
                    if (!img.src.includes('ui-avatars.com')) {
                      img.src = getUIAvatarUrl();
                    }
                  }}
                />
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <LoadingSpinner size="sm" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Upload Avatar
                            </>
                        )}
                    </button>
                    {hasCustomAvatar() && (
                        <button
                            type="button"
                            onClick={removeAvatar}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                            Remove
                        </button>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG, WebP (Max 5MB)</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input
                type="text"
                value={(formData.address as any)?.address || ''}
                onChange={e => setFormData({...formData, address: { ...(formData.address as any), address: e.target.value }})}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                placeholder="Street Address"
            />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Old Password</label>
                    <input
                        type="password"
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>

        <div className="flex justify-end">
            <button
                type="submit"
                disabled={loading.userUpdate}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
                {loading.userUpdate ? (
                    <>
                        <LoadingSpinner size="sm" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        Save Changes
                    </>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
