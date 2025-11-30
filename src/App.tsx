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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardRedirect />} />
          <Route path="manager" element={<ProtectedRoute element={<ManagerDashboard />} allowedRoles={['Manager', 'Owner', 'SuperAdmin']} />} />
          <Route path="technician" element={<ProtectedRoute element={<TechnicianDashboard />} allowedRoles={['Technician', 'SuperAdmin']} />} />
          <Route path="schedule" element={<ProtectedRoute element={<Schedule />} allowedRoles={['Manager', 'Owner', 'SuperAdmin', 'Technician']} />} />
          <Route path="work-orders" element={<ProtectedRoute element={<WorkOrders />} allowedRoles={['Manager', 'Owner', 'SuperAdmin', 'Technician']} />} />
          <Route path="customers" element={<ProtectedRoute element={<Customers />} allowedRoles={['Manager', 'Owner', 'SuperAdmin']} />} />
          <Route path="staff" element={<ProtectedRoute element={<Staff />} allowedRoles={['Manager', 'Owner', 'SuperAdmin']} />} />
          <Route path="technicians" element={<Navigate to="/dashboard/staff" replace />} />
          <Route path="providers" element={<ProtectedRoute element={<Providers />} allowedRoles={['Manager', 'Owner', 'SuperAdmin']} />} />
          <Route path="map" element={<ProtectedRoute element={<MapView />} allowedRoles={['Manager', 'Owner', 'SuperAdmin', 'Technician']} />} />
          <Route path="invoices" element={<ProtectedRoute element={<Invoices />} allowedRoles={['Manager', 'Owner', 'SuperAdmin', 'Technician']} />} />
          <Route path="invoice-settings" element={<ProtectedRoute element={<InvoiceSettings />} allowedRoles={['Owner', 'SuperAdmin']} />} />
          <Route path="profile" element={<Profile />} />
          <Route path="access-denied" element={<AccessDenied />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
