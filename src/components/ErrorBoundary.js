import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                hasError: false
            }
        });
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsx("div", { className: "max-w-md w-full bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Something went wrong" }), _jsx("p", { className: "text-gray-600 mb-6", children: "We're sorry, but something unexpected happened. Please try refreshing the page." }), _jsx("button", { onClick: () => window.location.reload(), className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: "Refresh Page" }), process.env.NODE_ENV === 'development' && this.state.error && (_jsxs("details", { className: "mt-4 text-left", children: [_jsx("summary", { className: "cursor-pointer text-sm text-gray-500", children: "Error Details" }), _jsx("pre", { className: "mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto", children: this.state.error.toString() })] }))] }) }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
