import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, actualTheme, setTheme } = useTheme();

  const handleThemeChange = () => {
    // Simple toggle between light and dark
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  const getIcon = () => {
    return actualTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  };

  const getLabel = () => {
    return actualTheme === 'dark' ? 'Dark' : 'Light';
  };

  return (
    <button
      onClick={handleThemeChange}
      className="group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
        bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100
        border border-blue-200 hover:border-blue-300
        text-blue-700 hover:text-blue-800
        shadow-sm hover:shadow-md
        dark:from-gray-700 dark:to-gray-600
        dark:hover:from-gray-600 dark:hover:to-gray-500
        dark:border-gray-500 dark:hover:border-gray-400
        dark:text-gray-200 dark:hover:text-white
        dark:shadow-gray-900/20"
      title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative flex items-center justify-center">
        <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-purple-400 to-blue-500 opacity-20 scale-110'
            : 'bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20 scale-100'
        }`} />
        <div className={`relative z-10 transition-all duration-300 ${
          actualTheme === 'dark'
            ? 'text-purple-300 group-hover:text-purple-200'
            : 'text-yellow-500 group-hover:text-yellow-400'
        }`}>
          {getIcon()}
        </div>
      </div>
      <span className="hidden sm:inline relative z-10 transition-colors duration-300">
        {getLabel()}
      </span>
    </button>
  );
};

export default ThemeToggle;