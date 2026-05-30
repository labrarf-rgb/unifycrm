import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Clock, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Plus, 
  Calendar,
  ExternalLink,
  ChevronRight,
  Pencil,
  Trash2
} from 'lucide-react';
import { Constituent, Donation, VolunteerLog } from '../types';
import { constituentService, donationService, volunteerService, settingsService } from '../services/db';
import { format } from 'date-fns';

export default function ConstituentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAdmin = true; // Assume true for now as requested by user scenario
  const [constituent, setConstituent] = useState<Constituent | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [logs, setLogs] = useState<VolunteerLog[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [activeTab, setActiveTab] = useState<'donations' | 'volunteering'>('donations');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [editingLog, setEditingLog] = useState<VolunteerLog | null>(null);

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

  const loadData = async () => {
    if (!id) return;
    try {
      const [c, d, l, curr] = await Promise.all([
        constituentService.getById(id),
        donationService.listByConstituent(id),
        volunteerService.listLogsByConstituent(id),
        settingsService.getCurrency()
      ]);
      setConstituent(c);
      setDonations(d);
      setLogs(l);
      setCurrency(curr);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDonation = async (donationId: string) => {
    if (window.confirm('Delete this record?')) {
      await donationService.deleteDonation(donationId);
      await loadData();
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (window.confirm('Delete this record?')) {
      await volunteerService.deleteLog(logId);
      await loadData();
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (!constituent) return <div className="p-8 text-center text-red-500">Person not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-[10px] font-bold text-[#5A5A40]/60 hover:text-[#5A5A40] transition-colors mb-4 uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3 mr-1" />
        Exit Profile
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-[#5A5A40]/10 shadow-sm space-y-8 relative overflow-hidden">
            <div className="w-20 h-20 bg-[#f5f5f0] border border-[#5A5A40]/10 rounded-full flex items-center justify-center text-3xl brand-font italic text-[#5A5A40] mx-auto">
              {constituent.name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div className="space-y-3 text-center relative group">
              <h1 className="text-3xl font-bold brand-font italic leading-tight text-[#2d2d2a]">{constituent.name}</h1>
              <button 
                onClick={() => setShowEditProfileModal(true)}
                className="absolute -top-1 -right-1 p-2 bg-white border border-[#5A5A40]/10 rounded-full shadow-sm text-[#5A5A40]/40 hover:text-[#5A5A40] transition-all opacity-0 group-hover:opacity-100"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${constituent.status === 'active' ? 'bg-[#5A5A40] text-white shadow-sm shadow-[#5A5A40]/20' : 'bg-gray-100 text-gray-500'}`}>
                  {constituent.status}
                </span>
                {constituent.tags.map(t => (
                  <span key={t} className="px-3 py-1 bg-[#e8e8df] text-[#5A5A40] rounded-full text-[9px] font-bold uppercase tracking-widest">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 mt-6 border-t border-[#f5f5f0]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5A5A40]/40 font-bold uppercase text-[10px] tracking-widest">Email</span>
                <a href={`mailto:${constituent.email}`} className="text-[#2d2d2a] hover:text-[#5A5A40] transition-colors brand-font italic font-bold">
                  {constituent.email}
                </a>
              </div>
              {constituent.phone && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5A5A40]/40 font-bold uppercase text-[10px] tracking-widest">Phone</span>
                  <span className="text-[#2d2d2a] font-medium">{constituent.phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5A5A40]/40 font-bold uppercase text-[10px] tracking-widest">Total Donated</span>
                <span className="text-[#2d2d2a] font-bold brand-font italic text-lg truncate ml-2">
                  {settingsService.formatCompactCurrency(totalDonations, currency)}
                </span>
              </div>
            </div>

            <button 
              onClick={() => window.location.href = `mailto:${constituent.email}`}
              className="w-full py-4 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4a4a35] transition-all flex items-center justify-center shadow-xl shadow-[#5A5A40]/10"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Direct Email
            </button>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex gap-8 border-b border-[#5A5A40]/10 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('donations')}
              className={`pb-4 px-2 text-xl brand-font italic transition-all whitespace-nowrap border-b-2 ${
                activeTab === 'donations' ? 'border-[#5A5A40] text-[#5A5A40] opacity-100' : 'border-transparent text-[#5A5A40]/40 opacity-60 hover:opacity-100'
              }`}
            >
              Donation History
            </button>
            <button
              onClick={() => setActiveTab('volunteering')}
              className={`pb-4 px-2 text-xl brand-font italic transition-all whitespace-nowrap border-b-2 ${
                activeTab === 'volunteering' ? 'border-[#5A5A40] text-[#5A5A40] opacity-100' : 'border-transparent text-[#5A5A40]/40 opacity-60 hover:opacity-100'
              }`}
            >
              Volunteer Logs
            </button>
          </div>

          <div className="bg-white rounded-[2rem] border border-[#5A5A40]/10 shadow-sm min-h-[500px] overflow-hidden flex flex-col">
            {activeTab === 'donations' ? (
              <>
                <div className="p-6 bg-[#fafafa] border-b border-[#5A5A40]/5 flex justify-between items-center">
                  <h3 className="font-bold text-[#5A5A40] brand-font italic">Financial Ledger</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowDonationModal(true)}
                      className="px-4 py-2 bg-[#5A5A40] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#4a4a35] transition-all flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Record
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#fcfcfa]">
                        <th className="col-header">Date</th>
                        <th className="col-header">Method</th>
                        <th className="col-header text-right">Amount</th>
                        <th className="col-header w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {donations.length > 0 ? (
                        donations.map(d => (
                          <tr key={d.id} className="hover:bg-[#f5f5f0]/30 transition-colors group">
                            <td className="px-6 py-5 text-sm text-[#2d2d2a] font-medium">{format(d.timestamp, 'MMM dd, yyyy')}</td>
                            <td className="px-6 py-5 text-[10px] uppercase font-bold text-[#5A5A40]/60 tracking-widest">{d.method}</td>
                            <td className="px-6 py-5 text-right font-bold brand-font italic text-[#2d2d2a] text-lg">
                              {settingsService.formatCurrency(d.amount, currency)}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setEditingDonation(d);
                                    setShowDonationModal(true);
                                  }}
                                  className="p-1 px-2 text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {isAdmin && (
                                  <button 
                                    onClick={() => handleDeleteDonation(d.id)}
                                    className="p-1 px-2 text-red-200 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-20 text-center text-[#5A5A40]/40 italic font-serif">No donations recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 bg-[#fafafa] border-b border-[#5A5A40]/5 flex justify-between items-center">
                  <h3 className="font-bold text-[#5A5A40] brand-font italic">Service Logs</h3>
                  <button 
                    onClick={() => setShowLogModal(true)}
                    className="px-4 py-2 bg-[#5A5A40] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#4a4a35] transition-all flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Log Hours
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#fcfcfa]">
                        <th className="col-header">Date</th>
                        <th className="col-header">Service Time</th>
                        <th className="col-header text-right">Duration</th>
                        <th className="col-header w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {logs.length > 0 ? (
                        logs.map(l => (
                          <tr key={l.id} className="hover:bg-[#f5f5f0]/30 transition-colors group">
                            <td className="px-6 py-5 text-sm text-[#2d2d2a] font-medium">{format(l.checkIn, 'MMM dd, yyyy')}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center text-xs text-[#5A5A40]/60 space-x-2 font-bold uppercase tracking-tighter">
                                <span>{format(l.checkIn, 'HH:mm')}</span>
                                <ChevronRight className="w-3 h-3" />
                                <span>{l.checkOut ? format(l.checkOut, 'HH:mm') : 'Active'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right font-bold brand-font italic text-[#2d2d2a] text-lg truncate">
                              {settingsService.formatCompactNumber(l.hours || 0)} hrs
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setEditingLog(l);
                                    setShowLogModal(true);
                                  }}
                                  className="p-1 px-2 text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {isAdmin && (
                                  <button 
                                    onClick={() => handleDeleteLog(l.id)}
                                    className="p-1 px-2 text-red-200 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-20 text-center text-[#5A5A40]/40 italic font-serif">No service logs recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showDonationModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full animate-in fade-in zoom-in duration-300 shadow-2xl">
            <h2 className="text-2xl font-bold brand-font italic text-[#5A5A40] mb-6">{editingDonation ? 'Edit' : 'Record'} Donation</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (isSaving) return;
              setIsSaving(true);
              const formData = new FormData(e.currentTarget);
              const amountStr = (formData.get('amount') as string).replace(/,/g, '');
              const amount = parseFloat(amountStr);
              const method = formData.get('method') as any;
              const dateStr = formData.get('date') as string;
              const date = new Date(dateStr).getTime();
              
              if (id && amount > 0 && !isNaN(date)) {
                if (editingDonation) {
                  await donationService.updateDonation(editingDonation.id, {
                    amount,
                    method,
                    timestamp: date
                  });
                } else {
                  await donationService.create({
                    constituentId: id,
                    amount,
                    currency: 'USD',
                    method,
                    timestamp: date
                  });
                }
                await loadData();
                setShowDonationModal(false);
                setEditingDonation(null);
              }
              setIsSaving(false);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Amount ({currency})</label>
                <input 
                  name="amount" 
                  type="text" 
                  inputMode="decimal"
                  defaultValue={editingDonation?.amount} 
                  required 
                  autoFocus 
                  placeholder="0.00"
                  className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Date</label>
                <input name="date" type="date" defaultValue={new Date(editingDonation?.timestamp || Date.now()).toISOString().split('T')[0]} required className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Method</label>
                <select name="method" defaultValue={editingDonation?.method || 'cash'} className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all appearance-none cursor-pointer">
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="e-transfer">E-Transfer</option>
                  <option value="stripe">Stripe / Online</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setShowDonationModal(false); setEditingDonation(null); }} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-full font-bold hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4a4a35] transition-all shadow-lg shadow-[#5A5A40]/20">
                  {isSaving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full animate-in fade-in zoom-in duration-300 shadow-2xl">
            <h2 className="text-2xl font-bold brand-font italic text-[#5A5A40] mb-6">{editingLog ? 'Edit' : 'Log'} Service Hours</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (isSaving) return;
              setIsSaving(true);
              const formData = new FormData(e.currentTarget);
              const hoursStr = (formData.get('hours') as string).replace(/,/g, '');
              const hours = parseFloat(hoursStr);
              const dateStr = formData.get('date') as string;
              const date = new Date(dateStr).getTime();
              
              if (id && hours > 0 && !isNaN(date)) {
                if (editingLog) {
                  await volunteerService.updateLog(editingLog.id, {
                    hours,
                    checkIn: date,
                    checkOut: date + (hours * 1000 * 60 * 60)
                  });
                } else {
                  await volunteerService.manualLog(id, hours, date);
                }
                await loadData();
                setShowLogModal(false);
                setEditingLog(null);
              }
              setIsSaving(false);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Hours Worked</label>
                <input 
                  name="hours" 
                  type="text" 
                  inputMode="decimal"
                  defaultValue={editingLog?.hours} 
                  required 
                  autoFocus 
                  placeholder="0.00"
                  className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Date of Service</label>
                <input name="date" type="date" defaultValue={new Date(editingLog?.checkIn || Date.now()).toISOString().split('T')[0]} required className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setShowLogModal(false); setEditingLog(null); }} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-full font-bold hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4a4a35] transition-all shadow-lg shadow-[#5A5A40]/20">
                  {isSaving ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full animate-in fade-in zoom-in duration-300 shadow-2xl">
            <h2 className="text-2xl font-bold brand-font italic text-[#5A5A40] mb-6">Edit Profile</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (isSaving) return;
              setIsSaving(true);
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const email = formData.get('email') as string;
              const phone = formData.get('phone') as string;
              
              if (id && name && email) {
                await constituentService.update(id, { name, email, phone });
                await loadData();
                setShowEditProfileModal(false);
              }
              setIsSaving(false);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Full Name</label>
                <input name="name" type="text" defaultValue={constituent.name} required autoFocus className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Email Address</label>
                <input name="email" type="email" defaultValue={constituent.email} required className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Phone Number (Optional)</label>
                <input name="phone" type="tel" defaultValue={constituent.phone} className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEditProfileModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-full font-bold hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4a4a35] transition-all shadow-lg shadow-[#5A5A40]/20">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
