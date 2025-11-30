export type Role = 'Technician' | 'Manager' | 'Owner' | 'SuperAdmin';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  address?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Technician extends User {
  lastUpdate: string;
  accuracy: number;
  skills: string[];
  status: 'Available' | 'Busy' | 'Offline' | 'OnRoute';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  serviceHistory: string[];
}

export interface Provider {
  id: string;
  name: string;
  serviceType: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive';
}

export interface WorkOrderResource {
  id: string;
  workOrderId?: string;
  fileName: string;
  fileType: string;
  filePath?: string;
  url: string;
  fileSize?: number;
  size?: number;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface WorkOrderNote {
  optimistic?: any;
  id: string;
  content: string;
  author: string;
  authorId: string;
  timestamp: string;
  updatedAt?: string;
}

export interface WorkOrder {
  estimatedDuration: number;
  customerName: string;
  id: string;
  customerId: string;
  technicianIds: string[];
  title: string;
  description?: string;
  serviceType: string;
  status: 'New' | 'Assigned' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  price: number;
  resources?: WorkOrderResource[];
  notes?: WorkOrderNote[];
}

export interface Invoice {
  id: string;
  workOrderId: string;
  customerId: string;
  amount?: number;
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }[];
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  issueDate: string;
  dueDate: string;
  notes?: string;
  terms?: string;
  discount?: number;
  discountType?: 'amount' | 'percent';
}

export interface InvoiceSettings {
  id: string;
  companyName: string;
  companyTax: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  logoUrl: string;
  invoicePrefix: string;
  defaultTaxRate: number;
  paymentTermsDays: number;
  language: string;
  footerText: string;
}
