import { Flat, Owner, Tenant, Employee, Invoice, Expense, ServiceRequest } from '@/types/building';

export const mockFlats: Flat[] = [
  { id: '1', flatNumber: 'A-101', floor: 1, size: 1200, status: 'owner-occupied', ownerId: '1', parkingSpot: 'P-01' },
  { id: '2', flatNumber: 'A-102', floor: 1, size: 1100, status: 'tenant', ownerId: '2', tenantId: '1', parkingSpot: 'P-02' },
  { id: '3', flatNumber: 'A-103', floor: 1, size: 1000, status: 'owner-occupied', ownerId: '3' },
  { id: '4', flatNumber: 'A-104', floor: 1, size: 1200, status: 'owner-occupied', ownerId: '4', parkingSpot: 'P-04' },
  { id: '5', flatNumber: 'A-201', floor: 2, size: 1200, status: 'tenant', ownerId: '5', tenantId: '2', parkingSpot: 'P-05' },
  { id: '6', flatNumber: 'A-202', floor: 2, size: 1100, status: 'owner-occupied', ownerId: '6' },
  { id: '7', flatNumber: 'A-203', floor: 2, size: 1000, status: 'vacant', ownerId: '7' },
  { id: '8', flatNumber: 'A-204', floor: 2, size: 1200, status: 'owner-occupied', ownerId: '8', parkingSpot: 'P-08' },
  { id: '9', flatNumber: 'A-301', floor: 3, size: 1200, status: 'owner-occupied', ownerId: '9', parkingSpot: 'P-09' },
  { id: '10', flatNumber: 'A-302', floor: 3, size: 1100, status: 'tenant', ownerId: '10', tenantId: '3' },
  { id: '11', flatNumber: 'A-303', floor: 3, size: 1000, status: 'owner-occupied', ownerId: '11' },
  { id: '12', flatNumber: 'A-304', floor: 3, size: 1200, status: 'owner-occupied', ownerId: '12', parkingSpot: 'P-12' },
  { id: '13', flatNumber: 'A-401', floor: 4, size: 1200, status: 'owner-occupied', ownerId: '13', parkingSpot: 'P-13' },
  { id: '14', flatNumber: 'A-402', floor: 4, size: 1100, status: 'owner-occupied', ownerId: '14' },
  { id: '15', flatNumber: 'A-403', floor: 4, size: 1000, status: 'tenant', ownerId: '15', tenantId: '4', parkingSpot: 'P-15' },
  { id: '16', flatNumber: 'A-404', floor: 4, size: 1200, status: 'owner-occupied', ownerId: '16' },
  { id: '17', flatNumber: 'A-501', floor: 5, size: 1400, status: 'owner-occupied', ownerId: '17', parkingSpot: 'P-17' },
  { id: '18', flatNumber: 'A-502', floor: 5, size: 1400, status: 'owner-occupied', ownerId: '18', parkingSpot: 'P-18' },
  { id: '19', flatNumber: 'A-503', floor: 5, size: 1300, status: 'tenant', ownerId: '19', tenantId: '5' },
  { id: '20', flatNumber: 'A-504', floor: 5, size: 1400, status: 'owner-occupied', ownerId: '20', parkingSpot: 'P-20' },
];

