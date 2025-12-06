
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LoadBoard from './pages/LoadBoard';
import MyLoads from './pages/MyLoads';
import FleetManagement from './pages/FleetManagement';
import DriverActiveLoad from './pages/DriverActiveLoad';
import ClientDirect from './pages/ClientDirect';
import Finance from './pages/Finance';
import CarrierRegistration from './pages/CarrierRegistration';
import ClientRegistration from './pages/ClientRegistration';
import DealerRegistration from './pages/DealerRegistration';
import DriverProfile from './pages/DriverProfile';
import AdminConsole from './pages/AdminConsole';
import { UserRole, RegistrationRole } from './types';
import { Truck, User, Building2, UserCircle, LogIn, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  // Simple auth state simulation
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('carrier'); // Default for demo
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Registration State
  const [registerRole, setRegisterRole] = useState<RegistrationRole>(null);

  // Handlers for Registration
  const closeRegistration = () => setRegisterRole(null);
  const completeRegistration = (role: UserRole) => {
    setRegisterRole(null);
    setUserRole(role);
    setIsAuthenticated(true);
    if (role === 'driver') setCurrentView('driver-active');
    else if (role === 'client') setCurrentView('client-direct');
    else setCurrentView('dashboard');
  };

  // Render Registration Screens based on selection
  if (registerRole === 'carrier') return <CarrierRegistration onComplete={() => completeRegistration('carrier')} />;
  if (registerRole === 'client') return <ClientRegistration onComplete={() => completeRegistration('client')} onCancel={closeRegistration} />;
  if (registerRole === 'dealer') return <DealerRegistration onComplete={() => completeRegistration('dealer')} onCancel={closeRegistration} />;

  // Login Screen (Simulated)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full grid md:grid-cols-2 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Left: Login Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2">AutoLogix AI</h1>
              <p className="text-slate-400">Logistics ecosystem for everyone.</p>
            </div>
            
            <div className="space-y-3 mb-8">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Quick Login (Demo)</h3>
              <button onClick={() => { setUserRole('carrier'); setIsAuthenticated(true); setCurrentView('dashboard'); }} className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-medium transition-colors border border-slate-700/50 hover:border-green-500/50 group">
                <div className="p-2 bg-slate-900 rounded-lg text-green-400 group-hover:bg-green-500 group-hover:text-slate-900 transition-colors"><Truck size={20} /></div>
                <span>Login as Carrier</span>
              </button>
              <button onClick={() => { setUserRole('driver'); setIsAuthenticated(true); setCurrentView('driver-active'); }} className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-medium transition-colors border border-slate-700/50 hover:border-orange-500/50 group">
                <div className="p-2 bg-slate-900 rounded-lg text-orange-400 group-hover:bg-orange-500 group-hover:text-slate-900 transition-colors"><UserCircle size={20} /></div>
                <span>Login as Driver</span>
              </button>
              <button onClick={() => { setUserRole('client'); setIsAuthenticated(true); setCurrentView('client-direct'); }} className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-medium transition-colors border border-slate-700/50 hover:border-blue-500/50 group">
                 <div className="p-2 bg-slate-900 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-900 transition-colors"><User size={20} /></div>
                 <span>Login as Client</span>
              </button>
              
              {/* ADMIN BUTTON */}
              <button onClick={() => { setUserRole('admin'); setIsAuthenticated(true); setCurrentView('admin-console'); }} className="w-full flex items-center gap-3 bg-red-950/30 hover:bg-red-950/50 text-red-200 p-2 rounded-lg text-sm font-medium transition-colors border border-red-900/50 mt-4 justify-center">
                 <ShieldCheck size={16} /> Login as Admin
              </button>
            </div>
          </div>

          {/* Right: Registration Hub */}
          <div className="bg-slate-950 p-8 md:p-12 flex flex-col justify-center border-l border-slate-800">
             <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>
             <p className="text-slate-400 mb-6">New here? Select your role to get started with the network.</p>
             
             <div className="grid grid-cols-1 gap-4">
                <button onClick={() => setRegisterRole('client')} className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group text-left">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><User size={20} /></div>
                  <div>
                    <div className="font-bold text-white group-hover:text-blue-400">Private Client</div>
                    <div className="text-xs text-slate-500">I want to ship my car</div>
                  </div>
                </button>

                <button onClick={() => setRegisterRole('carrier')} className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 hover:border-green-500/50 hover:bg-green-500/5 transition-all group text-left">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform"><Truck size={20} /></div>
                  <div>
                    <div className="font-bold text-white group-hover:text-green-400">Carrier Company</div>
                    <div className="text-xs text-slate-500">I have trucks and haul cars</div>
                  </div>
                </button>

                <button onClick={() => setRegisterRole('dealer')} className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group text-left">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform"><Building2 size={20} /></div>
                  <div>
                    <div className="font-bold text-white group-hover:text-purple-400">Dealer or Broker</div>
                    <div className="text-xs text-slate-500">I need to move inventory</div>
                  </div>
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App Layout
  return (
    <Layout 
      userRole={userRole} 
      currentView={currentView} 
      onNavigate={setCurrentView}
      onLogout={() => setIsAuthenticated(false)}
    >
      {currentView === 'dashboard' && <Dashboard userRole={userRole} />}
      {currentView === 'admin-console' && <AdminConsole />}
      {currentView === 'loadboard' && <LoadBoard />}
      {currentView === 'my-loads' && <MyLoads />}
      {currentView === 'fleet' && <FleetManagement />}
      {currentView === 'driver-active' && <DriverActiveLoad />}
      {currentView === 'client-direct' && <ClientDirect />}
      {currentView === 'finance' && <Finance />}
      {currentView === 'driver-profile' && <DriverProfile />}
    </Layout>
  );
};

export default App;