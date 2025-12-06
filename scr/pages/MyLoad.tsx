
import React, { useState } from 'react';
import { Package, Truck, ArrowRight, LayoutGrid, Users, UserPlus, Layers, Trash2, Send, Calendar } from 'lucide-react';
import { MOCK_LOADS, MOCK_TRUCKS, MOCK_DRIVERS, TRUCK_POSITIONS } from '../constants';
import { Vehicle, Trip } from '../types';

const MyLoads: React.FC = () => {
  // Inventory Selection
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [showPlanner, setShowPlanner] = useState(false);
  
  // Batch / Staging State
  const [stagedTrips, setStagedTrips] = useState<Trip[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]); // Simulating the backend list

  // Trip Configuration State (Current Trip being built)
  const [loadPlan, setLoadPlan] = useState<Record<string, string>>({});
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [isTeamDriving, setIsTeamDriving] = useState(false);
  const [primaryDriverId, setPrimaryDriverId] = useState('');
  const [secondaryDriverId, setSecondaryDriverId] = useState('');

  // --- RESOURCE FILTERING LOGIC ---

  // 1. Vehicles: Exclude vehicles already in Active Trips OR Staged Trips
  const inventory = MOCK_LOADS.flatMap(l => l.vehicles.filter(v => 
    v.status === 'PENDING' && 
    !stagedTrips.some(t => t.vehicleIds.includes(v.id)) &&
    !activeTrips.some(t => t.vehicleIds.includes(v.id))
  ));

  // 2. Trucks: Exclude trucks that are NOT READY or are used in Staged Trips
  const availableTrucks = MOCK_TRUCKS.filter(t => 
    t.status === 'READY' && 
    !stagedTrips.some(st => st.truckId === t.id)
  );

  // 3. Drivers: Exclude drivers NOT AVAILABLE or used in Staged Trips
  const availableDrivers = MOCK_DRIVERS.filter(d => 
    d.status === 'AVAILABLE' && 
    !stagedTrips.some(st => st.driverIds.includes(d.id))
  );

  const toggleSelection = (id: string) => {
    if (selectedVehicles.includes(id)) {
      setSelectedVehicles(selectedVehicles.filter(v => v !== id));
      // Remove from load plan
      const newPlan = { ...loadPlan };
      Object.keys(newPlan).forEach(key => {
        if (newPlan[key] === id) delete newPlan[key];
      });
      setLoadPlan(newPlan);
    } else if (selectedVehicles.length < 10) {
      setSelectedVehicles([...selectedVehicles, id]);
    }
  };

  const assignToSlot = (slotId: string, vehicleId: string) => {
    setLoadPlan(prev => {
      const newPlan = { ...prev };
      if (!vehicleId) {
        delete newPlan[slotId];
      } else {
        newPlan[slotId] = vehicleId;
      }
      return newPlan;
    });
  };

  const getAvailableVehiclesForSlot = (currentSlotId: string) => {
    return selectedVehicles.filter(vid => {
      const assignedSlot = Object.keys(loadPlan).find(slot => loadPlan[slot] === vid);
      return !assignedSlot || assignedSlot === currentSlotId;
    });
  };

  // Stage the Trip (Add to Batch Queue)
  const handleStageTrip = () => {
    if (!selectedTruckId || !primaryDriverId) {
      alert("Please select a truck and at least a primary driver.");
      return;
    }
    if (isTeamDriving && !secondaryDriverId) {
      alert("Please select a co-driver for team driving.");
      return;
    }

    const driverIds = [primaryDriverId];
    if (isTeamDriving && secondaryDriverId) driverIds.push(secondaryDriverId);

    const newTrip: Trip = {
      id: `DRAFT-${Date.now()}`,
      truckId: selectedTruckId,
      driverIds: driverIds,
      loadIds: [], // Simplified for mock
      vehicleIds: [...selectedVehicles],
      status: 'PLANNED',
      loadPlan: { ...loadPlan },
      financials: { // Default mock financials
        grossTotal: 0,
        expenses: 0,
        driverPayMode: 'PERCENTAGE',
        driverPayRate: 25,
        paymentsReceived: { cash: 0, zelle: 0, check: 0, ach: 0 }
      }
    };

    setStagedTrips([...stagedTrips, newTrip]);
    
    // Reset Form
    setShowPlanner(false);
    setSelectedVehicles([]);
    setLoadPlan({});
    setSelectedTruckId('');
    setPrimaryDriverId('');
    setSecondaryDriverId('');
    setIsTeamDriving(false);
  };

  const removeStagedTrip = (tripId: string) => {
    setStagedTrips(stagedTrips.filter(t => t.id !== tripId));
  };

  const updateTripDate = (tripId: string, date: string) => {
    setStagedTrips(stagedTrips.map(t => t.id === tripId ? { ...t, departureDate: date } : t));
  };

  const handleDispatchIndividual = (tripId: string) => {
    const tripToDispatch = stagedTrips.find(t => t.id === tripId);
    if (!tripToDispatch) return;

    if (!tripToDispatch.departureDate) {
      alert("Please select a departure date before dispatching.");
      return;
    }

    if (window.confirm(`Dispatch Truck ${getTruckName(tripToDispatch.truckId)} for departure on ${tripToDispatch.departureDate}?`)) {
      const activeTrip: Trip = {
        ...tripToDispatch,
        id: `TR-${Date.now()}`,
        status: 'ACTIVE'
      };

      setActiveTrips([...activeTrips, activeTrip]);
      setStagedTrips(stagedTrips.filter(t => t.id !== tripId));
    }
  };

  // Helper to get names for UI
  const getTruckName = (id: string) => MOCK_TRUCKS.find(t => t.id === id)?.name || id;
  const getDriverName = (id: string) => MOCK_DRIVERS.find(d => d.id === id)?.name || id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-white">Trip Dispatcher</h2>
           <p className="text-slate-400 text-sm">Build loads and manage dispatch schedule.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowPlanner(true)}
            disabled={selectedVehicles.length === 0}
            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-800 text-slate-900 font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-green-500/20"
          >
            Plan Trip ({selectedVehicles.length}) <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Batch / Staging Area */}
      {stagedTrips.length > 0 && (
        <div className="bg-slate-900/50 border border-green-500/30 rounded-xl p-4">
           <div className="flex items-center gap-2 mb-3 text-green-400 font-bold text-sm uppercase">
             <Layers size={16} /> Ready for Dispatch
           </div>
           <div className="grid grid-cols-1 gap-4">
              {stagedTrips.map(trip => (
                <div key={trip.id} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4 group">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 text-white font-bold text-lg">
                        <Truck size={18} className="text-blue-400"/> {getTruckName(trip.truckId)}
                      </div>
                      <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <Users size={14} />
                        {trip.driverIds.map(d => getDriverName(d)).join(' & ')}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Carrying {trip.vehicleIds.length} Vehicles
                      </div>
                   </div>

                   {/* Departure Date Input */}
                   <div className="flex flex-col gap-1 w-full md:w-auto">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Departure Date</label>
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded px-3 py-2">
                        <Calendar size={14} className="text-slate-400" />
                        <input 
                          type="date" 
                          className="bg-transparent text-white text-sm outline-none"
                          onChange={(e) => updateTripDate(trip.id, e.target.value)}
                          value={trip.departureDate || ''}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                   </div>

                   <div className="flex items-center gap-2 w-full md:w-auto">
                     <button 
                        onClick={() => handleDispatchIndividual(trip.id)}
                        disabled={!trip.departureDate}
                        className="flex-1 md:flex-none bg-green-500 hover:bg-green-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-900 font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                     >
                       Dispatch <Send size={16} />
                     </button>
                     <button 
                       onClick={() => removeStagedTrip(trip.id)} 
                       className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                       title="Delete Trip"
                     >
                       <Trash2 size={20} />
                     </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Inventory Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="text-slate-400 text-sm font-semibold uppercase">Pending Inventory</h3>
             <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{inventory.length} vehicles</span>
          </div>
          
          <div className="space-y-2">
            {inventory.map(vehicle => (
              <div 
                key={vehicle.id}
                onClick={() => toggleSelection(vehicle.id)}
                className={`bg-slate-900 border p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                  selectedVehicles.includes(vehicle.id) ? 'border-green-500 bg-green-500/5' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-white">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                  <div className="text-xs text-slate-500 font-mono">{vehicle.vin}</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedVehicles.includes(vehicle.id) ? 'bg-green-500 border-green-500' : 'border-slate-600'
                }`}>
                  {selectedVehicles.includes(vehicle.id) && <div className="w-2 h-2 bg-slate-950 rounded-full" />}
                </div>
              </div>
            ))}
            {inventory.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                All vehicles have been assigned or staged.
              </div>
            )}
          </div>
        </div>

        {/* Active Trips Column */}
        <div className="space-y-4">
          <h3 className="text-slate-400 text-sm font-semibold uppercase">Dispatched / Active</h3>
          {activeTrips.length === 0 && (
             <div className="text-xs text-slate-500 italic">No trucks currently on the road.</div>
          )}
          {activeTrips.map(trip => (
            <div key={trip.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl opacity-75 hover:opacity-100 transition-opacity">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-mono text-slate-500">{trip.id}</span>
                 <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded uppercase">In Transit</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Truck size={16} className="text-blue-400" />
                <span className="text-white font-medium">{getTruckName(trip.truckId)}</span>
              </div>
              <div className="text-xs text-green-400 mb-2 flex items-center gap-1">
                 <Calendar size={12} /> Departed: {trip.departureDate}
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                 <div className="bg-blue-500 w-1/3 h-full animate-pulse"></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>{trip.vehicleIds.length} Cars</span>
                <span>{trip.driverIds.length > 1 ? 'Team' : 'Solo'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trip Planner Modal */}
      {showPlanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Configure Trip Load</h3>
              <button onClick={() => setShowPlanner(false)} className="text-slate-400 hover:text-white">Close</button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Truck Slots Visualizer */}
              <div>
                <h4 className="text-green-400 font-bold mb-4 flex items-center gap-2"><LayoutGrid size={18}/> Load Plan</h4>
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {TRUCK_POSITIONS.map(pos => (
                    <div key={pos.id} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-slate-400 text-right font-medium uppercase">{pos.name}</div>
                      <select 
                        className="flex-1 bg-slate-900 border border-slate-800 rounded p-2 text-white text-sm focus:border-green-500 outline-none hover:bg-slate-800 transition-colors"
                        onChange={(e) => assignToSlot(pos.id, e.target.value)}
                        value={loadPlan[pos.id] || ''}
                      >
                        <option value="">(Empty)</option>
                        {getAvailableVehiclesForSlot(pos.id).map(vid => {
                          const v = inventory.find(i => i.id === vid) || inventory.concat(MOCK_LOADS.flatMap(l=>l.vehicles)).find(i=>i.id===vid);
                          return <option key={vid} value={vid}>{v?.year} {v?.make} {v?.model}</option>
                        })}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Assignment */}
              <div className="space-y-6">
                 <div>
                   <label className="block text-sm text-slate-400 mb-2 font-bold">Select Hauler</label>
                   {availableTrucks.length === 0 ? (
                      <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        No trucks available. All trucks are either On Trip, Repair, or Staged.
                      </div>
                   ) : (
                     <select 
                        className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-green-500 outline-none"
                        onChange={(e) => setSelectedTruckId(e.target.value)}
                        value={selectedTruckId}
                     >
                       <option value="">Select Truck...</option>
                       {availableTrucks.map(t => (
                         <option key={t.id} value={t.id}>{t.name} ({t.plate})</option>
                       ))}
                     </select>
                   )}
                 </div>

                 <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                   <div className="flex justify-between items-center mb-4">
                     <label className="block text-sm text-slate-400 font-bold">Driver Assignment</label>
                     <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-white bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        <input 
                          type="checkbox" 
                          checked={isTeamDriving} 
                          onChange={(e) => setIsTeamDriving(e.target.checked)} 
                          className="rounded bg-slate-800 border-slate-700 text-green-500 focus:ring-green-500"
                        />
                        Enable Team Driving
                     </label>
                   </div>
                   
                   <div className="space-y-3">
                     {/* Primary Driver */}
                     <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                         <Users size={16} />
                       </div>
                       <select 
                          className="flex-1 bg-slate-900 border border-slate-800 rounded p-3 text-white focus:border-green-500 outline-none"
                          value={primaryDriverId}
                          onChange={(e) => setPrimaryDriverId(e.target.value)}
                       >
                         <option value="">Select Primary Driver...</option>
                         {availableDrivers.map(d => (
                           <option key={d.id} value={d.id}>{d.name}</option>
                         ))}
                       </select>
                     </div>

                     {/* Secondary Driver (Conditional) */}
                     {isTeamDriving && (
                       <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                         <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                           <UserPlus size={16} />
                         </div>
                         <select 
                            className="flex-1 bg-slate-900 border border-slate-800 rounded p-3 text-white focus:border-green-500 outline-none"
                            value={secondaryDriverId}
                            onChange={(e) => setSecondaryDriverId(e.target.value)}
                         >
                           <option value="">Select Co-Driver...</option>
                           {availableDrivers
                              .filter(d => d.id !== primaryDriverId) // Exclude selected primary driver
                              .map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                           ))}
                         </select>
                       </div>
                     )}
                   </div>
                 </div>

                 <button 
                  onClick={handleStageTrip}
                  className="w-full bg-white hover:bg-slate-200 text-slate-950 font-bold py-4 rounded-lg mt-8 shadow-lg flex items-center justify-center gap-2"
                 >
                   <Layers size={20} /> Add to Dispatch Queue
                 </button>
                 <p className="text-center text-xs text-slate-500 mt-2">
                   This adds the trip to the staging area. You can assign departure dates there.
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLoads;