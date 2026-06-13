import React, { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard,
  Truck,
  Map,
  DollarSign,
  Package,
  LogOut,
  ShieldAlert,
  AlertTriangle,
  Database,
  MapPin,
  Menu,
  X,
} from 'lucide-react';
import { UserRole } from '../types';
import { api } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  userRole,
  currentView,
  onNavigate,
  onLogout,
}) => {
  const [isOffline, setIsOffline] = useState(false);
  const [dbEngine, setDbEngine] = useState('PostgreSQL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const checkTimerRef = useRef<any>(null);

  const checkApi = async () => {
    const health = await api.getHealth();
    setIsOffline(!health);
    if (health && health.db) setDbEngine(health.db);
  };

  useEffect(() => {
    checkApi();
    checkTimerRef.current = setInterval(checkApi, 15000);
    return () => {
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
    };
  }, []);

  const Car = Truck;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'carrier'] },
    { id: 'tracking', label: 'My Vehicles', icon: MapPin, roles: ['client', 'dealer'] },
    { id: 'client-direct', label: 'Shipping Portal', icon: Car, roles: ['client', 'dealer'] },
    { id: 'loadboard', label: 'Market Board', icon: Map, roles: ['admin', 'carrier'] },
    { id: 'my-loads', label: 'Dispatcher', icon: Package, roles: ['carrier'] },
    { id: 'fleet', label: 'Fleet GPS', icon: Truck, roles: ['carrier'] },
    { id: 'finance', label: 'Accounting', icon: DollarSign, roles: ['carrier', 'admin'] },
    { id: 'admin-console', label: 'Control Center', icon: ShieldAlert, roles: ['admin'] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    onLogout();
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-slate-800 bg-slate-900/40 backdrop-blur-2xl shrink-0">
        <div className="p-8">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
            Car Route <span className="text-blue-500 underline decoration-2 underline-offset-4">OS</span>
          </h1>

          <div className="mt-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1">
                <Database size={10} className="text-emerald-500" /> {dbEngine}
              </span>
              <div
                className={`w-2 h-2 rounded-full ${
                  isOffline
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                }`}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate uppercase">
              {isOffline ? 'BACKEND UNREACHABLE' : 'OS NODE STABLE'}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                currentView === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
              }`}
              type="button"
            >
              <item.icon
                size={18}
                className={
                  currentView === item.id
                    ? 'text-white'
                    : 'text-slate-500 group-hover:text-blue-400'
                }
              />
              <span className="font-bold text-[11px] uppercase tracking-widest">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-4 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-2xl transition-all"
            type="button"
          >
            <LogOut size={18} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* MOBILE TOP BAR */}
        <div className="md:hidden border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 py-3 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h1 className="text-lg font-black text-white tracking-tight uppercase italic truncate">
              Car Route <span className="text-blue-500">OS</span>
            </h1>
            <div className="text-[9px] uppercase text-slate-500 flex items-center gap-1 mt-1">
              <Database size={10} className="text-emerald-500 shrink-0" />
              <span className="truncate">{dbEngine}</span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-white shrink-0"
            type="button"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[9999] bg-black/60" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] bg-slate-900 border-r border-slate-800 p-4 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-white uppercase italic">
                    Menu
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">
                    {isOffline ? 'Backend Unreachable' : 'OS Node Stable'}
                  </p>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 text-white"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto">
                {filteredNav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                      currentView === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 bg-slate-950 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    type="button"
                  >
                    <item.icon size={18} />
                    <span className="font-bold text-[11px] uppercase tracking-widest">
                      {item.label}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 bg-red-500/5"
                  type="button"
                >
                  <LogOut size={18} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">
                    Sign Out
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 p-4 md:p-10 custom-scrollbar">
          {isOffline && (
            <div className="sticky top-0 z-[90] w-full mb-4 md:mb-6">
              <div className="bg-red-600/90 backdrop-blur text-white p-3 md:p-4 rounded-2xl border border-red-400 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                  <span className="text-[10px] font-black uppercase italic tracking-tight break-words">
                    Backend Node Offline. Please check your Nginx proxy and Python service.
                  </span>
                </div>

                <button
                  onClick={checkApi}
                  className="bg-white/20 hover:bg-white/40 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest w-full md:w-auto"
                  type="button"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <div className="w-full max-w-6xl mx-auto min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
