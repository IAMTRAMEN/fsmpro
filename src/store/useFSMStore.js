// Added notification state and helper methods for UI feedback notifications
import { create } from 'zustand';
const API_URL = 'http://127.0.0.1:5000/api';
const getInitialUser = () => {
    try {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }
    catch {
        return null;
    }
};
const getAuthHeaders = () => {
    try {
        const stored = localStorage.getItem('currentUser');
        const user = stored ? JSON.parse(stored) : null;
        if (!user?.token) {
            console.warn('No auth token in localStorage');
        }
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }
    catch {
        console.warn('Error parsing auth headers');
        return {};
    }
};
let notificationIdCounter = 0;
export const useFSMStore = create((set, get) => ({
    currentUser: getInitialUser(),
    users: [],
    technicians: [],
    customers: [],
    providers: [],
    workOrders: [],
    invoices: [],
    invoiceSettings: null,
    loading: {
        login: false,
        users: false,
        customers: false,
        providers: false,
        workOrders: false,
        invoices: false,
        invoiceSettings: false,
        userUpdate: false,
        customerUpdate: false,
        workOrderUpdate: false,
        invoiceUpdate: false,
    },
    notifications: [],
    addNotification: (message, type) => set((state) => ({
        notifications: [...state.notifications, { id: ++notificationIdCounter, message, type }]
    })),
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),
    login: async (email, password) => {
        set((state) => ({ loading: { ...state.loading, login: true } }));
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                const user = await res.json();
                set((state) => ({
                    currentUser: user,
                    loading: { ...state.loading, login: false }
                }));
                localStorage.setItem('currentUser', JSON.stringify(user));
                get().addNotification('Login successful!', 'success');
                return true;
            }
            set((state) => ({ loading: { ...state.loading, login: false } }));
            get().addNotification('Login failed, please check your credentials.', 'error');
            return false;
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, login: false } }));
            get().addNotification('Login error occurred.', 'error');
            return false;
        }
    },
    logout: () => {
        set({ currentUser: null });
        localStorage.removeItem('currentUser');
    },
    fetchUsers: async () => {
        set((state) => ({ loading: { ...state.loading, users: true } }));
        try {
            const res = await fetch(`${API_URL}/users`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const users = await res.json();
                const technicians = users.filter((u) => u.role === 'Technician');
                set((state) => ({
                    users,
                    technicians,
                    loading: { ...state.loading, users: false }
                }));
            }
            else if (res.status === 403) {
                // Handle 403 Forbidden - user doesn't have permission to fetch users
                set((state) => ({ loading: { ...state.loading, users: false } }));
                console.log('User does not have permission to fetch users list');
                // Don't show error notification for role-based access denials
            }
            else {
                set((state) => ({ loading: { ...state.loading, users: false } }));
                get().addNotification('Failed to fetch users.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, users: false } }));
            get().addNotification('Fetch users error.', 'error');
        }
    },
    fetchCustomers: async () => {
        set((state) => ({ loading: { ...state.loading, customers: true } }));
        try {
            const res = await fetch(`${API_URL}/customers`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const customers = await res.json();
                set((state) => ({
                    customers,
                    loading: { ...state.loading, customers: false }
                }));
            }
            else {
                set((state) => ({ loading: { ...state.loading, customers: false } }));
                get().addNotification('Failed to fetch customers.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, customers: false } }));
            get().addNotification('Fetch customers error.', 'error');
        }
    },
    fetchProviders: async () => {
        set((state) => ({ loading: { ...state.loading, providers: true } }));
        try {
            const res = await fetch(`${API_URL}/providers`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const providers = await res.json();
                set((state) => ({
                    providers,
                    loading: { ...state.loading, providers: false }
                }));
            }
            else {
                set((state) => ({ loading: { ...state.loading, providers: false } }));
                get().addNotification('Failed to fetch providers.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, providers: false } }));
            get().addNotification('Fetch providers error.', 'error');
        }
    },
    fetchWorkOrders: async () => {
        set((state) => ({ loading: { ...state.loading, workOrders: true } }));
        try {
            const res = await fetch(`${API_URL}/work-orders`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const workOrders = await res.json();
                set((state) => ({
                    workOrders,
                    loading: { ...state.loading, workOrders: false }
                }));
            }
            else {
                set((state) => ({ loading: { ...state.loading, workOrders: false } }));
                get().addNotification('Failed to fetch work orders.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, workOrders: false } }));
            get().addNotification('Fetch work orders error.', 'error');
        }
    },
    fetchInvoices: async () => {
        set((state) => ({ loading: { ...state.loading, invoices: true } }));
        try {
            const res = await fetch(`${API_URL}/invoices`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const invoices = await res.json();
                const toNumber = (value) => value === null || value === undefined ? 0 : Number(value);
                const normalizedInvoices = invoices.map((inv) => ({
                    ...inv,
                    amount: toNumber(inv.amount),
                    subtotal: toNumber(inv.subtotal),
                    taxAmount: toNumber(inv.taxAmount),
                    total: toNumber(inv.total),
                    discount: toNumber(inv.discount)
                }));
                set((state) => ({
                    invoices: normalizedInvoices,
                    loading: { ...state.loading, invoices: false }
                }));
            }
            else {
                set((state) => ({ loading: { ...state.loading, invoices: false } }));
                get().addNotification('Failed to fetch invoices.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, invoices: false } }));
            get().addNotification('Fetch invoices error.', 'error');
        }
    },
    fetchInvoiceSettings: async () => {
        try {
            const res = await fetch(`${API_URL}/invoice-settings`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const settings = await res.json();
                set({ invoiceSettings: settings });
            }
            else {
                get().addNotification('Failed to fetch invoice settings.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Fetch invoice settings error.', 'error');
        }
    },
    fetchLiveTechnicianLocations: async () => {
        try {
            const res = await fetch(`${API_URL}/technicians/locations/live`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const technicians = await res.json();
                set({ technicians });
            }
            else {
                get().addNotification('Failed to fetch live technician locations.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Fetch live technician locations error.', 'error');
        }
    },
    // other methods remain unchanged but should add notifications similarly on errors and successes
    addUser: async (user) => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(user)
            });
            if (res.ok) {
                set((state) => {
                    const newUsers = [...state.users, user];
                    const newTechs = user.role === 'Technician'
                        ? [...state.technicians, user]
                        : state.technicians;
                    return { users: newUsers, technicians: newTechs };
                });
                get().addNotification('User added successfully.', 'success');
            }
            else {
                const errorData = await res.json().catch(() => ({}));
                let errorMessage = errorData.error || 'Failed to add user.';
                // Handle detailed validation errors
                if (errorData.details && Array.isArray(errorData.details)) {
                    const validationErrors = errorData.details.map((detail) => `${detail.message}`).join(', ');
                    errorMessage = `Failed : ${validationErrors}`;
                }
                get().addNotification(errorMessage, 'error');
            }
        }
        catch (e) {
            get().addNotification('Error adding user.', 'error');
        }
    },
    updateUser: async (id, data) => {
        set((state) => ({ loading: { ...state.loading, userUpdate: true } }));
        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updatedUser = await res.json();
                set((state) => {
                    const newUsers = state.users.map(u => u.id === id ? updatedUser : u);
                    const newTechs = state.technicians.map(t => t.id === id ? updatedUser : t);
                    const newCurrentUser = state.currentUser?.id === id ? updatedUser : state.currentUser;
                    if (newCurrentUser) {
                        // Preserve the token when updating localStorage
                        const currentStored = localStorage.getItem('currentUser');
                        const currentData = currentStored ? JSON.parse(currentStored) : {};
                        const updatedData = { ...currentData, ...newCurrentUser };
                        localStorage.setItem('currentUser', JSON.stringify(updatedData));
                    }
                    return {
                        users: newUsers,
                        technicians: newTechs,
                        currentUser: newCurrentUser,
                        loading: { ...state.loading, userUpdate: false }
                    };
                });
                get().addNotification('User updated successfully.', 'success');
            }
            else {
                const errorData = await res.json().catch(() => ({}));
                set((state) => ({ loading: { ...state.loading, userUpdate: false } }));
                get().addNotification(errorData.error || 'Failed to update user.', 'error');
                throw new Error(errorData.error || 'Failed to update user');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, userUpdate: false } }));
            get().addNotification(e?.message || 'Error updating user.', 'error');
            throw e;
        }
    },
    deleteUser: async (id) => {
        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                set((state) => ({
                    users: state.users.filter(u => u.id !== id),
                    technicians: state.technicians.filter(t => t.id !== id)
                }));
                get().addNotification('User deleted successfully.', 'success');
            }
            else {
                get().addNotification('Failed to delete user.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Error deleting user.', 'error');
        }
    },
    addCustomer: async (customer) => {
        set((state) => ({ loading: { ...state.loading, customerUpdate: true } }));
        try {
            const res = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(customer)
            });
            if (res.ok) {
                const newCustomer = await res.json();
                set((state) => ({
                    customers: [...state.customers, newCustomer],
                    loading: { ...state.loading, customerUpdate: false }
                }));
                get().addNotification('Customer added successfully.', 'success');
            }
            else {
                const errorData = await res.json().catch(() => ({}));
                set((state) => ({ loading: { ...state.loading, customerUpdate: false } }));
                get().addNotification(errorData.error || 'Failed to add customer.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, customerUpdate: false } }));
            get().addNotification('Error adding customer.', 'error');
        }
    },
    updateCustomer: async (id, data) => {
        set((state) => ({ loading: { ...state.loading, customerUpdate: true } }));
        try {
            const res = await fetch(`${API_URL}/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updatedCustomer = await res.json();
                set((state) => ({
                    customers: state.customers.map(c => c.id === id ? updatedCustomer : c),
                    loading: { ...state.loading, customerUpdate: false }
                }));
                get().addNotification('Customer updated successfully.', 'success');
            }
            else {
                set((state) => ({ loading: { ...state.loading, customerUpdate: false } }));
                get().addNotification('Failed to update customer.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, customerUpdate: false } }));
            get().addNotification('Error updating customer.', 'error');
        }
    },
    deleteCustomer: async (id) => {
        try {
            const res = await fetch(`${API_URL}/customers/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                set((state) => ({
                    customers: state.customers.filter(c => c.id !== id)
                }));
                get().addNotification('Customer deleted successfully.', 'success');
            }
            else {
                get().addNotification('Failed to delete customer.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Error deleting customer.', 'error');
        }
    },
    addProvider: async (provider) => {
        try {
            const res = await fetch(`${API_URL}/providers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(provider)
            });
            if (res.ok) {
                const newProvider = await res.json();
                set((state) => ({
                    providers: [...state.providers, newProvider]
                }));
                get().addNotification('Provider added successfully.', 'success');
            }
            else {
                const errorData = await res.json().catch(() => ({}));
                get().addNotification(errorData.error || 'Failed to add provider.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Error adding provider.', 'error');
        }
    },
    updateProvider: async (id, data) => {
        try {
            const res = await fetch(`${API_URL}/providers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updatedProvider = await res.json();
                set((state) => ({
                    providers: state.providers.map(p => p.id === id ? updatedProvider : p)
                }));
                get().addNotification('Provider updated successfully.', 'success');
            }
            else {
                get().addNotification('Failed to update provider.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Error updating provider.', 'error');
        }
    },
    deleteProvider: async (id) => {
        try {
            const res = await fetch(`${API_URL}/providers/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                set((state) => ({
                    providers: state.providers.filter(p => p.id !== id)
                }));
                get().addNotification('Provider deleted successfully.', 'success');
            }
            else {
                get().addNotification('Failed to delete provider.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Error deleting provider.', 'error');
        }
    },
    updateWorkOrderStatus: async (id, status) => {
        set((state) => ({ loading: { ...state.loading, workOrderUpdate: true } }));
        try {
            const res = await fetch(`${API_URL}/work-orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                const updatedWorkOrder = await res.json();
                set((state) => ({
                    workOrders: state.workOrders.map(wo => wo.id === id ? updatedWorkOrder : wo),
                    loading: { ...state.loading, workOrderUpdate: false }
                }));
                get().addNotification('Work order status updated successfully.', 'success');
            }
            else {
                set((state) => ({ loading: { ...state.loading, workOrderUpdate: false } }));
                get().addNotification('Failed to update work order status.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, workOrderUpdate: false } }));
            get().addNotification('Error updating work order status.', 'error');
        }
    },
    assignTechnicians: async (workOrderId, technicianIds) => {
        set((state) => ({ loading: { ...state.loading, workOrderUpdate: true } }));
        try {
            const res = await fetch(`${API_URL}/work-orders/${workOrderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ technicianIds })
            });
            if (res.ok) {
                const updatedWorkOrder = await res.json();
                set((state) => ({
                    workOrders: state.workOrders.map(wo => wo.id === workOrderId ? updatedWorkOrder : wo),
                    loading: { ...state.loading, workOrderUpdate: false }
                }));
                get().addNotification('Technicians assigned successfully.', 'success');
            }
            else {
                set((state) => ({ loading: { ...state.loading, workOrderUpdate: false } }));
                get().addNotification('Failed to assign technicians.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, workOrderUpdate: false } }));
            get().addNotification('Error assigning technicians.', 'error');
        }
    },
    addWorkOrder: async (workOrder) => {
        set((state) => ({ loading: { ...state.loading, workOrderUpdate: true } }));
        try {
            // Filter out extra fields that the API doesn't expect
            const apiWorkOrder = {
                id: workOrder.id,
                customerId: workOrder.customerId,
                technicianIds: workOrder.technicianIds,
                title: workOrder.title,
                description: workOrder.description,
                serviceType: workOrder.serviceType,
                status: workOrder.status,
                priority: workOrder.priority,
                scheduledStart: workOrder.scheduledStart,
                scheduledEnd: workOrder.scheduledEnd,
                location: workOrder.location,
                price: workOrder.price
            };
            const res = await fetch(`${API_URL}/work-orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(apiWorkOrder)
            });
            if (res.ok) {
                const response = await res.json();
                // Construct the full work order object for the frontend
                const newWorkOrder = {
                    ...workOrder,
                    id: response.workOrderId,
                    customerName: workOrder.customerId ?
                        get().customers.find(c => c.id === workOrder.customerId)?.name || 'Unknown Customer' :
                        'No Customer'
                };
                set((state) => ({
                    workOrders: [...state.workOrders, newWorkOrder],
                    loading: { ...state.loading, workOrderUpdate: false }
                }));
                get().addNotification('Work order created successfully.', 'success');
                return newWorkOrder;
            }
            else {
                const errorData = await res.json().catch(() => ({}));
                set((state) => ({ loading: { ...state.loading, workOrderUpdate: false } }));
                get().addNotification(errorData.error || 'Failed to create work order.', 'error');
                throw new Error(errorData.error || 'Failed to create work order');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, workOrderUpdate: false } }));
            get().addNotification('Error creating work order.', 'error');
            throw e;
        }
    },
    updateWorkOrder: async (id, data) => {
        set((state) => ({ loading: { ...state.loading, workOrderUpdate: true } }));
        try {
            const res = await fetch(`${API_URL}/work-orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updatedWorkOrder = await res.json();
                set((state) => ({
                    workOrders: state.workOrders.map(wo => wo.id === id ? updatedWorkOrder : wo),
                    loading: { ...state.loading, workOrderUpdate: false }
                }));
                get().addNotification('Work order updated successfully.', 'success');
            }
            else {
                set((state) => ({ loading: { ...state.loading, workOrderUpdate: false } }));
                get().addNotification('Failed to update work order.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, workOrderUpdate: false } }));
            get().addNotification('Error updating work order.', 'error');
        }
    },
    deleteWorkOrder: async (id) => {
        try {
            const res = await fetch(`${API_URL}/work-orders/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                set((state) => ({
                    workOrders: state.workOrders.filter(wo => wo.id !== id)
                }));
                get().addNotification('Work order deleted successfully.', 'success');
            }
            else {
                get().addNotification('Failed to delete work order.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Error deleting work order.', 'error');
        }
    },
    addWorkOrderResource: async (workOrderId, file, description) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (description)
                formData.append('description', description);
            const res = await fetch(`${API_URL}/work-orders/${workOrderId}/resources`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            });
            if (res.ok) {
                const newResource = await res.json();
                // Update the work order in the store to include the new resource
                set((state) => ({
                    workOrders: state.workOrders.map(wo => wo.id === workOrderId
                        ? {
                            ...wo,
                            resources: [...(wo.resources || []), newResource]
                        }
                        : wo)
                }));
                get().addNotification('Resource added successfully.', 'success');
                return newResource;
            }
            else {
                const errorData = await res.json().catch(() => ({}));
                const errorMessage = errorData.error || 'Failed to add resource.';
                get().addNotification(errorMessage, 'error');
                throw new Error(errorMessage);
            }
        }
        catch (e) {
            const errorMessage = e?.message || 'Error adding resource.';
            get().addNotification(errorMessage, 'error');
            throw e;
        }
    },
    deleteWorkOrderResource: async (workOrderId, resourceId) => {
        try {
            const res = await fetch(`${API_URL}/work-orders/${workOrderId}/resources/${resourceId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                // Update the work order in the store to remove the deleted resource
                set((state) => ({
                    workOrders: state.workOrders.map(wo => wo.id === workOrderId
                        ? {
                            ...wo,
                            resources: (wo.resources || []).filter(r => r.id !== resourceId)
                        }
                        : wo)
                }));
                get().addNotification('Resource deleted successfully.', 'success');
            }
            else {
                const errorData = await res.json().catch(() => ({}));
                const errorMessage = errorData.error || 'Failed to delete resource.';
                get().addNotification(errorMessage, 'error');
                throw new Error(errorMessage);
            }
        }
        catch (e) {
            const errorMessage = e?.message || 'Error deleting resource.';
            get().addNotification(errorMessage, 'error');
            throw e;
        }
    },
    addWorkOrderNote: async (workOrderId, content) => {
        try {
            const currentUser = get().currentUser;
            if (!currentUser)
                throw new Error('Not authenticated');
            const res = await fetch(`${API_URL}/work-orders/${workOrderId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    content,
                    author: currentUser.name,
                    authorId: currentUser.id
                })
            });
            if (res.ok) {
                get().addNotification('Note added successfully.', 'success');
            }
            else {
                get().addNotification('Failed to add note.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Error adding note.', 'error');
        }
    },
    deleteWorkOrderNote: async (workOrderId, noteId) => {
        try {
            const res = await fetch(`${API_URL}/work-orders/${workOrderId}/notes/${noteId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                get().addNotification('Note deleted successfully.', 'success');
            }
            else {
                get().addNotification('Failed to delete note.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Error deleting note.', 'error');
        }
    },
    updateTechnicianStatus: async (id, status) => {
        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                const updatedUser = await res.json();
                set((state) => ({
                    users: state.users.map(u => u.id === id ? updatedUser : u),
                    technicians: state.technicians.map(t => t.id === id ? updatedUser : t)
                }));
                get().addNotification('Technician status updated successfully.', 'success');
            }
            else {
                get().addNotification('Failed to update technician status.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Error updating technician status.', 'error');
        }
    },
    addInvoice: async (invoice) => {
        set((state) => ({ loading: { ...state.loading, invoiceUpdate: true } }));
        try {
            const res = await fetch(`${API_URL}/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(invoice)
            });
            if (res.ok) {
                const newInvoice = await res.json();
                set((state) => ({
                    invoices: [...state.invoices, newInvoice],
                    loading: { ...state.loading, invoiceUpdate: false }
                }));
                get().addNotification('Invoice created successfully.', 'success');
            }
            else {
                set((state) => ({ loading: { ...state.loading, invoiceUpdate: false } }));
                get().addNotification('Failed to create invoice.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, invoiceUpdate: false } }));
            get().addNotification('Error creating invoice.', 'error');
        }
    },
    updateInvoice: async (id, data) => {
        set((state) => ({ loading: { ...state.loading, invoiceUpdate: true } }));
        try {
            const res = await fetch(`${API_URL}/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updatedInvoice = await res.json();
                set((state) => ({
                    invoices: state.invoices.map(inv => inv.id === id ? updatedInvoice : inv),
                    loading: { ...state.loading, invoiceUpdate: false }
                }));
                get().addNotification('Invoice updated successfully.', 'success');
            }
            else {
                set((state) => ({ loading: { ...state.loading, invoiceUpdate: false } }));
                get().addNotification('Failed to update invoice.', 'error');
            }
        }
        catch (e) {
            set((state) => ({ loading: { ...state.loading, invoiceUpdate: false } }));
            get().addNotification('Error updating invoice.', 'error');
        }
    },
    deleteInvoice: async (id) => {
        try {
            const res = await fetch(`${API_URL}/invoices/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                set((state) => ({
                    invoices: state.invoices.filter(inv => inv.id !== id)
                }));
                get().addNotification('Invoice deleted successfully.', 'success');
            }
            else {
                get().addNotification('Failed to delete invoice.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Error deleting invoice.', 'error');
        }
    },
    updateInvoiceSettings: async (data) => {
        try {
            const res = await fetch(`${API_URL}/invoice-settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const settings = await res.json();
                set({ invoiceSettings: settings });
                get().addNotification('Invoice settings updated successfully.', 'success');
            }
            else {
                get().addNotification('Failed to update invoice settings.', 'error');
            }
        }
        catch (e) {
            get().addNotification('Error updating invoice settings.', 'error');
        }
    },
    moveTechnicians: () => set((state) => ({
        technicians: state.technicians.map(tech => {
            const moveLat = (Math.random() - 0.5) * 0.001;
            const moveLng = (Math.random() - 0.5) * 0.001;
            return {
                ...tech,
                location: {
                    ...tech.location,
                    lat: tech.location.lat + moveLat,
                    lng: tech.location.lng + moveLng
                }
            };
        })
    })),
}));
