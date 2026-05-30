export interface Constituent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Donation {
  id: string;
  constituentId: string;
  amount: number;
  currency: string;
  method: 'cash' | 'check' | 'e-transfer' | 'stripe' | 'paypal';
  timestamp: number;
  note?: string;
}

export interface VolunteerLog {
  id: string;
  constituentId: string;
  checkIn: number;
  checkOut?: number;
  hours?: number;
  note?: string;
  status: 'active' | 'completed';
}

export interface KioskSession {
  id: string;
  constituentId: string;
  name: string;
  startTime: number;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'coordinator';
  status: 'active' | 'inactive';
  password?: string;
  createdAt: number;
}

export interface Report {
  id: string;
  name: string;
  type: 'donations' | 'volunteers';
  fields: string[];
  visualization: 'table' | 'bar' | 'line' | 'pie';
  createdAt: number;
}
