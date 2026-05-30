import { Constituent, Donation, VolunteerLog, Staff, Report } from '../types';

// Mock data for initial state or when Firebase is not connected
let mock_constituents: Constituent[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', isBoardMember: false, tags: ['Donor', 'Volunteer'], createdAt: Date.now() - 100000000, updatedAt: Date.now() },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'active', isBoardMember: false, tags: ['Donor'], createdAt: Date.now() - 200000000, updatedAt: Date.now() },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', status: 'inactive', isBoardMember: true, tags: ['Board Member'], createdAt: Date.now() - 300000000, updatedAt: Date.now() }
];

let mock_donations: Donation[] = [
  { id: 'd1', constituentId: '1', amount: 500, currency: 'USD', method: 'check', timestamp: Date.now() - 5000000, note: 'Annual gala donation' },
  { id: 'd2', constituentId: '1', amount: 250, currency: 'USD', method: 'cash', timestamp: Date.now() - 25000000 },
  { id: 'd3', constituentId: '2', amount: 1000, currency: 'USD', method: 'stripe', timestamp: Date.now() - 10000000 }
];

let mock_logs: VolunteerLog[] = [
  { id: 'l1', constituentId: '1', checkIn: Date.now() - 3600000 * 5, checkOut: Date.now() - 3600000 * 2, hours: 3, status: 'completed', note: 'Kitchen shift' },
  { id: 'l2', constituentId: '1', checkIn: Date.now() - 3600000, status: 'active' } // One active session for testing kiosk
];

let mock_staff: Staff[] = [
  { id: 's1', name: 'Admin User', email: 'Admin', role: 'admin', status: 'active', password: 'Admin', createdAt: Date.now() }
];

// Helper to generate random date in last 3 years
const randomDate = (years: number = 3) => {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - years);
  return start.getTime() + Math.random() * (end.getTime() - start.getTime());
};

// Seed extended mock data
const seedMockData = () => {
  const surnames = ['Miller', 'Davis', 'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris'];
  const firstnames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
  
  // Generate 40 more constituents
  for (let i = 4; i <= 44; i++) {
    const fn = firstnames[Math.floor(Math.random() * firstnames.length)];
    const sn = surnames[Math.floor(Math.random() * surnames.length)];
    const createdAt = randomDate(4);
    mock_constituents.push({
      id: i.toString(),
      name: `${fn} ${sn}`,
      email: `${fn.toLowerCase()}.${sn.toLowerCase()}${i}@example.org`,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      isBoardMember: false,
      tags: Math.random() > 0.5 ? ['Donor'] : Math.random() > 0.5 ? ['Volunteer'] : ['Donor', 'Volunteer'],
      createdAt,
      updatedAt: createdAt + (Math.random() * (Date.now() - createdAt))
    });
  }

  // Generate 400 more donations over 3 years
  const methods: Donation['method'][] = ['stripe', 'paypal', 'check', 'cash'];
  for (let i = 0; i < 400; i++) {
    const constituent = mock_constituents[Math.floor(Math.random() * mock_constituents.length)];
    mock_donations.push({
      id: `seed_d_${i}`,
      constituentId: constituent.id,
      amount: Math.floor(Math.random() * 1000) + 10,
      currency: 'USD',
      method: methods[Math.floor(Math.random() * methods.length)],
      timestamp: randomDate(3),
      note: Math.random() > 0.8 ? 'Automatic seed donation' : undefined
    });
  }

  // Generate 800 more volunteer logs over 3 years
  for (let i = 0; i < 800; i++) {
    const constituent = mock_constituents.filter(c => c.tags.includes('Volunteer'))[Math.floor(Math.random() * 20)] || mock_constituents[0];
    const checkIn = randomDate(3);
    const hours = parseFloat((Math.random() * 6 + 1).toFixed(2));
    const checkOut = checkIn + (hours * 3600000);
    
    mock_logs.push({
      id: `seed_l_${i}`,
      constituentId: constituent.id,
      checkIn,
      checkOut: checkOut < Date.now() ? checkOut : undefined,
      hours: checkOut < Date.now() ? hours : undefined,
      status: checkOut < Date.now() ? 'completed' : 'active',
      note: Math.random() > 0.9 ? 'Service event' : undefined
    });
  }

  // Ensure only one active session per constituent if we generated multiple "active" ones randomly
  const activeIds = new Set();
  mock_logs = mock_logs.filter(l => {
    if (l.status === 'active') {
      if (activeIds.has(l.constituentId)) return false;
      activeIds.add(l.constituentId);
    }
    return true;
  });
};

