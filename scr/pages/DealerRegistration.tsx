
import React, { useState } from 'react';
import { Building2, FileText, ArrowRight, ShieldCheck, Mail, Phone, Upload } from 'lucide-react';

interface DealerRegistrationProps {
  onComplete: () => void;
  onCancel: () => void;
}

const DealerRegistration: React.FC<DealerRegistrationProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  // Mock state
  const [files, setFiles] = useState({ license: false, insurance: false });

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950 -z-10"></div>
      
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <button onClick={onCancel} className="absolute top-6 right-6 text-slate-500 hover:text-white">✕</button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 text-purple-400 mb-4">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">Dealer & Broker Access</h1>
          <p className="text-slate-400 mt-2">Register your dealership to post loads and manage inventory.</p>
        </div>

        {/* Steps */}
        <div className="flex justify-center gap-4 mb-8">
           <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-slate-800'}`} />
           <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-slate-800'}`} />
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-semibold text-white mb-4">Company Profile</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-slate-500 uppercase font-bold">Legal Business Name</label>
                <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none" placeholder="Dealership LLC" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Dealer License Number</label>
                <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none" placeholder="D-123456" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Tax ID (EIN)</label>
                <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none" placeholder="XX-XXXXXXX" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-500 uppercase font-bold">Primary Address</label>
                <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none" placeholder="1234 Auto Park Way" />
              </div>
            </div>
            
            <h3 className="text-sm font-bold text-white mt-6 mb-2">Primary Contact</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="relative">
                 <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
                 <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pl-10 text-white focus:border-purple-500 outline-none" placeholder="Email Address" />
               </div>
               <div className="relative">
                 <Phone size={16} className="absolute left-3 top-3.5 text-slate-500" />
                 <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pl-10 text-white focus:border-purple-500 outline-none" placeholder="Phone Number" />
               </div>
            </div>

            <button onClick={() => setStep(2)} className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
              Next Step <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <h2 className="text-xl font-semibold text-white mb-4">Business Verification</h2>
             
             <div className="space-y-4">
               {['Dealer License Certificate', 'Liability Insurance (COI)'].map((doc, idx) => (
                 <div key={idx} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-900 rounded-md text-slate-400">
                       <FileText size={20} />
                     </div>
                     <span className="font-medium text-slate-300">{doc}</span>
                   </div>
                   <label className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-purple-400 rounded border border-slate-800 flex items-center gap-2 transition-all">
                     <Upload size={16} /> Upload PDF
                     <input type="file" className="hidden" />
                   </label>
                 </div>
               ))}
             </div>

             <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg text-purple-300 text-sm">
               Your account will be pending approval until our team verifies your dealer license and insurance status.
             </div>

             <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-400">Back</button>
                <button onClick={onComplete} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                  Submit Application <ShieldCheck size={20} />
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerRegistration;