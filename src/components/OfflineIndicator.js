import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { WifiOff } from 'lucide-react';
const OfflineIndicator = ({ isOffline }) => {
    if (!isOffline)
        return null;
    return (_jsxs("div", { className: "fixed bottom-4 left-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse", children: [_jsx(WifiOff, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm font-medium", children: "You're offline" })] }));
};
export default OfflineIndicator;
