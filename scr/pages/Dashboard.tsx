import React from 'react';
import { TrendingUp, Truck, DollarSign, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

interface DashboardProps {
  userRole: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Good Morning, Alex</h1>
          <p className="text-slate-400">
            Here's what's happening with your fleet today.
          </p>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-sm text-slate-300">
          Last sync: Just now
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Active Loads',
            val: '12',
            icon: Truck,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Revenue (Oct)',
            val: '$45,200',
            icon: DollarSign,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
          {
            label: 'Avg Rate/Mile',
            val: '$2.45',
            icon: TrendingUp,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
          },
          {
            label: 'Issues',
            val: '1',
            icon: AlertCircle,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-2xl font-bold text-white">{stat.val}</span>
            </div>
            <div className="text-slate-500 font-medium text-sm">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
