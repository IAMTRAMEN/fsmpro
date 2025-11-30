import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
const ThemeToggle = () => {
    const { theme, actualTheme, setTheme } = useTheme();
    const handleThemeChange = () => {
        // Simple toggle between light and dark
        setTheme(actualTheme === 'dark' ? 'light' : 'dark');
    };
    const getIcon = () => {
        return actualTheme === 'dark' ? _jsx(Moon, { className: "w-4 h-4" }) : _jsx(Sun, { className: "w-4 h-4" });
    };
    const getLabel = () => {
        return actualTheme === 'dark' ? 'Dark' : 'Light';
    };
    return (_jsxs("button", { onClick: handleThemeChange, className: "group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800\r\n        bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100\r\n        border border-blue-200 hover:border-blue-300\r\n        text-blue-700 hover:text-blue-800\r\n        shadow-sm hover:shadow-md\r\n        dark:from-gray-700 dark:to-gray-600\r\n        dark:hover:from-gray-600 dark:hover:to-gray-500\r\n        dark:border-gray-500 dark:hover:border-gray-400\r\n        dark:text-gray-200 dark:hover:text-white\r\n        dark:shadow-gray-900/20", title: `Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`, children: [_jsxs("div", { className: "relative flex items-center justify-center", children: [_jsx("div", { className: `absolute inset-0 rounded-full transition-all duration-300 ${actualTheme === 'dark'
                            ? 'bg-gradient-to-r from-purple-400 to-blue-500 opacity-20 scale-110'
                            : 'bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20 scale-100'}` }), _jsx("div", { className: `relative z-10 transition-all duration-300 ${actualTheme === 'dark'
                            ? 'text-purple-300 group-hover:text-purple-200'
                            : 'text-yellow-500 group-hover:text-yellow-400'}`, children: getIcon() })] }), _jsx("span", { className: "hidden sm:inline relative z-10 transition-colors duration-300", children: getLabel() })] }));
};
export default ThemeToggle;
