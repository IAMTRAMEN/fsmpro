import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import ManagerDashboard from './pages/ManagerDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import Schedule from './pages/Schedule';
import WorkOrders from './pages/WorkOrders';
import Customers from './pages/Customers';
import Staff from './pages/Staff';
import Providers from './pages/Providers';
import MapView from './pages/Map';
import Profile from './pages/Profile';
import Invoices from './pages/Invoices';
import InvoiceSettings from './pages/InvoiceSettings';
import AccessDenied from './pages/AccessDenied';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardRedirect from './components/DashboardRedirect';
function App() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Login, {}) }), _jsxs(Route, { path: "/dashboard", element: _jsx(DashboardLayout, {}), children: [_jsx(Route, { index: true, element: _jsx(DashboardRedirect, {}) }), _jsx(Route, { path: "manager", element: _jsx(ProtectedRoute, { element: _jsx(ManagerDashboard, {}), allowedRoles: ['Manager', 'Owner', 'SuperAdmin'] }) }), _jsx(Route, { path: "technician", element: _jsx(ProtectedRoute, { element: _jsx(TechnicianDashboard, {}), allowedRoles: ['Technician', 'SuperAdmin'] }) }), _jsx(Route, { path: "schedule", element: _jsx(ProtectedRoute, { element: _jsx(Schedule, {}), allowedRoles: ['Manager', 'Owner', 'SuperAdmin', 'Technician'] }) }), _jsx(Route, { path: "work-orders", element: _jsx(ProtectedRoute, { element: _jsx(WorkOrders, {}), allowedRoles: ['Manager', 'Owner', 'SuperAdmin', 'Technician'] }) }), _jsx(Route, { path: "customers", element: _jsx(ProtectedRoute, { element: _jsx(Customers, {}), allowedRoles: ['Manager', 'Owner', 'SuperAdmin'] }) }), _jsx(Route, { path: "staff", element: _jsx(ProtectedRoute, { element: _jsx(Staff, {}), allowedRoles: ['Manager', 'Owner', 'SuperAdmin'] }) }), _jsx(Route, { path: "technicians", element: _jsx(Navigate, { to: "/dashboard/staff", replace: true }) }), _jsx(Route, { path: "providers", element: _jsx(ProtectedRoute, { element: _jsx(Providers, {}), allowedRoles: ['Manager', 'Owner', 'SuperAdmin'] }) }), _jsx(Route, { path: "map", element: _jsx(ProtectedRoute, { element: _jsx(MapView, {}), allowedRoles: ['Manager', 'Owner', 'SuperAdmin', 'Technician'] }) }), _jsx(Route, { path: "invoices", element: _jsx(ProtectedRoute, { element: _jsx(Invoices, {}), allowedRoles: ['Manager', 'Owner', 'SuperAdmin', 'Technician'] }) }), _jsx(Route, { path: "invoice-settings", element: _jsx(ProtectedRoute, { element: _jsx(InvoiceSettings, {}), allowedRoles: ['Owner', 'SuperAdmin'] }) }), _jsx(Route, { path: "profile", element: _jsx(Profile, {}) }), _jsx(Route, { path: "access-denied", element: _jsx(AccessDenied, {}) })] }), _jsx(Route, { path: "*", element: _jsx(NotFound, {}) })] }) }));
}
export default App;
