import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Edit3, Save, X, Loader2 } from 'lucide-react';
import { DatabaseService } from '../services/database';
import { Trip, Transaction } from '../types';

const Finance: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get current owner ID from local storage for API calls
  const currentOwnerId = localStorage.getItem('autologix_user_id') || 'C-001';

  // Stats calculados
  const [stats, setStats] = useState({
    revenue: 0,
    pending: 0,
    expenses: 0,
    profit: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tripsData, txDataRaw] = await Promise.all([
          DatabaseService.getTrips(currentOwnerId),
          DatabaseService.getTransactions()
        ]);
        const txData = txDataRaw as Transaction[];
        setTrips(tripsData as Trip[]);
        setTransactions(txData);

        // Calcular totales basados en datos reales
        const revenue = txData
          .filter(t => t.type === 'CLIENT_PAYMENT' && t.status === 'COMPLETED')
          .reduce((sum, t) => sum + t.amount, 0);
          
        const pending = txData
          .filter(t => t.type === 'CARRIER_PAYOUT' && t.status === 'PENDING')
          .reduce((sum, t) => sum + t.amount, 0);

        // Aproximación de gastos basada en los viajes
        const expenses = (tripsData as Trip[]).reduce((sum, t) => sum + (t.financials.expenses || 0), 0);
        
        // Beneficio neto aproximado (Revenue - Payouts confirmados - Gastos)
        // Nota: Esto es simplificado para la UI
        const profit = revenue - pending - expenses;

        setStats({ revenue, pending, expenses, profit });

      } catch (error) {
        console.error("Error fetching finance data:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [currentOwnerId]);

  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [modalFinancials, setModalFinancials] = useState<{
    cash: number; zelle: number; check: number; ach: number; expenses: number;
  } | null>(null);

  const calculateDriverPay = (trip: Trip) => {
    const { driverPayMode, driverPayRate, grossTotal } = trip.financials;
    if (driverPayMode === 'PERCENTAGE') {
      return (grossTotal * (driverPayRate / 100));
    }
    return 500 * driverPayRate; // Default distance fallback si no hay ruta real
  };

  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    setModalFinancials({
      cash: trip.financials.paymentsReceived.cash,
      zelle: trip.financials.paymentsReceived.zelle,
      check: trip.financials.paymentsReceived.check,
      ach: trip.financials.paymentsReceived.ach,
      expenses: trip.financials.expenses
    });
  };

  const handleModalChange = (field: keyof typeof modalFinancials, value: string) => {
    if (!modalFinancials) return;
    setModalFinancials({ ...modalFinancials, [field]: Number(value) });
  };

  const saveFinancials = async () => {
    if (!editingTrip || !modalFinancials) return;

    const newGross = modalFinancials.cash + modalFinancials.zelle + modalFinancials.check + modalFinancials.ach;

    const updatedTrip: Trip = {
      ...editingTrip,
      financials: {
        ...editingTrip.financials,
        grossTotal: newGross,
        expenses: modalFinancials.expenses,
        paymentsReceived: {
          cash: modalFinancials.cash,
          zelle: modalFinancials.zelle,
          check: modalFinancials.check,
          ach: modalFinancials.ach
        }
      }
    };

    // Aquí llamaríamos a DatabaseService.updateTrip(updatedTrip) si existiera
    // Por ahora actualizamos el estado local para reflejar el cambio en la UI
    setTrips(trips.map(t => t.id === editingTrip.id ? updatedTrip : t));
    setEditingTrip(null);
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-green-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', amount: `$${stats.revenue.toLocaleString()}`, color: 'text-green-400' },
          { label: 'Pending Payouts', amount: `$${stats.pending.toLocaleString()}`, color: 'text-yellow-400' },
          { label: 'Trip Expenses', amount: `$${stats.expenses.toLocaleString()}`, color: 'text-red-400' },
          { label: 'Net Profit (Est)', amount: `$${stats.profit.toLocaleString()}`, color: 'text-white' },
        ].map((card, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="text-slate-500 text-sm mb-1">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.amount}</div>
          </div>
        ))}
      </div>

      {/* Report Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Trip & Payroll Report</h3>
          <button className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg hover:bg-green-500/20 transition-colors">
            <Download size={16} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200">
              <tr>
                <th className="p-4">Trip ID</th>
                <th className="p-4">Payment Breakdown</th>
                <th className="p-4 text-right">Gross Total</th>
                <th className="p-4 text-right">Driver Pay</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {trips.length === 0 ? (
                 <tr><td colSpan={5} className="p-8 text-center text-slate-500">No active trips found in system.</td></tr>
              ) : trips.map(trip => (
                <tr key={trip.id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-medium text-white">{trip.id}</td>
                  <td className="p-4">
                    <div className="flex gap-3 text-xs">
                      {trip.financials.paymentsReceived.cash > 0 && <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded">Cash: ${trip.financials.paymentsReceived.cash}</span>}
                      {trip.financials.paymentsReceived.check > 0 && <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded">Check: ${trip.financials.paymentsReceived.check}</span>}
                      {trip.financials.paymentsReceived.zelle > 0 && <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded">Zelle: ${trip.financials.paymentsReceived.zelle}</span>}
                      {trip.financials.paymentsReceived.ach > 0 && <span className="bg-slate-700 text-white px-2 py-1 rounded">ACH: ${trip.financials.paymentsReceived.ach}</span>}
                      {(trip.financials.grossTotal === 0) && <span className="text-slate-600 italic">No payments recorded</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-white">${trip.financials.grossTotal}</td>
                  <td className="p-4 text-right text-green-400 font-medium">
                    ${calculateDriverPay(trip).toFixed(2)}
                    <div className="text-[10px] text-slate-500">{trip.financials.driverPayMode}</div>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => openEditModal(trip)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <Edit3 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingTrip && modalFinancials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className="font-bold text-white text-lg">Record Payments: {editingTrip.id}</h3>
              <button onClick={() => setEditingTrip(null)} className="text-slate-500 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs text-green-400 font-bold uppercase mb-1">Cash Received</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded p-2 focus-within:border-green-500">
                  <span className="text-slate-500">$</span>
                  <input type="number" className="bg-transparent text-white outline-none w-full" value={modalFinancials.cash} onChange={e => handleModalChange('cash', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-purple-400 font-bold uppercase mb-1">Zelle / Venmo</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded p-2 focus-within:border-purple-500">
                  <span className="text-slate-500">$</span>
                  <input type="number" className="bg-transparent text-white outline-none w-full" value={modalFinancials.zelle} onChange={e => handleModalChange('zelle', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-blue-400 font-bold uppercase mb-1">Company Check</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded p-2 focus-within:border-blue-500">
                  <span className="text-slate-500">$</span>
                  <input type="number" className="bg-transparent text-white outline-none w-full" value={modalFinancials.check} onChange={e => handleModalChange('check', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold uppercase mb-1">ACH / Wire</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded p-2 focus-within:border-white">
                  <span className="text-slate-500">$</span>
                  <input type="number" className="bg-transparent text-white outline-none w-full" value={modalFinancials.ach} onChange={e => handleModalChange('ach', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="mb-6">
               <label className="block text-xs text-red-400 font-bold uppercase mb-1">Trip Expenses (Fuel/Tolls)</label>
               <div className="flex items-center gap-2 bg-red-900/10 border border-red-500/20 rounded p-3 focus-within:border-red-500">
                  <span className="text-red-400">$</span>
                  <input type="number" className="bg-transparent text-white outline-none w-full" value={modalFinancials.expenses} onChange={e => handleModalChange('expenses', e.target.value)} />
               </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg flex justify-between items-center border border-slate-800 mb-6">
               <span className="text-slate-400">New Gross Total:</span>
               <span className="text-2xl font-bold text-white">
                 ${(modalFinancials.cash + modalFinancials.zelle + modalFinancials.check + modalFinancials.ach).toFixed(2)}
               </span>
            </div>

            <button onClick={saveFinancials} className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Save size={18} /> Update Financials
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
