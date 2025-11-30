import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFSMStore } from '../store/useFSMStore';
import { Wrench, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('sarah@fsm.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useFSMStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        const user = useFSMStore.getState().currentUser;
        if (user?.role === 'Technician') {
          navigate('/dashboard/technician');
        } else {
          navigate('/dashboard/manager');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-8">
            
            <h1 className="text-2xl font-bold text-blue-600">Quality First</h1>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Login</h2>
          <p className="text-gray-600 text-center mb-6">Enter your credentials to continue</p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">Demo: sarah@fsm.com</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Demo: password</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-xs text-gray-600">
              <p><strong>Manager:</strong> sarah@fsm.com / password</p>
              <p><strong>Owner:</strong> mike@fsm.com / password</p>
              <p><strong>Admin:</strong> admin@fsm.com / password</p>
              <p><strong>Technician:</strong> john@fsm.com / password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