export const mockOwners: Owner[] = [
  { id: '1', name: 'Rajesh Kumar', email: 'rajesh.kumar@email.com', phone: '+91 98765 43210', ownershipStart: '2019-01-15', flatId: '1' },
  { id: '2', name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '+91 98765 43211', ownershipStart: '2018-06-20', flatId: '2' },
  { id: '3', name: 'Amit Patel', email: 'amit.patel@email.com', phone: '+91 98765 43212', ownershipStart: '2020-03-10', flatId: '3' },
  { id: '4', name: 'Sunita Gupta', email: 'sunita.gupta@email.com', phone: '+91 98765 43213', ownershipStart: '2017-09-01', flatId: '4' },
  { id: '5', name: 'Vikram Singh', email: 'vikram.singh@email.com', phone: '+91 98765 43214', ownershipStart: '2019-07-22', flatId: '5' },
  { id: '6', name: 'Neha Verma', email: 'neha.verma@email.com', phone: '+91 98765 43215', ownershipStart: '2021-02-14', flatId: '6' },
  { id: '7', name: 'Arjun Reddy', email: 'arjun.reddy@email.com', phone: '+91 98765 43216', ownershipStart: '2018-11-30', flatId: '7' },
  { id: '8', name: 'Kavita Joshi', email: 'kavita.joshi@email.com', phone: '+91 98765 43217', ownershipStart: '2020-08-05', flatId: '8' },
  { id: '9', name: 'Deepak Rao', email: 'deepak.rao@email.com', phone: '+91 98765 43218', ownershipStart: '2019-04-18', flatId: '9' },
  { id: '10', name: 'Anjali Nair', email: 'anjali.nair@email.com', phone: '+91 98765 43219', ownershipStart: '2017-12-01', flatId: '10' },
  { id: '11', name: 'Rahul Mehta', email: 'rahul.mehta@email.com', phone: '+91 98765 43220', ownershipStart: '2022-01-10', flatId: '11' },
  { id: '12', name: 'Pooja Iyer', email: 'pooja.iyer@email.com', phone: '+91 98765 43221', ownershipStart: '2018-05-25', flatId: '12' },
  { id: '13', name: 'Sanjay Das', email: 'sanjay.das@email.com', phone: '+91 98765 43222', ownershipStart: '2019-10-12', flatId: '13' },
  { id: '14', name: 'Meera Chatterjee', email: 'meera.c@email.com', phone: '+91 98765 43223', ownershipStart: '2020-06-08', flatId: '14' },
  { id: '15', name: 'Arun Pillai', email: 'arun.pillai@email.com', phone: '+91 98765 43224', ownershipStart: '2021-09-20', flatId: '15' },
  { id: '16', name: 'Lakshmi Menon', email: 'lakshmi.m@email.com', phone: '+91 98765 43225', ownershipStart: '2018-02-14', flatId: '16' },
  { id: '17', name: 'Kiran Desai', email: 'kiran.desai@email.com', phone: '+91 98765 43226', ownershipStart: '2017-07-30', flatId: '17' },
  { id: '18', name: 'Ravi Saxena', email: 'ravi.saxena@email.com', phone: '+91 98765 43227', ownershipStart: '2019-12-05', flatId: '18' },
  { id: '19', name: 'Divya Kapoor', email: 'divya.kapoor@email.com', phone: '+91 98765 43228', ownershipStart: '2020-04-22', flatId: '19' },
  { id: '20', name: 'Manish Tiwari', email: 'manish.t@email.com', phone: '+91 98765 43229', ownershipStart: '2021-11-15', flatId: '20' },
];

export const mockTenants: Tenant[] = [
  { id: '1', name: 'Saurabh Mishra', email: 'saurabh.m@email.com', phone: '+91 99887 76655', rentAmount: 25000, startDate: '2023-06-01', flatId: '2' },
  { id: '2', name: 'Ananya Roy', email: 'ananya.roy@email.com', phone: '+91 99887 76656', rentAmount: 28000, startDate: '2023-08-15', flatId: '5' },
  { id: '3', name: 'Vivek Agarwal', email: 'vivek.a@email.com', phone: '+91 99887 76657', rentAmount: 24000, startDate: '2024-01-01', flatId: '10' },
  { id: '4', name: 'Shruti Bose', email: 'shruti.bose@email.com', phone: '+91 99887 76658', rentAmount: 22000, startDate: '2023-11-01', flatId: '15' },
  { id: '5', name: 'Nikhil Jain', email: 'nikhil.jain@email.com', phone: '+91 99887 76659', rentAmount: 30000, startDate: '2024-02-01', flatId: '19' },
];

export const mockEmployees: Employee[] = [
  { id: '1', name: 'Ramesh', role: 'guard', phone: '+91 97654 32100', salary: 18000, shift: 'Day (6AM-6PM)', joinDate: '2020-01-15' },
  { id: '2', name: 'Suresh', role: 'guard', phone: '+91 97654 32101', salary: 18000, shift: 'Night (6PM-6AM)', joinDate: '2020-03-20' },
  { id: '3', name: 'Lakshmi', role: 'cleaner', phone: '+91 97654 32102', salary: 12000, shift: 'Morning (7AM-12PM)', joinDate: '2019-08-10' },
  { id: '4', name: 'Gopal', role: 'caretaker', phone: '+91 97654 32103', salary: 22000, shift: 'Full-time', joinDate: '2018-05-01' },
];