seedMockData();

export async function getConstituentTags(constituentId: string, createdAt: number): Promise<string[]> {
  const tags: string[] = [];
  
  if (mock_donations.some(d => d.constituentId === constituentId)) {
    tags.push('Donor');
  }
  if (mock_logs.some(l => l.constituentId === constituentId)) {
    tags.push('Volunteer');
  }
  if (Date.now() - createdAt <= 30 * 24 * 60 * 60 * 1000) {
    tags.push('New');
  }
  
  return tags;
}

export const staffService = {
  async getAll(): Promise<Staff[]> {
    return mock_staff;
  },
  async getById(id: string): Promise<Staff | null> {
    return mock_staff.find(s => s.id === id) || null;
  },
  async create(data: Omit<Staff, 'id'>) {
    const newS = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mock_staff.push(newS);
    return newS;
  },
  async update(id: string, data: Partial<Staff>) {
    const index = mock_staff.findIndex(s => s.id === id);
    if (index !== -1) {
      mock_staff[index] = { ...mock_staff[index], ...data };
    }
  },
  async delete(id: string) {
    mock_staff = mock_staff.filter(s => s.id !== id);
  },
  async login(email: string, password: string): Promise<Staff | null> {
    const staff = mock_staff.find(s => s.email.toLowerCase() === email.toLowerCase() && s.password === password);
    if (staff) {
      localStorage.setItem('unify_user', JSON.stringify(staff));
      return staff;
    }
    return null;
  },
  async logout() {
    localStorage.removeItem('unify_user');
  },
  async verifyAdminPassword(password: string): Promise<boolean> {
    return mock_staff.some(s => s.role === 'admin' && s.password === password);
  },
  async getCurrentUser(): Promise<Staff | null> {
    const stored = localStorage.getItem('unify_user');
    if (stored) return JSON.parse(stored);
    return null;
  }
};

