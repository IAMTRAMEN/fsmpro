import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Technician', 'Manager', 'Owner', 'SuperAdmin']),
  avatar: z.string().optional(),
  address: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }).optional(),
  skills: z.array(z.string()).optional(),
  status: z.enum(['Available', 'Busy', 'Offline', 'OnRoute']).optional()
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['Technician', 'Manager', 'Owner', 'SuperAdmin']).optional(),
  avatar: z.string().optional(),
  address: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }).optional(),
  skills: z.array(z.string()).optional(),
  status: z.enum(['Available', 'Busy', 'Offline', 'OnRoute']).optional(),
  newPassword: z.string().min(6).optional(),
  oldPassword: z.string().min(6).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Work order validation schemas
export const createWorkOrderSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().optional(),
  technicianIds: z.array(z.string()),
  title: z.string().min(1),
  description: z.string().optional(),
  serviceType: z.string().min(1),
  status: z.enum(['New', 'Assigned', 'In Progress', 'Completed']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }),
  price: z.number().min(0).optional()
});

export const updateWorkOrderSchema = z.object({
  customerId: z.string().optional(),
  technicianIds: z.array(z.string()).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  serviceType: z.string().min(1).optional(),
  status: z.enum(['New', 'Assigned', 'In Progress', 'Completed']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  actualStart: z.string().optional(),
  actualEnd: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }).optional(),
  price: z.number().positive().optional()
});

// Customer validation schemas
export const createCustomerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(1),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }),
  serviceHistory: z.array(z.string()).optional()
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }).optional(),
  serviceHistory: z.array(z.string()).optional()
});

// Invoice validation schemas
export const createInvoiceSchema = z.object({
  id: z.string().optional(),
  workOrderId: z.string(),
  customerId: z.string(),
  amount: z.number().optional(),
  lineItems: z.array(z.object({
    id: z.string(),
    description: z.string(),
    quantity: z.number().min(0),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).max(100)
  })).optional(),
  subtotal: z.number().optional(),
  taxAmount: z.number().optional(),
  total: z.number().optional(),
  status: z.enum(['Pending', 'Paid', 'Overdue']).optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  notes: z.string().optional()
});

export const updateInvoiceSchema = z.object({
  amount: z.number().optional(),
  lineItems: z.array(z.object({
    id: z.string(),
    description: z.string(),
    quantity: z.number().min(0),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).max(100)
  })).optional(),
  subtotal: z.number().optional(),
  taxAmount: z.number().optional(),
  total: z.number().optional(),
  status: z.enum(['Pending', 'Paid', 'Overdue']).optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  discount: z.number().optional(),
  discountType: z.enum(['amount', 'percent']).optional()
});

// Provider validation schemas
export const createProviderSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  serviceType: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  status: z.enum(['Active', 'Inactive']).optional()
});

export const updateProviderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  serviceType: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  status: z.enum(['Active', 'Inactive']).optional()
});

// Work order resource and note validation schemas
export const createWorkOrderResourceSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.number().optional(),
  description: z.string().optional(),
  uploadedBy: z.string().min(1)
});

export const createWorkOrderNoteSchema = z.object({
  content: z.string().min(1),
  author: z.string().min(1),
  authorId: z.string().min(1)
});

// Technician location validation schema
export const updateTechnicianLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional()
});