export const mockInvoices: Invoice[] = [
  { id: '1', flatId: '1', month: 'December', year: 2024, amount: 5000, dueDate: '2024-12-10', status: 'paid', paidDate: '2024-12-05', description: 'Monthly Maintenance' },
  { id: '2', flatId: '2', month: 'December', year: 2024, amount: 5000, dueDate: '2024-12-10', status: 'paid', paidDate: '2024-12-08', description: 'Monthly Maintenance' },
  { id: '3', flatId: '3', month: 'December', year: 2024, amount: 4500, dueDate: '2024-12-10', status: 'unpaid', description: 'Monthly Maintenance' },
  { id: '4', flatId: '4', month: 'December', year: 2024, amount: 5000, dueDate: '2024-12-10', status: 'overdue', description: 'Monthly Maintenance' },
  { id: '5', flatId: '5', month: 'December', year: 2024, amount: 5000, dueDate: '2024-12-10', status: 'paid', paidDate: '2024-12-09', description: 'Monthly Maintenance' },
  { id: '6', flatId: '6', month: 'December', year: 2024, amount: 4500, dueDate: '2024-12-10', status: 'unpaid', description: 'Monthly Maintenance' },
  { id: '7', flatId: '7', month: 'December', year: 2024, amount: 4000, dueDate: '2024-12-10', status: 'paid', paidDate: '2024-12-03', description: 'Monthly Maintenance' },
  { id: '8', flatId: '8', month: 'December', year: 2024, amount: 5000, dueDate: '2024-12-10', status: 'paid', paidDate: '2024-12-07', description: 'Monthly Maintenance' },
];

export const mockExpenses: Expense[] = [
  { id: '1', category: 'Electricity', description: 'Common area electricity - November', amount: 8500, date: '2024-12-01', vendor: 'State Electricity Board', paymentMethod: 'bank' },
  { id: '2', category: 'Security', description: 'Guard salaries - December', amount: 36000, date: '2024-12-01', paymentMethod: 'bank' },
  { id: '3', category: 'Cleaning', description: 'Cleaner salary - December', amount: 12000, date: '2024-12-01', paymentMethod: 'bank' },
  { id: '4', category: 'Elevator', description: 'Monthly maintenance contract', amount: 5000, date: '2024-12-05', vendor: 'Otis Elevators', paymentMethod: 'bank' },
  { id: '5', category: 'Water', description: 'Common water tank refill', amount: 3500, date: '2024-12-08', vendor: 'City Water Supply', paymentMethod: 'cash' },
  { id: '6', category: 'Repairs', description: 'Gate motor repair', amount: 4500, date: '2024-12-10', vendor: 'Local Electrician', paymentMethod: 'cash' },
];

export const mockServiceRequests: ServiceRequest[] = [
  { id: '1', flatId: '3', title: 'Water leakage in bathroom', category: 'plumbing', description: 'Continuous water leakage from ceiling in master bathroom', status: 'in-progress', priority: 'high', assignedTo: 'Gopal', createdAt: '2024-12-10T10:30:00Z' },
  { id: '2', flatId: '7', title: 'Elevator stuck on 3rd floor', category: 'elevator', description: 'Elevator not responding to calls from ground floor', status: 'resolved', priority: 'urgent', createdAt: '2024-12-09T08:15:00Z', resolvedAt: '2024-12-09T11:30:00Z', cost: 2000 },
  { id: '3', flatId: '12', title: 'Streetlight not working', category: 'common-area', description: 'Streetlight near parking area not working for 3 days', status: 'open', priority: 'medium', createdAt: '2024-12-11T16:45:00Z' },
  { id: '4', flatId: '5', title: 'AC power fluctuation', category: 'electrical', description: 'Frequent power fluctuations affecting AC unit', status: 'open', priority: 'low', createdAt: '2024-12-12T09:00:00Z' },
  { id: '5', flatId: '18', title: 'Broken common area bench', category: 'common-area', description: 'Wooden bench in garden area is broken', status: 'closed', priority: 'low', createdAt: '2024-12-05T14:20:00Z', resolvedAt: '2024-12-08T10:00:00Z', cost: 1500 },
];

export const expenseCategories = [
  'Electricity',
  'Water',
  'Security',
  'Cleaning',
  'Elevator',
  'Repairs',
  'Internet',
  'Reserve Fund',
  'Insurance',
  'Legal',
  'Miscellaneous',
];
