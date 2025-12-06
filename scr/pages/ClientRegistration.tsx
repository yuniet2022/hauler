
import React, { useState } from 'react';
import { User, MapPin, Mail, Phone, ShieldCheck, Camera, ScanFace, ArrowRight, CheckCircle, Lock } from 'lucide-react';

interface ClientRegistrationProps {
  onComplete: () => void;
  onCancel: () => void;
}

const ClientRegistration: React.FC<ClientRegistrationProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const handleFaceScan = () => {
    setIsFaceScanning(true);
    setTimeout(() => {
      setIsFaceScanning(false);
      setIsFaceVerified(true);
    }, 2500); // Simulate 2.5s scan
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10"></div>
      
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <button onClick={onCancel} className="absolute top-6 right-6 text-slate-500 hover:text-white">✕</button>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Create Client Account</h1>
          <p className="text-slate-400 text-sm mt-1">Ship your car safely with verified transport.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-slate-800'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-slate-800'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-blue-500' : 'bg-slate-800'}`} />
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-lg font-semibold text-white mb-4">Personal Details</h2>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-500" size={18} />
                <input className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 text-white focus:border-blue-500 outline-none" placeholder="Full Name" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                <input className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 text-white focus:border-blue-500 outline-none" placeholder="Email Address" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-slate-500" size={18} />
                <input className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 text-white focus:border-blue-500 outline-none" placeholder="Phone Number" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-500" size={18} />
                <input className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 text-white focus:border-blue-500 outline-none" placeholder="Home Address" />
              </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
              Continue <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-lg font-semibold text-white">Identity Verification</h2>
            
            {/* Driver's License Upload */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-white">Driver's License</h3>
                  <p className="text-xs text-slate-500">Required for insurance purposes</p>
                </div>
              </div>
              <label className="block w-full border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-lg p-6 text-center cursor-pointer transition-colors group">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setLicenseFile(e.target.files?.[0] || null)} />
                {licenseFile ? (
                   <div className="flex items-center justify-center gap-2 text-green-400">
                     <CheckCircle size={20} />
                     <span className="text-sm font-medium">{licenseFile.name}</span>
                   </div>
                ) : (
                  <>
                    <Camera className="mx-auto mb-2 text-slate-500 group-hover:text-blue-400" size={24} />
                    <span className="text-sm text-slate-500 group-hover:text-blue-400">Upload Photo of ID</span>
                  </>
                )}
              </label>
            </div>

            {/* Facial Recognition */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
               <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                  <ScanFace size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-white">Facial Recognition</h3>
                  <p className="text-xs text-slate-500">To match your ID photo</p>
                </div>
              </div>
              
              {isFaceVerified ? (
                <div className="w-full py-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 flex items-center justify-center gap-2 font-bold">
                  <CheckCircle size={20} /> Verified Successfully
                </div>
              ) : (
                <button 
                  onClick={handleFaceScan}
                  disabled={isFaceScanning}
                  className="w-full py-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-white flex items-center justify-center gap-2 font-medium transition-all relative overflow-hidden"
                >
                  {isFaceScanning ? (
                    <>
                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       Scanning...
                    </>
                  ) : (
                    <>
                       <ScanFace size={20} /> Start Face Scan
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-4 text-slate-400">Back</button>
              <button 
                onClick={() => setStep(3)} 
                disabled={!licenseFile || !isFaceVerified}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-lg font-semibold text-white mb-4">Secure Your Account</h2>
            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                <input type="password" className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 text-white focus:border-blue-500 outline-none" placeholder="Create Password" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                <input type="password" className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 text-white focus:border-blue-500 outline-none" placeholder="Confirm Password" />
              </div>
            </div>
            
            <div className="mt-6 bg-slate-950 p-4 rounded-lg text-xs text-slate-500">
              By creating an account, you agree to AutoLogix's Terms of Service. Your data is encrypted securely.
            </div>

            <button onClick={onComplete} className="w-full mt-4 bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
              Complete Registration <CheckCircle size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientRegistration;