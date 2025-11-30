import { Navigate } from 'react-router-dom';
import { useFSMStore } from '../store/useFSMStore';

const DashboardRedirect = () => {
  const { currentUser } = useFSMStore();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (currentUser.role === 'Technician') {
    return <Navigate to="/dashboard/technician" replace />;
  }

  return <Navigate to="/dashboard/manager" replace />;
};

export default DashboardRedirect;
