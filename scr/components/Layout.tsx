
import React from 'react';
import { 
  LayoutDashboard, Truck, Map, UserCircle, DollarSign, 
  Package, Menu, ShieldCheck, LogOut, ShieldAlert 
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, currentView, onNavigate, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'dealer', 'carrier', 'client'] },
    { id: 'admin-console', label: 'Admin Console', icon: ShieldAlert, roles: ['admin'] },
    { id: 'loadboard', label: 'Load Board', icon: Map, roles: ['admin', 'dealer', 'carrier'] },
    { id: 'my-loads', label: 'My Trips', icon: Package, roles: ['carrier'] },
    { id: 'fleet', label: 'My Fleet', icon: Truck, roles: ['carrier'] },
    { id: 'driver-active', label: 'Active Load', icon: Truck, roles: ['driver'] },
    { id: 'client-direct', label: 'My Shipments', icon: Package, roles: ['client'] },
    { id: 'finance', label: 'Finance', icon: DollarSign, roles: ['carrier', 'admin'] },
    { id: 'driver-profile', label: 'My Profile', icon: UserCircle, roles: ['driver'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
            AutoLogix AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">Hybrid TMS Platform</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon size={20} strokeWidth={1.5} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <span className="font-bold text-lg text-green-400">AutoLogix</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm p-4 flex flex-col gap-4 md:hidden">
            <div className="flex justify-end">
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">✕</button>
            </div>
            {filteredNav.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-4 p-4 text-lg font-medium text-slate-300 border-b border-slate-800"
              >
                <item.icon size={24} />
                {item.label}
              </button>
            ))}
            <button onClick={onLogout} className="flex items-center gap-4 p-4 text-lg font-medium text-red-400">
              <LogOut size={24} /> Sign Out
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;