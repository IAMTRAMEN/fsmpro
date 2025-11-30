import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFSMStore } from '../store/useFSMStore';
import { AlertCircle } from 'lucide-react';
const Login = () => {
    const [email, setEmail] = useState('sarah@fsm.com');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const login = useFSMStore((state) => state.login);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                const user = useFSMStore.getState().currentUser;
                if (user?.role === 'Technician') {
                    navigate('/dashboard/technician');
                }
                else {
                    navigate('/dashboard/manager');
                }
            }
            else {
                setError('Invalid email or password');
            }
        }
        catch (err) {
            setError('Login failed. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4", children: _jsx("div", { className: "w-full max-w-md", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8", children: [_jsx("div", { className: "flex items-center justify-center mb-8", children: _jsx("h1", { className: "text-2xl font-bold text-blue-600", children: "Quality First" }) }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2 text-center", children: "Login" }), _jsx("p", { className: "text-gray-600 text-center mb-6", children: "Enter your credentials to continue" }), error && (_jsxs("div", { className: "mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-red-700", children: error })] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "Email" }), _jsx("input", { type: "email", id: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition", placeholder: "you@example.com" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Demo: sarah@fsm.com" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "Password" }), _jsx("input", { type: "password", id: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Demo: password" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200", children: loading ? 'Logging in...' : 'Login' })] }), _jsxs("div", { className: "mt-6 pt-6 border-t border-gray-200", children: [_jsx("p", { className: "text-xs text-gray-600 mb-3", children: "Demo Credentials:" }), _jsxs("div", { className: "space-y-2 text-xs text-gray-600", children: [_jsxs("p", { children: [_jsx("strong", { children: "Manager:" }), " sarah@fsm.com / password"] }), _jsxs("p", { children: [_jsx("strong", { children: "Owner:" }), " mike@fsm.com / password"] }), _jsxs("p", { children: [_jsx("strong", { children: "Admin:" }), " admin@fsm.com / password"] }), _jsxs("p", { children: [_jsx("strong", { children: "Technician:" }), " john@fsm.com / password"] })] })] })] }) }) }));
};
export default Login;
