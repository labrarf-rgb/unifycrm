import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, User, AlertCircle } from 'lucide-react';
import { staffService } from '../services/db';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const checkUser = async () => {
      const user = await staffService.getCurrentUser();
      if (user) navigate('/');
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await staffService.login(email, password);
      if (user) {
        window.location.href = '/';
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[3rem] shadow-xl border border-[#5A5A40]/10">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#5A5A40] rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="text-white w-10 h-10 fill-current" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold brand-font text-[#5A5A40]">UnifyCRM</h1>
            <p className="text-[#5A5A40]/60 uppercase tracking-widest font-bold text-[10px]">Staff Authentication</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 p-4 rounded-2xl flex items-center text-red-800 text-sm font-serif italic border border-red-100">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Staff ID / Email</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A40]/30" />
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your ID"
                  required
                  className="w-full pl-12 pr-6 py-4 rounded-3xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all placeholder:text-[#5A5A40]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Secret Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A40]/30" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-6 py-4 rounded-3xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all placeholder:text-[#5A5A40]/20"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4a4a35] transition-all shadow-xl shadow-[#5A5A40]/10 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In Now'}
          </button>
        </form>

        <div className="bg-[#e8e8df] text-[#5A5A40] rounded-2xl p-4 text-center text-xs font-bold">
          <p className="uppercase tracking-widest text-[10px] text-[#5A5A40]/60 mb-1">Demo Access</p>
          <p>This is a demo instance. Use <span className="font-bold">Admin</span> / <span className="font-bold">Admin</span> to sign in.</p>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-[#5A5A40]/40 font-bold uppercase tracking-widest">Enterprise Access Protocol v4.0</p>
        </div>
      </div>
    </div>
  );
}
