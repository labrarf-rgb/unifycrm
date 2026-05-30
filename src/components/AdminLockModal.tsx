import React, { useState } from 'react';
import { Lock, ShieldAlert, X } from 'lucide-react';
import { staffService } from '../services/db';

interface AdminLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  description: string;
}

export default function AdminLockModal({ isOpen, onClose, onSuccess, title, description }: AdminLockModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const isValid = await staffService.verifyAdminPassword(password);
    if (isValid) {
      onSuccess();
      setPassword('');
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full animate-in fade-in zoom-in duration-300 shadow-2xl border border-[#5A5A40]/20">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-[#5A5A40]/10 rounded-2xl flex items-center justify-center text-[#5A5A40]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <button onClick={onClose} className="p-2 text-[#5A5A40]/20 hover:text-[#5A5A40] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-bold brand-font italic text-[#5A5A40]">{title}</h2>
          <p className="text-sm text-[#5A5A40]/60">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Admin Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A40]/30" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                placeholder="••••••••"
                className={`w-full pl-12 pr-6 py-4 rounded-3xl bg-[#f5f5f0] border-2 outline-none transition-all ${
                  error ? 'border-red-200 bg-red-50 text-red-900 animate-shake' : 'border-transparent focus:bg-white focus:border-[#5A5A40]/20'
                }`}
              />
            </div>
            {error && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1">Invalid Admin Password</p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4a4a35] transition-all shadow-xl shadow-[#5A5A40]/20 flex items-center justify-center"
          >
            {loading ? 'Verifying...' : 'Authorize Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
