import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        // Check localStorage first, then default to dark mode for new users
        const saved = localStorage.getItem('theme');
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
            return saved;
        }
        return 'dark'; // Default to dark mode for new users
    });
    const [systemTheme, setSystemTheme] = useState(() => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    const actualTheme = theme === 'system' ? systemTheme : theme;
    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (actualTheme === 'dark') {
            root.classList.add('dark');
        }
        else {
            root.classList.remove('dark');
        }
        // Store theme preference
        localStorage.setItem('theme', theme);
    }, [actualTheme, theme]);
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
    };
    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
        }
        else if (theme === 'dark') {
            setTheme('system');
        }
        else {
            setTheme('light');
        }
    };
    const value = {
        theme,
        actualTheme,
        setTheme,
        toggleTheme,
    };
    return (_jsx(ThemeContext.Provider, { value: value, children: children }));
};
