
import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Shield, Loader2, Calendar } from 'lucide-react';
import { DatabaseService } from '../services/database';
import { DriverProfile as DriverProfileType } from '../types';

const DriverProfile: React.FC = () => {
  const [profile, setProfile] = useState<DriverProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get current owner ID from local storage for API calls
  const currentOwnerId = localStorage.getItem('autologix_user_id') || 'C-001';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fix: Pass currentOwnerId as an argument to DatabaseService.getDrivers
        const drivers = await DatabaseService.getDrivers(currentOwnerId);
        if (drivers.length > 0) {
          setProfile(drivers[0]);
        }
      } catch (e) {
        console.error("Error fetching profile", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentOwnerId]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-green-500" /></div>;

  if (!profile) {
    return (
      <div className="text-center p-10">
        <h2 className="text-xl text-white">Profile not found</h2>
        <p className="text-slate-400">Please contact fleet manager.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
       <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-800 to-transparent opacity-50"></div>
          
          <div className="relative">
            <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-slate-700 shadow-xl">
              <User size={48} className="text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
            <div className="flex justify-center gap-2 mt-3">
              <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20">CDL CLASS A</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                  profile.status === 'AVAILABLE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                  'bg-orange-500/10 text-orange-400 border-orange-500/20'
              }`}>
                  {profile.status}
              </span>
            </div>
          </div>
       </div>

       <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
         <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-4">Personal Information</h3>
         
         <div className="grid gap-4">
            <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="p-2 bg-slate-900 rounded-full text-slate-400"><Mail size={18} /></div>
                <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Email Address</div>
                    <div className="text-slate-200">{profile.email}</div>
                </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="p-2 bg-slate-900 rounded-full text-slate-400"><Phone size={18} /></div>
                <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Phone Number</div>
                    <div className="text-slate-200">{profile.phone}</div>
                </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="p-2 bg-slate-900 rounded-full text-slate-400"><Shield size={18} /></div>
                <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Driver ID</div>
                    <div className="text-slate-200 font-mono">{profile.id}</div>
                </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="p-2 bg-slate-900 rounded-full text-slate-400"><Calendar size={18} /></div>
                <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Joined Team</div>
                    <div className="text-slate-200">{profile.joinedAt || 'N/A'}</div>
                </div>
            </div>
         </div>
       </div>
    </div>
  );
};

export default DriverProfile;
