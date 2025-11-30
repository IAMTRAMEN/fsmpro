import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { useRealTime } from '../hooks/useRealTime';
import { usePWA } from '../hooks/usePWA';
import { LayoutDashboard, Calendar, Users, Wrench, FileText, LogOut, Menu, X, Map, Bell, Truck, UserCircle, Receipt, Settings } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import OfflineIndicator from '../components/OfflineIndicator';
import PWAInstallButton from '../components/PWAInstallButton';
import { Avatar } from '../components/ToastNotification';
import ToastNotification from '../components/ToastNotification';
const DashboardLayout = () => {
    const { currentUser, logout, fetchUsers, fetchCustomers, fetchProviders, fetchWorkOrders, fetchInvoices, notifications, removeNotification } = useFSMStore();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // Enable real-time updates
    useRealTime();
    // PWA functionality
    const { isInstallable, isOffline, installPWA } = usePWA();
    useEffect(() => {
        if (currentUser) {
            // Only fetch users if user has appropriate role (Manager, Owner, SuperAdmin)
            if (['Manager', 'Owner', 'SuperAdmin'].includes(currentUser.role)) {
                fetchUsers();
            }
            fetchCustomers();
            fetchProviders();
            fetchWorkOrders();
            fetchInvoices();
        }
    }, [currentUser?.id]);
    useEffect(() => {
        if (!currentUser) {
            const stored = localStorage.getItem('currentUser');
            if (!stored) {
                navigate('/');
            }
        }
    }, [currentUser, navigate]);
    const handleLogout = () => {
        logout();
        navigate('/');
    };
    if (!currentUser) {
        return null;
    }
    const isTechnician = currentUser.role === 'Technician';
    const canManageProviders = ['Manager', 'Owner', 'SuperAdmin'].includes(currentUser.role);
    const isOwnerOrAdmin = ['Owner', 'SuperAdmin'].includes(currentUser.role);
    const navItems = isTechnician
        ? [
            { icon: LayoutDashboard, label: 'My Dashboard', path: '/dashboard/technician' },
            { icon: Calendar, label: 'My Schedule', path: '/dashboard/schedule' },
            { icon: FileText, label: 'My Jobs', path: '/dashboard/work-orders' },
            { icon: Receipt, label: 'My Invoices', path: '/dashboard/invoices' },
            { icon: Map, label: 'Live Map', path: '/dashboard/map' },
            { icon: UserCircle, label: 'Profile', path: '/dashboard/profile' },
        ]
        : [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/manager' },
            { icon: Calendar, label: 'Schedule', path: '/dashboard/schedule' },
            { icon: Map, label: 'Live Map', path: '/dashboard/map' },
            { icon: FileText, label: 'Work Orders', path: '/dashboard/work-orders' },
            { icon: Receipt, label: 'Invoices', path: '/dashboard/invoices' },
            { icon: Users, label: 'Staff', path: '/dashboard/staff' },
            { icon: Users, label: 'Customers', path: '/dashboard/customers' },
            ...(canManageProviders ? [{ icon: Truck, label: 'Providers', path: '/dashboard/providers' }] : []),
            ...(isOwnerOrAdmin ? [{ icon: Settings, label: 'Invoice Settings', path: '/dashboard/invoice-settings' }] : []),
            { icon: UserCircle, label: 'Profile', path: '/dashboard/profile' },
        ];
    return (_jsxs("div", { className: "h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden transition-colors", children: [_jsxs("aside", { className: "hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto", children: [_jsx("div", { className: "p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10", children: _jsxs("h3", { className: "text-2xl font-bold text-blue-600 flex items-center gap-2", children: [_jsx(Wrench, { className: "w-6 h-6 mt-1" }), " Quality First"] }) }), _jsx("nav", { className: "flex-1 p-4 space-y-1", children: navItems.map((item) => (_jsxs(NavLink, { to: item.path, className: ({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'}`, children: [_jsx(item.icon, { className: "w-5 h-5" }), item.label] }, item.path))) }), _jsx("div", { className: "p-4 border-t border-gray-100 dark:border-gray-700", children: _jsx("div", { className: "mb-4", children: _jsx(ThemeToggle, {}) }) }), _jsxs("div", { className: "p-4 border-t border-gray-100 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800", children: [_jsxs(NavLink, { to: "/dashboard/profile", className: "flex items-center gap-3 px-4 py-3 mb-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors", children: [_jsx(Avatar, { src: currentUser.avatar, name: currentUser.name, size: 32 }), _jsxs("div", { className: "overflow-hidden", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-gray-100 truncate", children: currentUser.name }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: currentUser.role })] })] }), _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors", children: [_jsx(LogOut, { className: "w-4 h-4" }), " Logout"] })] })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0 h-full overflow-hidden", children: [_jsxs("header", { className: "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 md:hidden flex items-center justify-between p-4 sticky top-0 z-20 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen), className: "p-2 -ml-2", children: isMobileMenuOpen ? _jsx(X, { className: "w-6 h-6" }) : _jsx(Menu, { className: "w-6 h-6" }) }), _jsx("span", { className: "font-bold text-lg text-blue-600", children: "Quality First" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ThemeToggle, {}), _jsx(Bell, { className: "w-5 h-5 text-gray-500 dark:text-gray-400" }), _jsx(Avatar, { src: currentUser.avatar, name: currentUser.name, size: 32 })] })] }), isMobileMenuOpen && (_jsx("div", { className: "fixed inset-0 z-30 bg-gray-800 bg-opacity-50 md:hidden dark:bg-opacity-70", onClick: () => setIsMobileMenuOpen(false), children: _jsxs("div", { className: "absolute inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-xl flex flex-col", onClick: e => e.stopPropagation(), children: [_jsx("div", { className: "p-6 border-b border-gray-100 dark:border-gray-700", children: _jsx("h2", { className: "text-xl font-bold text-blue-600 dark:text-blue-400", children: "Menu" }) }), _jsx("nav", { className: "flex-1 p-4 space-y-1 overflow-y-auto", children: navItems.map((item) => (_jsxs(NavLink, { to: item.path, onClick: () => setIsMobileMenuOpen(false), className: ({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'}`, children: [_jsx(item.icon, { className: "w-5 h-5" }), item.label] }, item.path))) }), _jsx("div", { className: "p-4 border-t border-gray-100 dark:border-gray-700", children: _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors", children: [_jsx(LogOut, { className: "w-4 h-4" }), " Logout"] }) })] }) })), _jsx("main", { className: "flex-1 overflow-y-auto p-4 md:p-8", children: _jsx(Outlet, {}) })] }), _jsx(OfflineIndicator, { isOffline: isOffline }), isInstallable && (_jsx("div", { className: "fixed bottom-4 right-4 z-50", children: _jsx(PWAInstallButton, { isInstallable: isInstallable, onInstall: installPWA }) })), notifications.map((notification) => (_jsx(ToastNotification, { message: notification.message, type: notification.type, onClose: () => removeNotification(notification.id) }, notification.id)))] }));
};
export default DashboardLayout;
