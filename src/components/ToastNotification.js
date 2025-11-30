import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
const ToastNotification = ({ message, type, onClose, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);
    let bgColor = 'bg-blue-500';
    if (type === 'error')
        bgColor = 'bg-red-600';
    else if (type === 'success')
        bgColor = 'bg-green-600';
    return (_jsx("div", { className: `fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-xl text-white ${bgColor} z-50 max-w-sm font-medium text-sm border-l-4 ${type === 'error' ? 'border-red-300' : type === 'success' ? 'border-green-300' : 'border-blue-300'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: message }), _jsx("button", { onClick: onClose, className: "ml-4 text-white hover:text-gray-200 focus:outline-none", children: "\u00D7" })] }) }));
};
// Utility function for consistent avatar handling across the app
export const getAvatarUrl = (avatar, name, size = 96) => {
    // Return uploaded avatar if it exists and is not base64 or UI avatar
    if (avatar && !avatar.startsWith('data:') && !avatar.includes('ui-avatars.com')) {
        return avatar;
    }
    // Fallback to UI avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&color=fff&size=${size}`;
};
export const Avatar = ({ src, name, size = 32, className = '', showStatus = false, status }) => {
    const avatarUrl = getAvatarUrl(src, name, size);
    return (_jsxs("div", { className: "relative", children: [_jsx("img", { src: avatarUrl, alt: name, className: `rounded-full bg-gray-200 dark:bg-gray-600 object-cover ${className}`, style: { width: size, height: size }, onError: (e) => {
                    const img = e.target;
                    // Prevent infinite fallback loop
                    if (!img.src.includes('ui-avatars.com')) {
                        img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&color=fff&size=${size}`;
                    }
                } }), showStatus && status && (_jsx("span", { className: `absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${status === 'Available' ? 'bg-green-500' :
                    status === 'Busy' ? 'bg-red-500' :
                        'bg-gray-400'}` }))] }));
};
export default ToastNotification;
