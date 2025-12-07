import React, { useState } from 'react';
import { DollarSign, FileText, Download, Edit3 } from 'lucide-react';
import { MOCK_TRIPS } from '../constants';
import { Trip } from '../types';

const Finance: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const calculateDriverPay = (trip: Trip) => {
    const { driverPayMode, driverPayRate, grossTotal } = trip.financials;
    if (driverPayMode === 'PERCENTAGE') {
      return (grossTotal * (driverPayRate / 100));
    }
    // Simple mock logic for miles since miles are on the Load not Trip directly in mock
    return 1300 * driverPayRate; 
  };

  const handleUpdateFinancials = (trip: Trip, field: string, value: number) => {
    // In real app, this updates state properly
    const newTrips = trips.map(t => t.id === trip.id ? {
      ...t,
      financials: { ...t.financials, [field]: value }
    } : t);
    // For now we just close mock modal
    setEditingTrip(null);
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue (Oct)', amount: '$12,450', color: 'text-green-400' },
          { label: 'Pending Payouts', amount: '$3,200', color: 'text-yellow-400' },
          { label: 'Expenses', amount: '$4,100', color: 'text-red-400' },
          { label: 'Net Profit', amount: '$8,350', color: 'text-white' },
        ].map((card, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="text-slate-500 text-sm mb-1">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.amount}</div>
          </div>
        ))}
      </div>

      {/* Payroll Report */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Trip & Payroll Report</h3>
          <button className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg hover:bg-green-500/20 transition">
            <Download size={16} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200">
              <tr>
                <th className="p-4">Trip ID</th>
                <th className="p-4">Driver</th>
                <th className="p-4">Payment Breakdown</th>
                <th className="p-4 text-right">Total Gross</th>
                <th className="p-4 text-right">Driver Pay</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {trips.map(trip => (
                <tr key={trip.id} className="hover:bg-slate-800/50 transition">
                  <td className="p-4 font-medium text-white">{trip.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">D</div>
                       <span>{trip.driverIds.join(', ')}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1 text-xs">
                      {trip.financials.paymentsReceived.cash > 0 && <div>Cash: <span className="text-green-400">${trip.financials.paymentsReceived.cash}</span></div>}
                      {trip.financials.paymentsReceived.check > 0 && <div>Check: <span className="text-blue-400">${trip.financials.paymentsReceived.check}</span></div>}
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-white">${trip.financials.grossTotal}</td>
                  <td className="p-4 text-right text-green-400 font-medium">
                    ${calculateDriverPay(trip).toFixed(2)}
                    <div className="text-[10px] text-slate-500">
                      {trip.financials.driverPayMode === 'PERCENTAGE' ? `${trip.financials.driverPayRate}%` : `$${trip.financials.driverPayRate}/mi`}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => setEditingTrip(trip)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                      <Edit3 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal (Mock) */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96">
            <h3 className="font-bold text-white mb-4">Edit Financials: {editingTrip.id}</h3>
            <div className="space-y-3 mb-6">
              <label className="text-xs text-slate-400">Gross Total Adjustment</label>
              <input className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white" defaultValue={editingTrip.financials.grossTotal} />
            </div>
            <button onClick={() => setEditingTrip(null)} className="w-full bg-green-500 text-slate-900 font-bold py-2 rounded">Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
