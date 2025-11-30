import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useFSMStore } from '../store/useFSMStore';
import { Settings, Upload, Save, AlertCircle } from 'lucide-react';
const InvoiceSettings = () => {
    const { invoiceSettings, fetchInvoiceSettings, updateInvoiceSettings, currentUser } = useFSMStore();
    const [formData, setFormData] = useState({});
    const [logoPreview, setLogoPreview] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const isAuthorized = ['SuperAdmin', 'Owner'].includes(currentUser?.role || '');
    useEffect(() => {
        fetchInvoiceSettings();
    }, []);
    useEffect(() => {
        if (invoiceSettings) {
            setFormData(invoiceSettings);
            setLogoPreview(invoiceSettings.logoUrl || '');
        }
    }, [invoiceSettings]);
    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                setLogoPreview(base64);
                setFormData({ ...formData, logoUrl: base64 });
            };
            reader.readAsDataURL(file);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateInvoiceSettings(formData);
            setMessage({ type: 'success', text: 'Invoice settings saved successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
        catch (error) {
            console.error('Save settings error:', error);
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save settings' });
        }
        finally {
            setIsSaving(false);
        }
    };
    if (!isAuthorized) {
        return (_jsxs("div", { className: "bg-white rounded-lg p-8 text-center border border-red-200", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-red-400 mx-auto mb-3" }), _jsx("p", { className: "text-red-600 font-medium", children: "Access Denied" }), _jsx("p", { className: "text-red-500 text-sm mt-1", children: "Only SuperAdmins and Owners can access invoice settings." })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-900 flex items-center gap-2", children: [_jsx(Settings, { className: "w-6 h-6 text-blue-600" }), "Invoice Settings"] }), _jsx("p", { className: "text-gray-500 mt-1", children: "Customize your invoice appearance and defaults" })] }), message.text && (_jsx("div", { className: `rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`, children: _jsx("p", { className: message.type === 'success' ? 'text-green-700' : 'text-red-700', children: message.text }) })), _jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-100 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-6", children: "Company Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Company Name" }), _jsx("input", { type: "text", value: formData.companyName || '', onChange: (e) => handleInputChange('companyName', e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", placeholder: "Your Company Name" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tax ID / Registration Number" }), _jsx("input", { type: "text", value: formData.companyTax || '', onChange: (e) => handleInputChange('companyTax', e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", placeholder: "e.g., MF: 1234567890/K" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Company Address" }), _jsx("textarea", { value: formData.companyAddress || '', onChange: (e) => handleInputChange('companyAddress', e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", rows: 3, placeholder: "Street address, city, state, postal code" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Phone" }), _jsx("input", { type: "tel", value: formData.companyPhone || '', onChange: (e) => handleInputChange('companyPhone', e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", placeholder: "+1 (555) 123-4567" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email" }), _jsx("input", { type: "email", value: formData.companyEmail || '', onChange: (e) => handleInputChange('companyEmail', e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", placeholder: "info@company.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Website (Optional)" }), _jsx("input", { type: "url", value: formData.companyWebsite || '', onChange: (e) => handleInputChange('companyWebsite', e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", placeholder: "https://www.company.com" })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-100 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-6", children: "Logo & Branding" }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Company Logo" }), _jsxs("div", { className: "flex items-center gap-4", children: [logoPreview && (_jsx("div", { className: "w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center", children: _jsx("img", { src: logoPreview, alt: "Logo", className: "max-w-full max-h-full object-contain" }) })), _jsxs("label", { className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition", children: [_jsx(Upload, { className: "w-4 h-4" }), "Upload Logo", _jsx("input", { type: "file", accept: "image/*", onChange: handleLogoUpload, className: "hidden" })] })] }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Recommended size: 200x100px, formats: PNG, JPG" })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-100 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-6", children: "Invoice Settings" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Invoice Number Prefix" }), _jsx("input", { type: "text", value: formData.invoicePrefix || '', onChange: (e) => handleInputChange('invoicePrefix', e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", placeholder: "INV" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "e.g., INV-001, INV-002..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Default Tax Rate (%)" }), _jsx("input", { type: "number", min: "0", max: "100", step: "0.1", value: formData.defaultTaxRate || 0, onChange: (e) => handleInputChange('defaultTaxRate', parseFloat(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", placeholder: "0" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Payment Terms (Days)" }), _jsx("input", { type: "number", min: "0", value: formData.paymentTermsDays || 30, onChange: (e) => handleInputChange('paymentTermsDays', parseInt(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", placeholder: "30" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Days until invoice is due" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Invoice Language" }), _jsxs("select", { value: formData.language || 'en', onChange: (e) => handleInputChange('language', e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", children: [_jsx("option", { value: "en", children: "English" }), _jsx("option", { value: "fr", children: "Fran\u00E7ais (French)" }), _jsx("option", { value: "es", children: "Espa\u00F1ol (Spanish)" }), _jsx("option", { value: "de", children: "Deutsch (German)" }), _jsx("option", { value: "it", children: "Italiano (Italian)" }), _jsx("option", { value: "pt", children: "Portugu\u00EAs (Portuguese)" }), _jsx("option", { value: "ar", children: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629 (Arabic)" })] })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Invoice Footer Text" }), _jsx("textarea", { value: formData.footerText || '', onChange: (e) => handleInputChange('footerText', e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", rows: 3, placeholder: "Thank you for your business! Payment terms and conditions..." })] })] })] }), _jsx("div", { className: "flex gap-3", children: _jsxs("button", { onClick: handleSave, disabled: isSaving, className: "flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400", children: [_jsx(Save, { className: "w-4 h-4" }), isSaving ? 'Saving...' : 'Save Settings'] }) })] }));
};
export default InvoiceSettings;