export const constituentService = {
  async search(searchTerm: string): Promise<Constituent[]> {
    return mock_constituents.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  async create(data: Omit<Constituent, 'id'>) {
    const newC = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mock_constituents.push(newC);
    return newC;
  },

  async getById(id: string): Promise<Constituent | null> {
    return mock_constituents.find(c => c.id === id) || null;
  },

  async update(id: string, data: Partial<Constituent>) {
    const index = mock_constituents.findIndex(c => c.id === id);
    if (index !== -1) {
      mock_constituents[index] = { ...mock_constituents[index], ...data, updatedAt: Date.now() };
    }
  }
};

export const donationService = {
  async listByConstituent(constituentId: string): Promise<Donation[]> {
    return mock_donations.filter(d => d.constituentId === constituentId).sort((a, b) => b.timestamp - a.timestamp);
  },

  async create(data: Omit<Donation, 'id'>) {
    const newD = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mock_donations.push(newD);
    return newD;
  },

  async updateDonation(id: string, data: Partial<Donation>) {
    const index = mock_donations.findIndex(d => d.id === id);
    if (index !== -1) {
      mock_donations[index] = { ...mock_donations[index], ...data };
    }
  },

  async deleteDonation(id: string) {
    mock_donations = mock_donations.filter(d => d.id !== id);
  },

  async getGrandTotal(): Promise<number> {
    return mock_donations.reduce((sum, d) => sum + d.amount, 0);
  },
  async listAll(): Promise<(Donation & { constituentName: string })[]> {
    return mock_donations.map(d => {
      const c = mock_constituents.find(cons => cons.id === d.constituentId);
      return { ...d, constituentName: c?.name || 'Unknown' };
    }).sort((a, b) => b.timestamp - a.timestamp);
  }
};

export const volunteerService = {
  async listLogsByConstituent(constituentId: string): Promise<VolunteerLog[]> {
    return mock_logs.filter(l => l.constituentId === constituentId).sort((a, b) => b.checkIn - a.checkIn);
  },
  async listAll(): Promise<(VolunteerLog & { constituentName: string })[]> {
    return mock_logs.map(l => {
      const c = mock_constituents.find(cons => cons.id === l.constituentId);
      return { ...l, constituentName: c?.name || 'Unknown' };
    }).sort((a, b) => b.checkIn - a.checkIn);
  },

  async checkIn(constituentId: string) {
    const newL: VolunteerLog = {
      id: Math.random().toString(36).substr(2, 9),
      constituentId,
      checkIn: Date.now(),
      status: 'active'
    };
    mock_logs.push(newL);
    return newL;
  },

  async checkOut(logId: string) {
    const index = mock_logs.findIndex(l => l.id === logId);
    if (index === -1) return;

    const log = mock_logs[index];
    const checkOut = Date.now();
    const hours = (checkOut - log.checkIn) / (1000 * 60 * 60);

    mock_logs[index] = {
      ...log,
      checkOut,
      hours: parseFloat(hours.toFixed(2)),
      status: 'completed'
    };
    return mock_logs[index];
  },

  async manualLog(constituentId: string, hours: number, date: number, note?: string) {
    const checkIn = date;
    const checkOut = date + (hours * 60 * 60 * 1000);
    const newL: VolunteerLog = {
      id: Math.random().toString(36).substr(2, 9),
      constituentId,
      checkIn,
      checkOut,
      hours: parseFloat(hours.toFixed(2)),
      status: 'completed',
      note
    };
    mock_logs.push(newL);
    return newL;
  },

  async updateLog(id: string, data: Partial<VolunteerLog>) {
    const index = mock_logs.findIndex(l => l.id === id);
    if (index !== -1) {
      mock_logs[index] = { ...mock_logs[index], ...data };
    }
  },

  async deleteLog(id: string) {
    mock_logs = mock_logs.filter(l => l.id !== id);
  },

  async getActiveSession(constituentId: string): Promise<VolunteerLog | null> {
    return mock_logs.find(l => l.constituentId === constituentId && l.status === 'active') || null;
  },

  async getActiveCount(): Promise<number> {
    return mock_logs.filter(l => l.status === 'active').length;
  },

  async getTotalHours(): Promise<number> {
    return mock_logs.reduce((sum, l) => sum + (l.hours || 0), 0);
  }
};

export const settingsService = {
  async getCurrency(): Promise<string> {
    return localStorage.getItem('unify_currency') || 'USD';
  },
  async setCurrency(currency: string) {
    localStorage.setItem('unify_currency', currency);
  },
  formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },
  formatCompactCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  },
  formatCompactNumber(num: number) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  }
};

let mock_reports: Report[] = [
  { id: 'r1', name: 'Recent Donations', type: 'donations', fields: ['constituentName', 'amount', 'method', 'timestamp'], visualization: 'table', createdAt: Date.now() },
  { id: 'r2', name: 'Volunteer Overview', type: 'volunteers', fields: ['constituentName', 'hours', 'status', 'checkIn'], visualization: 'table', createdAt: Date.now() }
];

export const reportService = {
  async getAll(): Promise<Report[]> {
    const custom = JSON.parse(localStorage.getItem('unify_reports') || '[]');
    return [...mock_reports, ...custom].sort((a, b) => b.createdAt - a.createdAt);
  },
  async create(report: Omit<Report, 'id' | 'createdAt'>) {
    const newReport: Report = {
      ...report,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    };
    const custom = JSON.parse(localStorage.getItem('unify_reports') || '[]');
    custom.push(newReport);
    localStorage.setItem('unify_reports', JSON.stringify(custom));
    return newReport;
  },
  async delete(id: string) {
    const custom = JSON.parse(localStorage.getItem('unify_reports') || '[]');
    const filtered = custom.filter((r: Report) => r.id !== id);
    localStorage.setItem('unify_reports', JSON.stringify(filtered));
  },
  async update(id: string, report: Partial<Report>) {
    const custom = JSON.parse(localStorage.getItem('unify_reports') || '[]');
    const index = custom.findIndex((r: Report) => r.id === id);
    if (index !== -1) {
      custom[index] = { ...custom[index], ...report };
      localStorage.setItem('unify_reports', JSON.stringify(custom));
    }
  }
};
