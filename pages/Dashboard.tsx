import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Truck, DollarSign, Activity, Zap, Globe, BarChart3, Loader2, MapPin, Database, ShieldCheck
} from 'lucide-react';
import { UserRole } from '../types';
import { DatabaseService } from '../services/database';

const Dashboard: React.FC<{ userRole: UserRole }> = ({ userRole }) => {
  const [stats, setStats] = useState({ fleet: 0, market: 0, trips: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const ownerId = localStorage.getItem('autologix_user_id') || '';

  const fetchStats = async () => {
    try {
      const [trucks, market] = await Promise.all([
        DatabaseService.getTrucks(ownerId),
        DatabaseService.getMarketLoads()
      ]);
      setStats({
        fleet: trucks?.length || 0,
        market: market?.length || 0,
        trips: (trucks || []).filter((t: any) => t.status === 'ON_TRIP').length,
        revenue: (market || []).reduce((acc: number, curr: any) => acc + (curr.price || 0), 0) / 10
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, [ownerId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-blue-500" size={48} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Syncing Production Data...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">Control <span className="text-blue-500">Center</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
            <Database size={12} className="text-emerald-500" /> PostgreSQL Active • Node: Gunicorn/Uvicorn
          </p>
        </div>
        <div className="hidden md:flex gap-4">
           <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500"><ShieldCheck size={20}/></div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase">System Status</p>
                <p className="text-[11px] font-bold text-white uppercase">Operational</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Fleet Units" value={stats.fleet} icon={Truck} color="blue" sub="Super Dispatch Inventory" />
        <StatCard label="Market Active" value={stats.market} icon={Globe} color="purple" sub="Central Dispatch Loads" />
        <StatCard label="Active Trips" value={stats.trips} icon={Activity} color="emerald" sub="Real-time Monitoring" />
        <StatCard label="Gross Volume" value={`$${stats.revenue.toLocaleString()}`} icon={DollarSign} color="blue" sub="Node Transactions" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] -z-10 group-hover:bg-blue-500/10 transition-all duration-1000"></div>
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-2"><BarChart3 size={14}/> Fleet Performance Node</h3>
          <div className="h-64 flex items-end gap-3 px-2">
            {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-slate-800/40 rounded-t-xl relative border border-white/5 overflow-hidden group/bar" style={{ height: `${h}%` }}>
                <div className="absolute bottom-0 w-full bg-blue-600/20 group-hover/bar:bg-blue-600 transition-all duration-500 h-full"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Node Audit Log</h3>
          <div className="space-y-6">
            {[
              { msg: 'Truck 101 reached Miami', t: '2m ago', c: 'text-emerald-500' },
              { msg: 'New bid on Load #992', t: '15m ago', c: 'text-blue-500' },
              { msg: 'System backup complete', t: '1h ago', c: 'text-slate-500' },
              { msg: 'Inspection AI Verified', t: '3h ago', c: 'text-purple-500' }
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${log.c.replace('text', 'bg')}`}></div>
                <div>
                  <p className="text-[11px] font-bold text-slate-200">{log.msg}</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase mt-0.5">{log.t}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, sub }: any) => {
  const colors: any = { 
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20', 
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', 
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20' 
  };
  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl group hover:border-blue-500/40 transition-all relative overflow-hidden">
      <div className={`p-4 rounded-2xl inline-block mb-6 ${colors[color]}`}><Icon size={28} /></div>
      <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest mb-1">{label}</p>
      <p className="text-4xl font-black text-white tracking-tighter italic">{value}</p>
      <p className="text-[8px] font-bold text-slate-700 uppercase mt-4">{sub}</p>
    </div>
  );
};

export default Dashboard;
