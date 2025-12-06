
import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, FileText, AlertTriangle, Search, Eye, Building2, User, DollarSign, Truck, Users, Star, Lock, Unlock, RefreshCcw } from 'lucide-react';
import { MOCK_PENDING_APPLICATIONS, MOCK_DISPUTES, MOCK_ALL_USERS, MOCK_TRANSACTIONS } from '../constants';
import { CarrierApplication, Dispute, AdminUserView, Transaction } from '../types';

const AdminConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'verifications' | 'finance' | 'rankings' | 'disputes'>('users');
  
  // Data States
  const [users, setUsers] = useState<AdminUserView[]>(MOCK_ALL_USERS);
  const [applications, setApplications] = useState<CarrierApplication[]>(MOCK_PENDING_APPLICATIONS);
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  // Filters
  const [userFilter, setUserFilter] = useState<'ALL' | 'CARRIER' | 'DEALER' | 'CLIENT'>('ALL');

  // Modal State
  const [viewingApp, setViewingApp] = useState<CarrierApplication | null>(null);

  // --- ACTIONS ---

  // User Management
  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' };
      }
      return u;
    }));
  };

  // Ranking Management
  const updateRating = (userId: string, newRating: number) => {
    setUsers(users.map(u => u.id === userId ? { ...u, rating: newRating } : u));
  };

  // Verification
  const handleVerify = (id: string, approved: boolean) => {
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, status: approved ? 'ACTIVE' : 'REJECTED' } : app
    ));
    setViewingApp(null);
    alert(approved ? "Carrier Approved & Activation Email Sent" : "Carrier Application Rejected");
  };

  // Finance Actions
  const handleForcePayout = (txId: string) => {
    if (window.confirm("Force immediate payout release to carrier? This bypasses the 24h hold.")) {
      setTransactions(transactions.map(t => t.id === txId ? { ...t, status: 'COMPLETED' } : t));
    }
  };

  const handleForceRefund = (txId: string) => {
    if (window.confirm("Refund client immediately? This will reverse the transaction.")) {
      setTransactions(transactions.map(t => t.id === txId ? { ...t, type: 'REFUND', status: 'COMPLETED' } : t));
    }
  };

  // Dispute Resolution
  const handleResolveDispute = (id: string, action: 'REFUND' | 'RELEASE') => {
    setDisputes(prev => prev.map(d => 
      d.id === id ? { ...d, status: action === 'REFUND' ? 'RESOLVED_REFUND' : 'RESOLVED_PAYOUT' } : d
    ));
    alert(action === 'REFUND' ? "Escrow Refunded to Client" : "Funds Released to Carrier");
  };

  // --- HELPERS ---
  const filteredUsers = users.filter(u => userFilter === 'ALL' || u.role.toUpperCase() === userFilter);

  return (
    <div className="space-y-6">
      {/* HEADER & NAV */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <ShieldCheck className="text-green-500" /> Master Control Tower
           </h2>
           <p className="text-slate-400 text-sm">System-wide administration.</p>
        </div>
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 overflow-x-auto max-w-full">
           {['users', 'verifications', 'finance', 'rankings', 'disputes'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize whitespace-nowrap ${
                 activeTab === tab ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex gap-2 mb-4">
             {['ALL', 'CARRIER', 'DEALER', 'CLIENT'].map(f => (
               <button 
                 key={f}
                 onClick={() => setUserFilter(f as any)}
                 className={`px-3 py-1 rounded-full text-xs font-bold ${
                   userFilter === f ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                 }`}
               >
                 {f}
               </button>
             ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
             <table className="w-full text-left text-sm text-slate-400">
               <thead className="bg-slate-950 text-slate-200">
                 <tr>
                   <th className="p-4">User / Company</th>
                   <th className="p-4">Role</th>
                   <th className="p-4">Contact</th>
                   <th className="p-4">Joined</th>
                   <th className="p-4">Status</th>
                   <th className="p-4 text-center">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                 {filteredUsers.map(u => (
                   <tr key={u.id} className="hover:bg-slate-800/50">
                     <td className="p-4">
                       <div className="font-bold text-white">{u.name}</div>
                       <div className="text-xs text-slate-500">ID: {u.id}</div>
                     </td>
                     <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          u.role === 'carrier' ? 'bg-green-500/10 text-green-400' :
                          u.role === 'dealer' ? 'bg-purple-500/10 text-purple-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {u.role}
                        </span>
                     </td>
                     <td className="p-4 text-xs">
                       <div>{u.email}</div>
                       <div className="text-slate-500">{u.phone}</div>
                     </td>
                     <td className="p-4">{new Date(u.joinDate).toLocaleDateString()}</td>
                     <td className="p-4">
                        <span className={`flex items-center gap-1 font-bold ${
                          u.status === 'ACTIVE' ? 'text-green-400' : 
                          u.status === 'SUSPENDED' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {u.status === 'ACTIVE' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {u.status}
                        </span>
                     </td>
                     <td className="p-4 text-center">
                        <button 
                          onClick={() => toggleUserStatus(u.id)}
                          className={`p-2 rounded transition-colors ${
                            u.status === 'ACTIVE' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          }`}
                          title={u.status === 'ACTIVE' ? "Suspend User" : "Activate User"}
                        >
                          {u.status === 'ACTIVE' ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {/* --- FINANCE TAB --- */}
      {activeTab === 'finance' && (
        <div className="space-y-6 animate-in fade-in">
           {/* Financial Stats */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                 <div className="text-slate-400 text-xs font-bold uppercase mb-2">Total Volume</div>
                 <div className="text-3xl font-bold text-white">$45,200.00</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                 <div className="text-slate-400 text-xs font-bold uppercase mb-2">Platform Revenue</div>
                 <div className="text-3xl font-bold text-green-400">$4,520.00</div>
                 <div className="text-xs text-green-500/50 mt-1">Avg 10% Fee</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                 <div className="text-slate-400 text-xs font-bold uppercase mb-2">Active Escrow</div>
                 <div className="text-3xl font-bold text-blue-400">$12,450.00</div>
              </div>
           </div>

           {/* Master Ledger */}
           <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 font-bold text-white flex items-center gap-2">
                <DollarSign className="text-green-500" /> Master Transaction Ledger
              </div>
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-200">
                  <tr>
                    <th className="p-4">Date / ID</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-right">Net to Carrier</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">God Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-800/50">
                      <td className="p-4">
                        <div className="text-white">{new Date(tx.date).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500 font-mono">{tx.id}</div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                          tx.type === 'CLIENT_PAYMENT' ? 'bg-green-500/10 text-green-400' :
                          tx.type === 'REFUND' ? 'bg-red-500/10 text-red-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-white">{tx.description}</td>
                      <td className="p-4 text-right font-bold text-white">${tx.amount.toFixed(2)}</td>
                      <td className="p-4 text-right text-slate-300">
                        {tx.netToCarrier ? `$${tx.netToCarrier.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-4">
                         <span className={`font-bold text-xs ${
                           tx.status === 'COMPLETED' ? 'text-green-500' : 
                           tx.status === 'FAILED' ? 'text-red-500' : 'text-yellow-500'
                         }`}>
                           {tx.status}
                         </span>
                      </td>
                      <td className="p-4 text-center">
                         {tx.status === 'PENDING' && tx.type === 'CARRIER_PAYOUT' && (
                           <button onClick={() => handleForcePayout(tx.id)} className="bg-green-500 text-slate-900 px-3 py-1 rounded text-xs font-bold hover:bg-green-400">
                             Force Pay
                           </button>
                         )}
                         {tx.type === 'CLIENT_PAYMENT' && tx.status === 'COMPLETED' && (
                           <button onClick={() => handleForceRefund(tx.id)} className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-1 rounded text-xs font-bold hover:bg-red-500/20">
                             Refund
                           </button>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* --- RANKINGS TAB --- */}
      {activeTab === 'rankings' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-yellow-200 mb-6">
            <AlertTriangle className="shrink-0" />
            <div>
              <h3 className="font-bold">Manual Ranking Override</h3>
              <p className="text-sm opacity-80">Adjusting ratings here updates the carrier's public profile immediately. Use for disciplinary actions or corrections.</p>
            </div>
          </div>

          <div className="grid gap-4">
             {users.filter(u => u.role === 'carrier').map(carrier => (
               <div key={carrier.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                      <Truck size={24} className="text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{carrier.name}</h3>
                      <div className="text-slate-400 text-sm">Member since {new Date(carrier.joinDate).getFullYear()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                       <div className="text-xs text-slate-500 uppercase font-bold mb-1">Current Rating</div>
                       <div className="flex items-center gap-1">
                         <span className="text-2xl font-bold text-white">{carrier.rating?.toFixed(1)}</span>
                         <Star size={20} className="text-yellow-400" fill="currentColor" />
                       </div>
                    </div>

                    <div className="h-10 w-px bg-slate-800"></div>

                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] text-slate-500 font-bold uppercase">Override</label>
                       <div className="flex gap-1">
                         {[1,2,3,4,5].map(star => (
                           <button 
                             key={star}
                             onClick={() => updateRating(carrier.id, star)}
                             className={`hover:scale-110 transition-transform ${
                               (carrier.rating || 0) >= star ? 'text-yellow-400' : 'text-slate-700'
                             }`}
                           >
                             <Star size={24} fill="currentColor" />
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* --- VERIFICATIONS TAB --- */}
      {activeTab === 'verifications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in">
           <table className="w-full text-left text-sm text-slate-400">
             <thead className="bg-slate-950 text-slate-200">
               <tr>
                 <th className="p-4">Company</th>
                 <th className="p-4">Owner</th>
                 <th className="p-4">DOT / MC</th>
                 <th className="p-4">Status</th>
                 <th className="p-4 text-center">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-800">
               {applications.map(app => (
                 <tr key={app.id} className="hover:bg-slate-800/50 transition">
                   <td className="p-4 font-medium text-white">
                     <div className="flex items-center gap-2">
                       <Building2 size={16} className="text-blue-400"/> {app.companyName}
                     </div>
                   </td>
                   <td className="p-4">
                     <div className="flex flex-col">
                        <span className="text-white">{app.ownerName}</span>
                        <span className="text-xs">{app.ownerEmail}</span>
                     </div>
                   </td>
                   <td className="p-4 font-mono text-xs">
                     <div>DOT: {app.dotNumber}</div>
                     <div>MC: {app.mcNumber}</div>
                   </td>
                   <td className="p-4">
                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                       app.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 
                       app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 
                       'bg-yellow-500/10 text-yellow-400'
                     }`}>
                       {app.status}
                     </span>
                   </td>
                   <td className="p-4 text-center">
                     {app.status === 'PENDING_VERIFICATION' && (
                       <button 
                         onClick={() => setViewingApp(app)}
                         className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 mx-auto"
                       >
                         <Eye size={14} /> Review
                       </button>
                     )}
                   </td>
                 </tr>
               ))}
               {applications.length === 0 && (
                 <tr><td colSpan={5} className="p-8 text-center text-slate-500">No pending verifications.</td></tr>
               )}
             </tbody>
           </table>
        </div>
      )}

      {/* --- DISPUTES TAB --- */}
      {activeTab === 'disputes' && (
        <div className="grid gap-4 animate-in fade-in">
          {disputes.map(dispute => (
            <div key={dispute.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row justify-between gap-6">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-xs font-mono">{dispute.id}</span>
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                       dispute.status === 'OPEN' ? 'bg-red-500 text-slate-900' : 'bg-green-500/10 text-green-400'
                     }`}>{dispute.status}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">{dispute.reason}</h3>
                  <p className="text-slate-400 text-sm">Reported by: <span className="text-blue-400 font-bold">{dispute.reportedBy}</span> on Load {dispute.loadId}</p>
               </div>
               <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 min-w-[200px]">
                  <div className="text-slate-400 text-xs font-bold uppercase mb-1">Funds at Risk</div>
                  <div className="text-2xl font-bold text-white mb-4">${dispute.amountAtRisk.toFixed(2)}</div>
                  {dispute.status === 'OPEN' && (
                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleResolveDispute(dispute.id, 'REFUND')} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold py-2 rounded border border-red-500/30">
                        Refund Client
                      </button>
                      <button onClick={() => handleResolveDispute(dispute.id, 'RELEASE')} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded">
                        Dismiss & Pay Carrier
                      </button>
                    </div>
                  )}
               </div>
            </div>
          ))}
        </div>
      )}

      {/* DOCUMENT REVIEW MODAL (Shared) */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-xl">
               <div>
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <Building2 size={20} className="text-blue-400"/> {viewingApp.companyName}
                 </h3>
                 <div className="flex gap-4 text-xs text-slate-400 mt-1">
                   <span>DOT: {viewingApp.dotNumber}</span>
                   <span>EIN: {viewingApp.ein}</span>
                 </div>
               </div>
               <button onClick={() => setViewingApp(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><XCircle size={24}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <h4 className="text-sm font-bold text-slate-500 uppercase">Submitted Documents</h4>
                 {[
                   { name: 'FMCSA Authority Letter', status: 'Valid' },
                   { name: 'Insurance Certificate (COI)', status: 'Valid' },
                   { name: 'IRS W-9 Form', status: 'Pending Review' }
                 ].map((doc, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-slate-400" />
                        <span className="text-slate-200 text-sm">{doc.name}</span>
                      </div>
                      <div className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded">View PDF</div>
                   </div>
                 ))}
               </div>
               <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 text-center">Application Decision</h4>
                  <div className="grid gap-3">
                    <button 
                      onClick={() => handleVerify(viewingApp.id || '', true)}
                      className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                    >
                      <CheckCircle size={20} /> Approve Application
                    </button>
                    <button 
                      onClick={() => handleVerify(viewingApp.id || '', false)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-4 rounded-lg flex items-center justify-center gap-2 border border-red-500/30"
                    >
                      <XCircle size={20} /> Reject
                    </button>
                  </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;