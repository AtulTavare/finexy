export type Brand = 'Infinity Innovations';

export interface PersonalIncome {
  id: string;
  source: string;
  amount: number;
  date: string;
  category: 'Salary' | 'Trip Manager Fee' | 'Business Draw' | 'Other';
  isRecurring: boolean;
  reference?: string;
  description?: string;
  createdAt: string;
  userId?: string;
}

export interface PersonalExpense {
  id: string;
  amount: number;
  category: string;
  reason: string;
  date: string;
  dayOfWeek: string;
  paymentMethod: string;
  description?: string;
  createdAt: string;
  userId?: string;
}

export interface PersonalDebt {
  id: string;
  type: 'I Owe' | 'Owed to Me';
  partyName: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Partial' | 'Paid';
  interestRate?: number;
  createdAt: string;
  userId?: string;
}

export interface Lead {
  id: string;
  name: string;
  brand: Brand;
  source: string;
  stage: 'Lead' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';
  estimatedValue: number;
  nextAction: string;
  nextActionDate: string;
  createdAt: string;
  userId?: string;
}

export interface Client {
  id: string;
  leadId?: string;
  name: string;
  brand: Brand;
  contact: string;
  mail?: string;
  address?: string;
  businessName?: string;
  services: string[];
  status: 'Active' | 'Paused' | 'Churned';
  createdAt: string;
  userId?: string;
}

export interface Engagement {
  id: string;
  clientId: string;
  brand: Brand;
  type: 'Project' | 'Retainer';
  value: number;
  paymentTerms: 'Milestones' | 'Monthly' | 'Upfront';
  startDate: string;
  status: 'Active' | 'Completed' | 'On Hold';
  createdAt: string;
  userId?: string;
}

export interface BusinessPayment {
  id: string;
  clientId: string;
  engagementId: string;
  amount: number;
  date: string;
  invoiceReference: string;
  brand: Brand;
  createdAt: string;
  userId?: string;
}

export interface BusinessExpense {
  id: string;
  brand: Brand;
  category: 'Tools' | 'Ads' | 'Contractor' | 'Subscription' | 'Domain Purchase' | 'SSL Certificate' | 'Posting Subscription' | 'Other';
  amount: number;
  date: string;
  createdAt: string;
  userId?: string;
}

export interface Task {
  id: string;
  title: string;
  type: 'Agency Duty' | 'Client Work' | 'Admin' | 'Personal';
  brand?: Brand;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  recurrence: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  linkedClientId?: string;
  linkedLeadId?: string;
  isCompleted: boolean;
  createdAt: string;
  userId?: string;
}

export interface OwnerDraw {
  id: string;
  amount: number;
  date: string;
  createdAt: string;
  userId?: string;
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  services: string[];
  startDate: string;
  deadline: string;
  status: 'Not Started' | 'In Progress' | 'Under Review' | 'Completed';
  createdAt: string;
  userId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  clientId?: string;
  leadName?: string;
  date: string;
  time: string;
  reason?: string;
  createdAt: string;
  userId?: string;
}

export interface PulseData {
  personalIncome: PersonalIncome[];
  personalExpenses: PersonalExpense[];
  personalDebts: PersonalDebt[];
  leads: Lead[];
  clients: Client[];
  engagements: Engagement[];
  businessPayments: BusinessPayment[];
  businessExpenses: BusinessExpense[];
  tasks: Task[];
  ownerDraws: OwnerDraw[];
  projects: Project[];
  meetings: Meeting[];
}
