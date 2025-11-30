import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useFSMStore } from '../store/useFSMStore';
const ProtectedRoute = ({ element, allowedRoles }) => {
    const { currentUser } = useFSMStore();
    if (!currentUser) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    if (!allowedRoles.includes(currentUser.role)) {
        return _jsx(Navigate, { to: "/dashboard/access-denied", replace: true });
    }
    return element;
};
export default ProtectedRoute;
