import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Download, Smartphone } from 'lucide-react';
const PWAInstallButton = ({ isInstallable, onInstall }) => {
    if (!isInstallable)
        return null;
    return (_jsxs("button", { onClick: onInstall, className: "flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg", title: "Install Quality First as an app", children: [_jsx(Smartphone, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Install App" }), _jsx(Download, { className: "w-4 h-4" })] }));
};
export default PWAInstallButton;
