// FILE: /app/crm/types/index.ts

export interface AppointmentHistoryItem {
  _id: string;
  id: string;
  service: string;
  date: string;
  status: string;
  services: string[];
  totalAmount: number;
  stylistName: string;
}

export interface MembershipUIDetails {
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface CrmCustomer {
  isMember: any;
  id: string;
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  createdAt?: string;
  status?: 'Active' | 'Inactive' | 'New';
  gender?: 'male' | 'female' | 'other'; // Added gender
  appointmentHistory?: AppointmentHistoryItem[];
  currentMembership?: MembershipUIDetails | null;
  loyaltyPoints?: number;
  membershipBarcode?: string; // Added membership barcode
}

export interface MembershipPlanFE {
  _id: string;
  id: string;
  name: string;
  price: number;
  durationDays: number;
}

export interface AddCustomerFormData {
  name: string;
  email: string;
  phoneNumber: string;
  gender?: 'male' | 'female' | 'other'; // Added gender
}

// Pagination details from the API
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCustomers: number;
}