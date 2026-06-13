
import React, { useState, useEffect } from 'react';
import { Camera, Navigation, MapPin, Phone, MessageSquare, AlertTriangle, Building2, Home, ArrowRight, Barcode, Truck, Loader2 } from 'lucide-react';
import InspectionTool from './InspectionTool';
import { Vehicle, PickupLocation, Load } from '../types';
import { DatabaseService } from '../services/database';

const DriverActiveLoad: React.FC = () => {
  const [currentLoad, setCurrentLoad] = useState<Load | null>(null);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [showInspection, setShowInspection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const loads = await DatabaseService.getLoads();
      if (loads && loads.length > 0) setCurrentLoad(loads[0]);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-green-500" /></div>;

  if (!currentLoad) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Truck size={40} className="text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Active Loads</h2>
        <p className="text-slate-400">You currently have no vehicles assigned.</p>
      </div>
    );
  }

  const stops: { location: PickupLocation; vehicles: Vehicle[] }[] = [];
  currentLoad.vehicles.forEach(vehicle => {
    const existingStop = stops.find(s => s.location.name === vehicle.pickupLocation.name);
    if (existingStop) existingStop.vehicles.push(vehicle);
    else stops.push({ location: vehicle.pickupLocation, vehicles: [vehicle] });
  });

  const activeStop = stops[0];
  const getVehicleById = (id: string) => currentLoad.vehicles.find(v => v.id === id);

  if (showInspection && activeVehicleId) {
    const v = getVehicleById(activeVehicleId);
    if (v) return <InspectionTool vehicle={v} mode="pickup" onComplete={() => setShowInspection(false)} onCancel={() => setShowInspection(false)} />;
  }

  return (
    <div className="pb-24 bg-slate-950 min-h-screen">
      <div className="relative h-64 bg-slate-900 overflow-hidden flex items-center justify-center">
        <div className="text-slate-500">Map View (Connected to DigitalOcean GPS)</div>
      </div>
      <div className="px-4 -mt-6 relative z-10 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
           <div className="flex justify-between items-start mb-4">
             <div>
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 {activeStop.location.type === 'AUCTION' ? <Building2 className="text-purple-400" /> : <Home className="text-blue-400" />}
                 {activeStop.location.name}
               </h2>
               <p className="text-slate-400 text-sm mt-1">{activeStop.location.address}</p>
             </div>
             <button className="bg-blue-600 text-white p-3 rounded-full"><Navigation size={20} /></button>
           </div>
           <div className="space-y-4">
             {activeStop.vehicles.map((vehicle) => (
               <div key={vehicle.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                 <div className="flex justify-between items-start mb-3">
                    <div><div className="font-bold text-white text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</div><div className="font-mono text-xs text-slate-500">{vehicle.vin}</div></div>
                 </div>
                 <button onClick={() => { setActiveVehicleId(vehicle.id); setShowInspection(true); }} className="w-full bg-slate-800 border border-slate-700 text-white py-3 rounded-lg flex items-center justify-center gap-2"><Camera size={18} /> Inspect & Confirm</button>
               </div>
             ))}
           </div>
        </div>
        <button onClick={() => alert("Next Stop")} className="w-full bg-green-500 text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2">Next Stop <ArrowRight size={20} /></button>
      </div>
    </div>
  );
};
export default DriverActiveLoad;