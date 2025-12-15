export interface Flat {
  id: string;
  flatNumber: string;
  floor: number;
  size: number;
  status: 'owner-occupied' | 'tenant' | 'vacant';
  ownerId?: string;
  tenantId?: string;
  parkingSpot?: string;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  emergencyContact?: string;
  ownershipStart: string;
  flatId: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  rentAmount: number;
  startDate: string;
  endDate?: string;
  flatId: string;
}

export interface Employee {
  id: string;
  name: string;
  role: 'guard' | 'cleaner' | 'caretaker' | 'other';
  phone: string;
  salary: number;
  shift?: string;
  joinDate: string;
}

export interface Invoice {
  id: string;
  flatId: string;
  month: string;
  year: number;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
  paidDate?: string;
  description: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  flatId: string;
  amount: number;
  date: string;
  method: 'cash' | 'bank' | 'upi' | 'cheque';
  reference?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  paymentMethod: 'cash' | 'bank' | 'upi' | 'cheque';
  attachmentUrl?: string;
}

export interface ServiceRequest {
  id: string;
  flatId: string;
  title: string;
  category: 'plumbing' | 'electrical' | 'elevator' | 'common-area' | 'other';
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  cost?: number;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  cameraId: string; // External camera system ID
  status: 'online' | 'offline';
}
