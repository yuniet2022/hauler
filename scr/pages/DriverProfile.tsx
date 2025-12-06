import React from 'react';
import { User, Mail, Phone, Shield } from 'lucide-react';

const DriverProfile: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-slate-700">
            <User size={48} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Alex Rivera</h2>
          <div className="flex justify-center gap-2 mt-2">
            <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full">CDL CLASS A</span>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full">ACTIVE</span>
          </div>
       </div>

       <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
         <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-2">Personal Information</h3>
         <div className="flex items-center gap-4 text-slate-400">
           <Mail size={18} /> alex@autologix.com
         </div>
         <div className="flex items-center gap-4 text-slate-400">
           <Phone size={18} /> (555) 012-3456
         </div>
         <div className="flex items-center gap-4 text-slate-400">
           <Shield size={18} /> Lic: FL-9988776655
         </div>
       </div>
    </div>
  );
};

export default DriverProfile;