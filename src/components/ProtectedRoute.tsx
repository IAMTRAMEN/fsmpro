import { Navigate } from 'react-router-dom';
import { useFSMStore } from '../store/useFSMStore';

interface ProtectedRouteProps {
  element: React.ReactElement;
  allowedRoles: string[];
}

const ProtectedRoute = ({ element, allowedRoles }: ProtectedRouteProps) => {
  const { currentUser } = useFSMStore();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard/access-denied" replace />;
  }

  return element;
};

export default ProtectedRoute;
