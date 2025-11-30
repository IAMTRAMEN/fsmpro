import { useNavigate } from 'react-router-dom';
import { useFSMStore } from '../store/useFSMStore';

const NotFound = () => {
  const navigate = useNavigate();
  const { currentUser } = useFSMStore();

  const handleGoToDashboard = () => {
    if (currentUser?.role === 'Technician') {
      navigate('/dashboard/technician');
    } else {
      navigate('/dashboard/manager');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</p>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or you don't have access to it.</p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Go Back
          </button>
          <button
            onClick={handleGoToDashboard}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
