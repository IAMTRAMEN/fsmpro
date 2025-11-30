import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { Save, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
// Helper function for auth headers (similar to store)
const API_URL = 'http://127.0.0.1:5000/api';
const Profile = () => {
    const { currentUser, updateUser, loading } = useFSMStore();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        avatar: '',
        address: { lat: 0, lng: 0, address: '' },
    });
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef(null);
    useEffect(() => {
        if (currentUser) {
            // Filter out old base64 avatars and use proper avatar URLs
            const avatar = currentUser.avatar && !currentUser.avatar.startsWith('data:') && !currentUser.avatar.includes('ui-avatars') ? currentUser.avatar : '';
            setFormData(prev => ({
                ...prev,
                name: currentUser.name || '',
                email: currentUser.email || '',
                avatar: avatar,
                address: currentUser?.address || { lat: 0, lng: 0, address: '' },
            }));
        }
    }, [currentUser?.avatar, currentUser?.name, currentUser?.email, currentUser?.address]);
    const getUIAvatarUrl = () => {
        const name = formData.name || currentUser?.name || 'User';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&color=fff&size=96`;
    };
    const getDisplayImage = () => {
        if (formData.avatar && formData.avatar.trim() !== '')
            return formData.avatar;
        return getUIAvatarUrl();
    };
    const handleFileSelect = async (file) => {
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
                    await updateUser(currentUser.id, { avatar: data.url });
                }
                catch (updateError) {
                    // If updating global state fails, that's ok - the avatar is still in formData
                    console.warn('Failed to update global user state:', updateError);
                }
                setMessage({ type: 'success', text: 'Avatar uploaded successfully' });
            }
            else {
                throw new Error('Invalid response from server');
            }
        }
        catch (error) {
            console.error('Avatar upload error:', error);
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to upload avatar. Please try again.' });
        }
        finally {
            setIsUploading(false);
        }
    };
    const handleFileInputChange = (e) => {
        if (e.currentTarget.files?.[0]) {
            handleFileSelect(e.currentTarget.files[0]);
        }
        e.currentTarget.value = '';
    };
    const removeAvatar = async () => {
        if (!currentUser)
            return;
        try {
            const updateData = {
                name: currentUser.name || formData.name,
                email: currentUser.email || formData.email,
                avatar: '',
                address: currentUser?.address || formData.address
            };
            await updateUser(currentUser.id, updateData);
            setFormData(prev => ({ ...prev, avatar: '' }));
            setMessage({ type: 'success', text: 'Avatar removed successfully' });
        }
        catch (e) {
            setMessage({ type: 'error', text: e?.message || 'Failed to remove avatar' });
        }
    };
    const hasCustomAvatar = () => {
        return formData.avatar && formData.avatar.trim() !== '';
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        if (!currentUser)
            return;
        try {
            const updateData = {
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
        }
        catch (e) {
            setMessage({ type: 'error', text: e?.message || 'Failed to update profile' });
        }
    };
    return (_jsxs("div", { className: "max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6", children: "My Profile" }), message && (_jsxs("div", { className: `p-4 rounded-lg mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`, children: [message.type === 'success' ? _jsx(CheckCircle, { className: "w-5 h-5" }) : _jsx(AlertCircle, { className: "w-5 h-5" }), message.text] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("img", { src: getDisplayImage(), alt: "Avatar", className: "w-24 h-24 rounded-full object-cover bg-gray-200 dark:bg-gray-600", onError: (e) => {
                                        const img = e.target;
                                        // Prevent infinite fallback loop
                                        if (!img.src.includes('ui-avatars.com')) {
                                            img.src = getUIAvatarUrl();
                                        }
                                    } }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), disabled: isUploading, className: "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2", children: isUploading ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { size: "sm" }), "Uploading..."] })) : (_jsxs(_Fragment, { children: [_jsx(Upload, { className: "w-4 h-4" }), "Upload Avatar"] })) }), hasCustomAvatar() && (_jsx("button", { type: "button", onClick: removeAvatar, className: "px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors", children: "Remove" }))] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleFileInputChange, className: "hidden" }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "JPG, PNG, WebP (Max 5MB)" })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Full Name" }), _jsx("input", { type: "text", required: true, value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }), className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Email" }), _jsx("input", { type: "email", required: true, value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }), className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Address" }), _jsx("input", { type: "text", value: formData.address?.address || '', onChange: e => setFormData({ ...formData, address: { ...formData.address, address: e.target.value } }), className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500", placeholder: "Street Address" })] }), _jsxs("div", { className: "border-t border-gray-100 dark:border-gray-700 pt-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-gray-100 mb-4", children: "Change Password" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Old Password" }), _jsx("input", { type: "password", value: oldPassword, onChange: e => setOldPassword(e.target.value), className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "New Password" }), _jsx("input", { type: "password", value: newPassword, onChange: e => setNewPassword(e.target.value), className: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" })] })] })] }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "submit", disabled: loading.userUpdate, className: "bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2", children: loading.userUpdate ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { size: "sm" }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4" }), "Save Changes"] })) }) })] })] }));
};
export default Profile;
