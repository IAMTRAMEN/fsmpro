import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useFSMStore } from '../store/useFSMStore';
const AccessDenied = () => {
    const navigate = useNavigate();
    const { currentUser } = useFSMStore();
    return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-100", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mb-6", children: _jsx("svg", { className: "w-24 h-24 mx-auto text-red-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4v2m0 0H9m3 0h3" }) }) }), _jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Access Denied" }), _jsx("p", { className: "text-gray-600 mb-8", children: "You don't have permission to access this page." }), _jsx("div", { className: "bg-white p-4 rounded-lg shadow mb-8 max-w-md mx-auto", children: _jsxs("p", { className: "text-sm text-gray-700", children: [_jsx("strong", { children: "Your Role:" }), " ", currentUser?.role] }) }), _jsxs("div", { className: "flex gap-4 justify-center", children: [_jsx("button", { onClick: () => navigate(-1), className: "px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition", children: "Go Back" }), _jsx("button", { onClick: () => currentUser?.role === 'Technician' ? navigate('/dashboard/technician') : navigate('/dashboard/manager'), className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition", children: "Go to Your Dashboard" })] })] }) }));
};
export default AccessDenied;
