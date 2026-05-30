import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Clock, 
  LayoutDashboard, 
  Heart,
  Settings,
  Mail
} from 'lucide-react';
import { staffService } from './services/db';
import { Staff } from './types';
import Dashboard from './pages/Dashboard';
import ConstituentProfile from './pages/ConstituentProfile';
import Kiosk from './pages/Kiosk';
import StaffManagement from './pages/StaffManagement';
import Login from './pages/Login';
import Reports from './pages/Reports';
import AdminLockModal from './components/AdminLockModal';

function Sidebar({ user }: { user: Staff | null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showKioskLock, setShowKioskLock] = useState(false);
  const isKiosk = location.pathname === '/kiosk';
  const isLogin = location.pathname === '/login';

  if (isKiosk || isLogin || !user) return null;

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/reports', icon: BarChart3, label: 'Reporting' },
    { to: '/kiosk', icon: Clock, label: 'Kiosk Mode', isAdminOnly: true },
  ];

  return (
    <>
      <aside className="w-64 bg-white border-r border-[#5A5A40]/10 flex flex-col h-screen sticky top-0 hidden md:flex">
        <div className="p-8">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <Heart className="text-white w-6 h-6 fill-current" />
            </div>
            <span className="text-xl font-bold brand-font text-[#5A5A40]">UnifyCRM</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <button
                key={link.to}
                onClick={() => {
                  if (link.isAdminOnly) {
                    setShowKioskLock(true);
                  } else {
                    navigate(link.to);
                  }
                }}
                className={`w-full flex items-center px-4 py-3 rounded-2xl transition-all font-medium ${
                  isActive 
                    ? 'bg-[#5A5A40]/10 text-[#5A5A40]' 
                    : 'text-[#2d2d2a]/60 hover:bg-gray-50 hover:text-[#2d2d2a]'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#5A5A40]' : 'opacity-40'}`} />
                <span className={isActive ? 'brand-font italic' : ''}>{link.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#5A5A40]/10 flex flex-col gap-3">
          <Link 
            to="/settings"
            className={`bg-[#f5f5f0] p-4 rounded-3xl flex items-center space-x-3 border transition-all hover:bg-white hover:shadow-xl hover:shadow-[#5A5A40]/5 group ${
              location.pathname === '/settings' ? 'border-[#5A5A40] bg-white' : 'border-[#5A5A40]/5'
            }`}
          >
            <div className="w-10 h-10 bg-[#8a8a6f]/20 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[#5A5A40] group-hover:scale-110 transition-transform">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-[#2d2d2a] truncate">{user.name}</p>
              <p className="text-[10px] uppercase font-bold text-[#5A5A40]/60 tracking-widest">{user.role}</p>
            </div>
          </Link>
        </div>
      </aside>

      <AdminLockModal 
        isOpen={showKioskLock}
        onClose={() => setShowKioskLock(false)}
        onSuccess={() => {
          setShowKioskLock(false);
          navigate('/kiosk');
        }}
        title="Activate Kiosk"
        description="Please provide your admin credentials to lock the system into kiosk mode."
      />
    </>
  );
}

function MobileNav({ user }: { user: Staff | null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showKioskLock, setShowKioskLock] = useState(false);
  const isKiosk = location.pathname === '/kiosk';
  const isLogin = location.pathname === '/login';
  if (isKiosk || isLogin || !user) return null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#5A5A40]/10 px-6 py-3 flex items-center justify-around md:hidden z-50">
        <Link to="/" className="p-2 text-[#5A5A40]"><LayoutDashboard className="w-6 h-6" /></Link>
        <Link to="/reports" className="p-2 text-[#5A5A40]/40"><BarChart3 className="w-6 h-6" /></Link>
        <button onClick={() => setShowKioskLock(true)} className="p-2 text-[#5A5A40]/40"><Clock className="w-6 h-6" /></button>
        <Link to="/settings" className="p-2 text-[#5A5A40]/40"><Users className="w-6 h-6" /></Link>
      </nav>

      <AdminLockModal 
        isOpen={showKioskLock}
        onClose={() => setShowKioskLock(false)}
        onSuccess={() => {
          setShowKioskLock(false);
          navigate('/kiosk');
        }}
        title="Activate Kiosk"
        description="Please provide your admin credentials to lock the system into kiosk mode."
      />
    </>
  );
}

export default function App() {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const u = await staffService.getCurrentUser();
      setUser(u);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f5f5f0]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5A5A40]"></div>
    </div>
  );

  return (
    <Router>
      <div className="flex min-h-screen bg-[#f5f5f0]">
        <Sidebar user={user} />
        <main className="flex-1 pb-20 md:pb-0">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/kiosk" element={<Kiosk />} />
            
            <Route 
              path="/" 
              element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/constituent/:id" 
              element={user ? <ConstituentProfile /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/settings" 
              element={user ? <StaffManagement /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/reports" 
              element={user ? <Reports /> : <Navigate to="/login" replace />} 
            />
          </Routes>
        </main>
        <MobileNav user={user} />
      </div>
    </Router>
  );
}
