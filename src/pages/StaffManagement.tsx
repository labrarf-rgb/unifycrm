import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Shield, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Pencil,
  CheckCircle2,
  XCircle,
  LogOut
} from 'lucide-react';
import { staffService, settingsService } from '../services/db';
import { Staff } from '../types';

export default function StaffManagement() {
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [curr, all, currCurrency] = await Promise.all([
        staffService.getCurrentUser(),
        staffService.getAll(),
        settingsService.getCurrency()
      ]);
      setCurrentUser(curr);
      setAllStaff(all);
      setCurrency(currCurrency);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete yourself.");
      return;
    }
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      await staffService.delete(id);
      await loadData();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5A5A40]"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-12 space-y-12">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold brand-font italic text-[#5A5A40]">Settings & Staff</h1>
        <p className="text-[#5A5A40]/60 font-medium">Manage your profile and organization access levels.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Personal Profile */}
        <div className="lg:col-span-1 space-y-8">
          <section className="bg-white p-8 rounded-[2rem] border border-[#5A5A40]/10 shadow-sm space-y-8">
            <h2 className="text-xl font-bold brand-font italic text-[#5A5A40] border-b border-[#f5f5f0] pb-4">Your Profile</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!currentUser || isSaving) return;
              setIsSaving(true);
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const email = formData.get('email') as string;
              
              await staffService.update(currentUser.id, { name, email });
              await loadData();
              setIsSaving(false);
              alert("Profile updated successfully!");
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Full Name</label>
                <input name="name" type="text" defaultValue={currentUser?.name} required className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Email Address</label>
                <input name="email" type="email" defaultValue={currentUser?.email} required className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" />
              </div>
              <div className="pt-4 space-y-4">
                <button type="submit" disabled={isSaving} className="w-full py-4 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4a4a35] transition-all shadow-lg shadow-[#5A5A40]/20">
                  {isSaving ? 'Saving...' : 'Update Details'}
                </button>

                <button 
                  type="button"
                  onClick={async () => {
                    await staffService.logout();
                    // We use window.location.href to /login to ensure the entire app state reloads and App.tsx re-checks auth
                    window.location.href = '/login';
                  }}
                  className="w-full flex items-center justify-center py-4 text-red-500 hover:bg-red-50 rounded-full transition-all text-xs font-bold uppercase tracking-widest border border-red-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </form>
          </section>

          {/* Organization Settings */}
          {currentUser?.role === 'admin' && (
            <section className="bg-white p-8 rounded-[2rem] border border-[#5A5A40]/10 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
              <h2 className="text-xl font-bold brand-font italic text-[#5A5A40] border-b border-[#f5f5f0] pb-4">Organization Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Currency</label>
                  <select 
                    value={currency}
                    onChange={async (e) => {
                      const newCurrency = e.target.value;
                      setCurrency(newCurrency);
                      setIsSavingSettings(true);
                      await settingsService.setCurrency(newCurrency);
                      setIsSavingSettings(false);
                    }}
                    className="w-full px-6 py-4 rounded-3xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="PHP">PHP - Philippine Peso (₱)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                    <option value="GBP">GBP - British Pound (£)</option>
                    <option value="CAD">CAD - Canadian Dollar ($)</option>
                    <option value="AUD">AUD - Australian Dollar ($)</option>
                    <option value="JPY">JPY - Japanese Yen (¥)</option>
                    <option value="INR">INR - Indian Rupee (₹)</option>
                  </select>
                </div>
                {isSavingSettings && <p className="text-[9px] text-[#5A5A40]/40 font-bold uppercase tracking-widest text-center animate-pulse">Saving settings...</p>}
              </div>
            </section>
          )}
        </div>

        {/* Staff Management */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2rem] border border-[#5A5A40]/10 shadow-sm overflow-hidden">
            <div className="p-8 bg-[#fafafa] border-b border-[#5A5A40]/5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold brand-font italic text-[#5A5A40]">Organization Users</h2>
                <p className="text-[10px] uppercase font-bold text-[#5A5A40]/40 tracking-widest mt-1">Found {allStaff.length} Members</p>
              </div>
              {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-[#5A5A40] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#4a4a35] transition-all flex items-center shadow-lg shadow-[#5A5A40]/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff
                </button>
              )}
            </div>

            <div className="divide-y divide-[#f5f5f0]">
              {allStaff.map(staff => (
                <div key={staff.id} className="p-8 flex items-center justify-between hover:bg-[#f5f5f0]/30 transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#5A5A40]/5 rounded-full flex items-center justify-center text-[#5A5A40] brand-font italic text-lg border border-[#5A5A40]/10">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#2d2d2a]">{staff.name}</span>
                        {staff.role === 'admin' ? (
                          <ShieldCheck className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Shield className="w-4 h-4 text-[#5A5A40]/40" />
                        )}
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${staff.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                          {staff.role}
                        </span>
                      </div>
                      <p className="text-sm text-[#5A5A40]/60">{staff.email}</p>
                    </div>
                  </div>

                  {currentUser?.role === 'admin' && (
                    <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingStaff(staff);
                          setShowAddModal(true);
                        }}
                        className="p-3 bg-[#f5f5f0] text-[#5A5A40] rounded-full hover:bg-[#5A5A40] hover:text-white transition-all shadow-sm"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(staff.id)}
                        className={`p-3 bg-[#f5f5f0] text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm ${staff.id === currentUser.id ? 'opacity-20 cursor-not-allowed' : ''}`}
                        disabled={staff.id === currentUser.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full animate-in fade-in zoom-in duration-300 shadow-2xl">
            <h2 className="text-2xl font-bold brand-font italic text-[#5A5A40] mb-8">{editingStaff ? 'Edit' : 'Add'} Staff Member</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (isSaving) return;
              setIsSaving(true);
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const email = formData.get('email') as string;
              const role = formData.get('role') as 'admin' | 'coordinator';
              const status = formData.get('status') as 'active' | 'inactive';
              
              if (editingStaff) {
                await staffService.update(editingStaff.id, { name, email, role, status });
              } else {
                await staffService.create({
                  name,
                  email,
                  role,
                  status,
                  createdAt: Date.now()
                });
              }
              
              await loadData();
              setShowAddModal(false);
              setEditingStaff(null);
              setIsSaving(false);
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Full Name</label>
                <input name="name" type="text" defaultValue={editingStaff?.name} required autoFocus className="w-full px-6 py-4 rounded-3xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Email Address</label>
                <input name="email" type="email" defaultValue={editingStaff?.email} required className="w-full px-6 py-4 rounded-3xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Role</label>
                  <select name="role" defaultValue={editingStaff?.role || 'coordinator'} className="w-full px-6 py-4 rounded-3xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all appearance-none cursor-pointer">
                    <option value="coordinator">Coordinator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Status</label>
                  <select name="status" defaultValue={editingStaff?.status || 'active'} className="w-full px-6 py-4 rounded-3xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all appearance-none cursor-pointer">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingStaff(null); }} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-full font-bold hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4a4a35] transition-all shadow-lg shadow-[#5A5A40]/20">
                  {isSaving ? 'Processing...' : (editingStaff ? 'Save Changes' : 'Invite Staff')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
