import React, { useState } from 'react';
import { Upload, CheckCircle, FileText, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { CarrierApplication } from '../types';

interface CarrierRegistrationProps {
  onComplete: () => void;
}

const CarrierRegistration: React.FC<CarrierRegistrationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CarrierApplication>({
    companyName: '', dotNumber: '', mcNumber: '', ein: '',
    ownerName: '', ownerPhone: '', ownerEmail: '',
    documents: { einDoc: null, authorityDoc: null, insuranceDoc: null, w9Doc: null }
  });

  const handleFileChange = (key: keyof typeof formData.documents, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [key]: file }
    }));
  };

  const nextStep = () => setStep(s => s + 1);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-900/20 via-slate-950 to-slate-950 -z-10"></div>
      
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-400 mb-4">
            <Truck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">Join the Network</h1>
          <p className="text-slate-400 mt-2">Register your carrier company to access premium loads.</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between items-center mb-8 px-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                step >= num 
                  ? 'bg-green-500 border-green-500 text-slate-950' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>
                {num}
              </div>
              <span className={`text-sm ${step >= num ? 'text-green-400' : 'text-slate-600'}`}>
                {num === 1 ? 'Company' : num === 2 ? 'Owner' : 'Docs'}
              </span>
              {num < 3 && <div className="w-12 h-0.5 bg-slate-800 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-semibold text-white mb-4">Company Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-1">Legal Company Name</label>
                <input 
                  type="text" 
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                  placeholder="ACME Logistics LLC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">DOT Number</label>
                <input 
                  type="text" 
                  value={formData.dotNumber}
                  onChange={e => setFormData({...formData, dotNumber: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                  placeholder="1234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">MC Number</label>
                <input 
                  type="text" 
                  value={formData.mcNumber}
                  onChange={e => setFormData({...formData, mcNumber: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                  placeholder="MC-987654"
                />
              </div>
            </div>
            <button 
              onClick={nextStep}
              className="w-full mt-6 bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              Continue <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Owner Info */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <h2 className="text-xl font-semibold text-white mb-4">Owner Contact</h2>
             <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Owner Full Name</label>
                <input 
                  type="text" 
                  value={formData.ownerName}
                  onChange={e => setFormData({...formData, ownerName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Direct Phone</label>
                <input 
                  type="tel" 
                  value={formData.ownerPhone}
                  onChange={e => setFormData({...formData, ownerPhone: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input 
                  type="email" 
                  value={formData.ownerEmail}
                  onChange={e => setFormData({...formData, ownerEmail: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                />
              </div>
             </div>
             <div className="flex gap-3 mt-6">
               <button onClick={() => setStep(1)} className="px-4 py-3 text-slate-400 hover:text-white">Back</button>
               <button 
                onClick={nextStep}
                className="flex-1 bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={20} />
              </button>
             </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <h2 className="text-xl font-semibold text-white mb-4">Required Documents</h2>
             <div className="grid grid-cols-1 gap-4">
                {[
                  { key: 'einDoc', label: 'EIN Verification Letter' },
                  { key: 'authorityDoc', label: 'FMCSA Authority Letter' },
                  { key: 'insuranceDoc', label: 'Certificate of Insurance (COI)' },
                  { key: 'w9Doc', label: 'W-9 Form' },
                ].map((doc) => (
                  <div key={doc.key} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg group hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 rounded-md text-slate-400 group-hover:text-green-400">
                        <FileText size={20} />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{doc.label}</span>
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-green-400 rounded border border-slate-800 hover:border-green-500/50 transition-all">
                      {formData.documents[doc.key as keyof typeof formData.documents] ? 'Change File' : 'Upload PDF'}
                      <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(doc.key as any, e.target.files?.[0] || null)} />
                    </label>
                  </div>
                ))}
             </div>

             <div className="flex gap-3 mt-8">
               <button onClick={() => setStep(2)} className="px-4 py-3 text-slate-400 hover:text-white">Back</button>
               <button 
                onClick={onComplete}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
              >
                Submit Application <ShieldCheck size={20} />
              </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarrierRegistration;