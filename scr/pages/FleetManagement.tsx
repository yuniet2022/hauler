
import React, { useState } from 'react';
import { Truck, Users, Plus, Edit2, Trash2, MapPin, CheckCircle, Map as MapIcon, Navigation } from 'lucide-react';
import { MOCK_TRUCKS, MOCK_DRIVERS } from '../constants';
import { DriverProfile, Truck as TruckType } from '../types';

const FleetManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trucks' | 'drivers' | 'map'>('trucks');
  const [trucks, setTrucks] = useState<TruckType[]>(MOCK_TRUCKS);
  const [drivers, setDrivers] = useState<DriverProfile[]>(MOCK_DRIVERS);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [newDriver, setNewDriver] = useState<Partial<DriverProfile>>({});

  // CRUD & Modal Logic
  const handleSaveDriver = () => {
    if (!newDriver.name || !newDriver.email) return;
    const driver: DriverProfile = {
      id: `d-${Date.now()}`,
      name: newDriver.name,
      email: newDriver.email,
      phone: newDriver.phone || '',
      status: 'AVAILABLE',
      joinedAt: new Date().toISOString().split('T')[0],
      isSetupComplete: false
    };
    setDrivers([...drivers, driver]);
    setShowDriverModal(false);
    alert(`Invite sent to ${driver.email}`);
  };

  // --- MAP PROJECTION LOGIC ---
  // Approximate bounds of continental US for simple CSS projection
  const MAP_BOUNDS = {
    minLng: -125, // West Coast
    maxLng: -66,  // East Coast
    minLat: 24,   // Florida Keys
    maxLat: 50    // Canadian Border
  };

  const getMapPosition = (lat: number, lng: number) => {
    const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
    const y = 100 - ((lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
    return { left: `${x}%`, top: `${y}%` };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Fleet Management</h2>
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button 
            onClick={() => setActiveTab('trucks')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'trucks' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
          >
            <Truck size={16} /> Trucks
          </button>
          <button 
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'drivers' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
          >
            <Users size={16} /> Drivers
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'map' ? 'bg-slate-800 text-green-400 shadow-sm' : 'text-slate-400'}`}
          >
            <MapIcon size={16} /> Live GPS
          </button>
        </div>
      </div>

      {activeTab === 'trucks' && (
        <div className="grid md:grid-cols-3 gap-6 animate-in fade-in">
          {/* Add Truck Card */}
          <button className="border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-slate-500 hover:text-green-400 hover:border-green-500/50 transition-colors h-48">
            <div className="p-3 bg-slate-900 rounded-full mb-3"><Plus size={24} /></div>
            <span className="font-medium">Add Vehicle</span>
          </button>

          {trucks.map(truck => (
            <div key={truck.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{truck.name}</h3>
                    <p className="text-xs text-slate-500">{truck.plate}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${
                  truck.status === 'READY' ? 'bg-green-500/10 text-green-400' :
                  truck.status === 'ON_TRIP' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {truck.status}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 bg-slate-950 p-2 rounded">
                <MapPin size={14} className={truck.status === 'ON_TRIP' ? "text-blue-400 animate-pulse" : ""} />
                <span>{truck.currentLocation ? `${truck.currentLocation.lat.toFixed(4)}, ${truck.currentLocation.lng.toFixed(4)}` : 'No GPS Signal'}</span>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded text-xs font-medium flex items-center justify-center gap-1">
                  <Edit2 size={12} /> Edit
                </button>
                <button className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded text-xs font-medium flex items-center justify-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="grid md:grid-cols-3 gap-6 animate-in fade-in">
           <button 
             onClick={() => setShowDriverModal(true)}
             className="border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-slate-500 hover:text-green-400 hover:border-green-500/50 transition-colors h-48"
            >
            <div className="p-3 bg-slate-900 rounded-full mb-3"><Plus size={24} /></div>
            <span className="font-medium">Invite Driver</span>
          </button>

          {drivers.map(driver => (
            <div key={driver.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-300 border border-slate-700">
                     {driver.name.charAt(0)}
                   </div>
                   <div>
                     <h3 className="font-bold text-white">{driver.name}</h3>
                     <p className="text-xs text-slate-500">{driver.phone}</p>
                   </div>
                 </div>
                 <div className={`w-3 h-3 rounded-full ${
                   driver.status === 'AVAILABLE' ? 'bg-green-500' : 
                   driver.status === 'ON_TRIP' ? 'bg-blue-500' : 'bg-orange-500'
                 }`} />
               </div>
               
               <div className="text-sm text-slate-400 mb-4">
                 <div className="flex justify-between py-1 border-b border-slate-800/50">
                   <span>Status:</span>
                   <span className="text-white">{driver.status}</span>
                 </div>
                 <div className="flex justify-between py-1">
                   <span>Joined:</span>
                   <span className="text-white">{driver.joinedAt}</span>
                 </div>
               </div>

               <div className="flex gap-2">
                 <button className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-white py-2 rounded">View Profile</button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* --- LIVE MAP TAB --- */}
      {activeTab === 'map' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-[600px] relative animate-in fade-in shadow-2xl">
           {/* Header Overlay */}
           <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-lg">
             <h3 className="text-white font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live Fleet Tracking</h3>
             <div className="text-xs text-slate-400 mt-1">
               {trucks.filter(t => t.status === 'ON_TRIP').length} Active Trucks on Road
             </div>
           </div>

           {/* Map Container */}
           <div className="relative w-full h-full bg-[#111] overflow-hidden group cursor-crosshair">
             {/* Styled US Map Background (Inverted for dark mode look) */}
             <div 
               className="absolute inset-0 opacity-20 transition-transform duration-700"
               style={{
                 backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Blank_US_Map_%28states_only%29.svg/1200px-Blank_US_Map_%28states_only%29.svg.png")',
                 backgroundSize: 'contain',
                 backgroundPosition: 'center',
                 backgroundRepeat: 'no-repeat',
                 filter: 'invert(1)'
               }}
             ></div>

             {/* Plotting Trucks */}
             {trucks.filter(t => t.currentLocation).map(truck => {
                const pos = getMapPosition(truck.currentLocation!.lat, truck.currentLocation!.lng);
                const isActive = truck.status === 'ON_TRIP';
                
                return (
                  <div 
                    key={truck.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/marker hover:z-50 transition-all duration-500"
                    style={{ left: pos.left, top: pos.top }}
                  >
                     {/* Tooltip on Hover */}
                     <div className="absolute bottom-full mb-2 opacity-0 group-hover/marker:opacity-100 transition-opacity bg-slate-800 text-white text-xs p-2 rounded-lg border border-slate-600 whitespace-nowrap shadow-xl z-20 pointer-events-none">
                        <div className="font-bold flex items-center gap-1">
                          {truck.name} 
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-400' : 'bg-green-400'}`}></span>
                        </div>
                        <div className="text-slate-400">{truck.status} • 65 MPH</div>
                        <div className="text-[10px] font-mono mt-1 opacity-70">
                          {truck.currentLocation?.lat}, {truck.currentLocation?.lng}
                        </div>
                     </div>

                     {/* The Marker */}
                     <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform group-hover/marker:scale-125 ${
                       isActive ? 'bg-blue-500 border-blue-300' : 'bg-green-500 border-green-300'
                     }`}>
                        <Truck size={12} className="text-white" fill="currentColor" />
                        
                        {/* Ping Animation for Active Trucks */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
                        )}
                     </div>

                     {/* Label below */}
                     <span className="mt-1 text-[10px] font-bold text-slate-400 bg-black/50 px-1 rounded backdrop-blur-sm group-hover/marker:text-white">
                        {truck.name}
                     </span>
                  </div>
                );
             })}
           </div>
           
           {/* Legend */}
           <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg text-xs space-y-2">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-300 shadow shadow-blue-500/50"></div>
                 <span className="text-slate-300">En Route (On Trip)</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-green-500 border border-green-300"></div>
                 <span className="text-slate-300">Available (Ready)</span>
              </div>
           </div>
        </div>
      )}

      {/* Driver Invite Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">Invite New Driver</h3>
            <div className="space-y-4">
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white" 
                placeholder="Full Name" 
                onChange={e => setNewDriver({...newDriver, name: e.target.value})}
              />
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white" 
                placeholder="Email Address" 
                onChange={e => setNewDriver({...newDriver, email: e.target.value})}
              />
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white" 
                placeholder="Phone Number" 
                onChange={e => setNewDriver({...newDriver, phone: e.target.value})}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDriverModal(false)} className="flex-1 py-3 text-slate-400">Cancel</button>
              <button onClick={handleSaveDriver} className="flex-1 bg-green-500 text-slate-950 font-bold rounded py-3">Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;