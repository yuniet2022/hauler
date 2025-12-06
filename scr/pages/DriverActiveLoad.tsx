
import React, { useState } from 'react';
import { Camera, Navigation, MapPin, Phone, MessageSquare, AlertTriangle, Building2, Home, ArrowRight, Barcode, CheckCircle } from 'lucide-react';
import InspectionTool from './InspectionTool';
import { MOCK_LOADS } from '../constants';
import { Vehicle, PickupLocation } from '../types';

const DriverActiveLoad: React.FC = () => {
  // Use MOCK_LOADS[0] which has multiple stops (Auction + Residence)
  const currentLoad = MOCK_LOADS[0]; 
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [showInspection, setShowInspection] = useState(false);
  
  // Logic to group vehicles by Location (Stops)
  const stops: { location: PickupLocation; vehicles: Vehicle[] }[] = [];
  
  currentLoad.vehicles.forEach(vehicle => {
    const existingStop = stops.find(s => s.location.name === vehicle.pickupLocation.name);
    if (existingStop) {
      existingStop.vehicles.push(vehicle);
    } else {
      stops.push({ location: vehicle.pickupLocation, vehicles: [vehicle] });
    }
  });

  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const activeStop = stops[currentStopIndex];

  // Helper to get active vehicle
  const getVehicleById = (id: string) => currentLoad.vehicles.find(v => v.id === id);

  const handleStartInspection = (vehicleId: string) => {
    setActiveVehicleId(vehicleId);
    setShowInspection(true);
  };

  const handleInspectionComplete = () => {
    setShowInspection(false);
    // Mark vehicle as inspected in local state (would sync to backend)
    // For demo, we just close the modal
  };

  const handleNextStop = () => {
    if (currentStopIndex < stops.length - 1) {
      setCurrentStopIndex(prev => prev + 1);
    } else {
      alert("All pickups complete! Proceeding to delivery.");
    }
  };

  // --- RENDER INSPECTION TOOL ---
  if (showInspection && activeVehicleId) {
    const v = getVehicleById(activeVehicleId);
    if (v) return <InspectionTool vehicle={v} mode="pickup" onComplete={handleInspectionComplete} onCancel={() => setShowInspection(false)} />;
  }

  return (
    <div className="pb-24 bg-slate-950 min-h-screen">
      {/* MAP HEADER */}
      <div className="relative h-64 bg-slate-900 overflow-hidden">
        {/* Mock Map Background */}
        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-80.19,25.76,10,0/800x600?access_token=mock')] bg-cover opacity-50 flex items-center justify-center">
            {/* Fallback visual if image doesn't load */}
            <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-[1px]"></div>
            
            {/* Route Visualization */}
            <div className="relative w-full h-full p-8 flex items-center justify-center">
               <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Simulated Route Line */}
                  <path d="M 100 150 Q 200 50 300 150 T 500 150" fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray="8 4" />
               </svg>
               
               {/* Stops Dots */}
               {stops.map((stop, idx) => (
                 <div key={idx} 
                      className={`absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500`}
                      style={{ left: `${20 + (idx * 30)}%`, top: idx % 2 === 0 ? '40%' : '60%' }}
                 >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold z-10 ${
                      idx === currentStopIndex ? 'bg-green-500 border-white text-slate-900 scale-125 shadow-[0_0_20px_rgba(34,197,94,0.6)]' :
                      idx < currentStopIndex ? 'bg-slate-700 border-slate-500 text-slate-400' :
                      'bg-slate-900 border-slate-600 text-slate-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="mt-1 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white backdrop-blur-sm whitespace-nowrap">
                       {stop.location.type === 'AUCTION' ? 'Auction' : 'Residence'}
                    </div>
                 </div>
               ))}
            </div>
        </div>

        {/* Floating Fuel Saver Badge */}
        <div className="absolute top-4 right-4 bg-green-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
           <MapPin size={12} /> Route Optimized (Save 12 mi)
        </div>
      </div>

      {/* STOP INFO CARD */}
      <div className="px-4 -mt-6 relative z-10 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
           <div className="flex justify-between items-start mb-4">
             <div>
               <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Current Stop ({currentStopIndex + 1}/{stops.length})</div>
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 {activeStop.location.type === 'AUCTION' ? <Building2 className="text-purple-400" /> : <Home className="text-blue-400" />}
                 {activeStop.location.name}
               </h2>
               <p className="text-slate-400 text-sm mt-1">{activeStop.location.address}</p>
             </div>
             <button className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95">
               <Navigation size={20} fill="currentColor" />
             </button>
           </div>

           {/* Location Specific Actions */}
           {activeStop.location.type === 'RESIDENCE' && (
             <div className="flex gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
               <button className="flex-1 bg-slate-800 text-white py-2 rounded-lg flex items-center justify-center gap-2 border border-slate-700">
                 <Phone size={16} className="text-green-400" /> Call Owner
               </button>
               <button className="flex-1 bg-slate-800 text-white py-2 rounded-lg flex items-center justify-center gap-2 border border-slate-700">
                 <MessageSquare size={16} className="text-blue-400" /> Text ETA
               </button>
             </div>
           )}

           {activeStop.location.instructions && (
             <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg mb-6 flex gap-3">
                <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
                <p className="text-sm text-yellow-200">{activeStop.location.instructions}</p>
             </div>
           )}

           {/* Vehicles at this stop */}
           <div className="space-y-4">
             <h3 className="text-sm font-bold text-slate-500 uppercase border-b border-slate-800 pb-2">Vehicles to Pickup ({activeStop.vehicles.length})</h3>
             
             {activeStop.vehicles.map((vehicle, idx) => (
               <div key={vehicle.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                 <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-white text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                      <div className="font-mono text-xs text-slate-500">{vehicle.vin}</div>
                    </div>
                    {/* Gate Pass Logic */}
                    {vehicle.gatePassCode && (
                       <div className="text-right">
                         <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Gate Pass</div>
                         <div className="bg-white text-slate-900 px-2 py-1 rounded font-mono font-bold text-sm flex items-center gap-1">
                           <Barcode size={14} /> {vehicle.gatePassCode}
                         </div>
                       </div>
                    )}
                 </div>

                 <button 
                    onClick={() => handleStartInspection(vehicle.id)}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                 >
                   <Camera size={18} /> Inspect & Confirm
                 </button>
               </div>
             ))}
           </div>
        </div>

        {/* Complete Stop Button */}
        <button 
           onClick={handleNextStop}
           className="w-full bg-green-500 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
        >
          {currentStopIndex === stops.length - 1 ? 'Depart to Delivery' : 'Next Stop'} <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default DriverActiveLoad;