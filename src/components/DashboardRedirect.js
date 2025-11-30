import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useFSMStore } from '../store/useFSMStore';
const DashboardRedirect = () => {
    const { currentUser } = useFSMStore();
    if (!currentUser) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    if (currentUser.role === 'Technician') {
        return _jsx(Navigate, { to: "/dashboard/technician", replace: true });
    }
    return _jsx(Navigate, { to: "/dashboard/manager", replace: true });
};
export default DashboardRedirect;
