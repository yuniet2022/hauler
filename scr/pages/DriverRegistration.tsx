
import React, { useState } from 'react';
import { Truck, FileText, ArrowRight, CheckCircle, Upload, Lock } from 'lucide-react';

interface DriverRegistrationProps {
  onComplete: () => void;
  onCancel: () => void;
}

const DriverRegistration: React.FC<DriverRegistrationProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-orange-900/20 via-slate-950 to-slate-950 -z-10"></div>
      
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <button onClick={onCancel} className="absolute top-6 right-6 text-slate-500 hover:text-white">✕</button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 text-orange-400 mb-4">
            <Truck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">Driver Registration</h1>
          <p className="text-slate-400 mt-2">Join as an Owner Operator or Independent Driver.</p>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                 <label className="text-xs text-slate-500 uppercase font-bold">Full Name</label>
                 <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
               </div>
               <div>
                 <label className="text-xs text-slate-500 uppercase font-bold">CDL Number</label>
                 <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
               </div>
               <div>
                 <label className="text-xs text-slate-500 uppercase font-bold">State of Issuance</label>
                 <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
               </div>
               <div className="col-span-2">
                 <label className="text-xs text-slate-500 uppercase font-bold">Email</label>
                 <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" type="email" />
               </div>
               <div className="col-span-2">
                 <label className="text-xs text-slate-500 uppercase font-bold">Phone</label>
                 <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" type="tel" />
               </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full mt-6 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
              Next Step <ArrowRight size={20} />
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">Working for a carrier? Ask them to invite you instead.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-semibold text-white">Upload Documents</h2>
            <div className="space-y-3">
              <div className="border border-slate-800 bg-slate-950 p-4 rounded-lg flex justify-between items-center">
                <span className="text-slate-300 font-medium">CDL Front</span>
                <button className="text-xs bg-slate-900 border border-slate-700 text-orange-400 px-3 py-2 rounded flex items-center gap-2"><Upload size={14}/> Upload</button>
              </div>
              <div className="border border-slate-800 bg-slate-950 p-4 rounded-lg flex justify-between items-center">
                <span className="text-slate-300 font-medium">CDL Back</span>
                <button className="text-xs bg-slate-900 border border-slate-700 text-orange-400 px-3 py-2 rounded flex items-center gap-2"><Upload size={14}/> Upload</button>
              </div>
              <div className="border border-slate-800 bg-slate-950 p-4 rounded-lg flex justify-between items-center">
                <span className="text-slate-300 font-medium">Medical Card</span>
                <button className="text-xs bg-slate-900 border border-slate-700 text-orange-400 px-3 py-2 rounded flex items-center gap-2"><Upload size={14}/> Upload</button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
               <label className="text-xs text-slate-500 uppercase font-bold">Create Password</label>
               <div className="relative mt-1">
                 <Lock size={16} className="absolute left-3 top-3.5 text-slate-500" />
                 <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pl-10 text-white focus:border-orange-500 outline-none" type="password" />
               </div>
            </div>

            <div className="flex gap-3">
               <button onClick={() => setStep(1)} className="px-4 text-slate-400">Back</button>
               <button onClick={onComplete} className="flex-1 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                 Register Driver <CheckCircle size={20} />
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRegistration;