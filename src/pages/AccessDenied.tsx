import { useNavigate } from 'react-router-dom';
import { useFSMStore } from '../store/useFSMStore';

const AccessDenied = () => {
  const navigate = useNavigate();
  const { currentUser } = useFSMStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <div className="text-center">
        <div className="mb-6">
          <svg className="w-24 h-24 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0H9m3 0h3" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
        
        <div className="bg-white p-4 rounded-lg shadow mb-8 max-w-md mx-auto">
          <p className="text-sm text-gray-700">
            <strong>Your Role:</strong> {currentUser?.role}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Go Back
          </button>
          <button
            onClick={() => currentUser?.role === 'Technician' ? navigate('/dashboard/technician') : navigate('/dashboard/manager')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Your Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
