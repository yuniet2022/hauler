import React, { useEffect, useState } from "react";
import {
  Truck,
  Users,
  Plus,
  Trash2,
  Loader2,
  X,
  Satellite,
  Globe,
  Save,
  AlertCircle,
  Mail,
  Phone,
  KeyRound,
  IdCard,
  CalendarDays,
} from "lucide-react";
import { DriverProfile, Truck as TruckType } from "../types";
import { DatabaseService } from "../services/database";

type CreatedDriverAccess = {
  email: string;
  temp_password: string;
  name: string;
};

const FleetManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"map" | "trucks" | "drivers">("map");
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [showTruckModal, setShowTruckModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showDriverAccessModal, setShowDriverAccessModal] = useState(false);
  const [createdDriverAccess, setCreatedDriverAccess] = useState<CreatedDriverAccess | null>(null);

  const [newTruck, setNewTruck] = useState({
    name: "",
    vin: "",
    plate: "",
  });

  const [newDriver, setNewDriver] = useState({
    name: "",
    email: "",
    phone: "",
    license_number: "",
    license_expiration: "",
  });

  const currentOwnerId = localStorage.getItem("autologix_user_id") || "";

  const resetTruckForm = () => {
    setNewTruck({
      name: "",
      vin: "",
      plate: "",
    });
  };

  const resetDriverForm = () => {
    setNewDriver({
      name: "",
      email: "",
      phone: "",
      license_number: "",
      license_expiration: "",
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [trucksRes, driversRes] = await Promise.allSettled([
        DatabaseService.getTrucks(currentOwnerId),
        DatabaseService.getDrivers(currentOwnerId),
      ]);

      if (trucksRes.status === "fulfilled") {
        setTrucks(Array.isArray(trucksRes.value) ? trucksRes.value : []);
      } else {
        console.error("Error loading trucks", trucksRes.reason);
        setTrucks([]);
      }

      if (driversRes.status === "fulfilled") {
        setDrivers(Array.isArray(driversRes.value) ? driversRes.value : []);
      } else {
        console.error("Error loading drivers", driversRes.reason);
        setDrivers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentOwnerId) return;
    loadData();
  }, [currentOwnerId]);

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newTruck.name.trim()) {
      setFormError("Truck name is required.");
      return;
    }
    if (!newTruck.vin.trim()) {
      setFormError("VIN is required.");
      return;
    }
    if (newTruck.vin.trim().length < 11) {
      setFormError("VIN must have at least 11 characters.");
      return;
    }
    if (!newTruck.plate.trim()) {
      setFormError("Plate is required.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await DatabaseService.saveTruck({
        ...newTruck,
        owner_id: currentOwnerId,
      });

      if (!result) {
        setFormError("Could not save truck.");
        return;
      }

      setShowTruckModal(false);
      resetTruckForm();
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || "Network error while saving truck.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newDriver.name.trim()) {
      setFormError("Driver full name is required.");
      return;
    }
    if (!newDriver.phone.trim()) {
      setFormError("Driver phone is required.");
      return;
    }
    if (!newDriver.email.trim()) {
      setFormError("Driver email is required.");
      return;
    }
    if (!newDriver.license_number.trim()) {
      setFormError("License number is required.");
      return;
    }
    if (!newDriver.license_expiration.trim()) {
      setFormError("License expiration is required.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await DatabaseService.saveDriver({
        ...newDriver,
        owner_id: currentOwnerId,
      });

      if (!result) {
        setFormError("Could not create driver.");
        return;
      }

      setCreatedDriverAccess({
        name: result.name || newDriver.name,
        email: result.email || newDriver.email,
        temp_password: result.temp_password || "",
      });

      setShowDriverModal(false);
      setShowDriverAccessModal(true);
      resetDriverForm();
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || "Network error while creating driver.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTruck = async (truckId: string) => {
    const ok = window.confirm("Delete this truck?");
    if (!ok) return;

    setIsDeleting(truckId);
    try {
      await DatabaseService.deleteTruck(truckId);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Could not delete truck.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    const ok = window.confirm("Delete this driver?");
    if (!ok) return;

    setIsDeleting(driverId);
    try {
      await DatabaseService.deleteDriver(driverId);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Could not delete driver.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading && trucks.length === 0 && drivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">
          Syncing with Node...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen overflow-x-hidden space-y-6 md:space-y-10 pb-20 px-4 md:px-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-slate-800 pb-8 md:pb-10">
        <div className="min-w-0">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic break-words">
            Fleet <span className="text-blue-500">Assets</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-4 flex items-center gap-2 break-words">
            <Satellite size={12} className="text-blue-600 shrink-0" />
            PostgreSQL Node • Central Monitoring
          </p>
        </div>

        <div className="flex flex-wrap bg-slate-900 p-2 rounded-3xl border border-slate-800 shadow-2xl gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`px-6 md:px-10 py-3 md:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "map"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Map
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("trucks")}
            className={`px-6 md:px-10 py-3 md:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "trucks"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Trucks ({trucks.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("drivers")}
            className={`px-6 md:px-10 py-3 md:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "drivers"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Drivers ({drivers.length})
          </button>
        </div>
      </div>

      {activeTab === "map" && (
        <div className="h-[420px] md:h-[600px] bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[4rem] relative overflow-hidden shadow-3xl">
          <div className="absolute inset-0 bg-[#02040a] opacity-40">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px]" />
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-4">
            <Globe className="mx-auto text-blue-500/20 mb-6" size={100} />
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.35em] italic">
              Telemetry Active • Postgres Stream
            </p>
          </div>
        </div>
      )}

      {activeTab === "trucks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          <button
            type="button"
            onClick={() => {
              setShowTruckModal(true);
              setFormError(null);
            }}
            className="group bg-slate-900 border-2 border-dashed border-slate-800 rounded-[2rem] md:rounded-[3.5rem] p-10 md:p-12 flex flex-col items-center justify-center gap-6 hover:border-blue-500/40 hover:bg-blue-600/5 transition-all"
          >
            <Plus className="text-slate-700 group-hover:text-blue-500 transition-colors" size={48} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white">
              Add New Hauler
            </span>
          </button>

          {trucks.map((truck) => (
            <div
              key={truck.id}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-10 group relative hover:border-blue-500/30 transition-all shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 md:gap-6 min-w-0">
                  <div className="p-4 md:p-5 bg-slate-950 rounded-[1.25rem] md:rounded-[2rem] text-blue-500 border border-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                    <Truck size={28} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter break-words">
                      {truck.name}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1 break-words">
                      {truck.plate}
                    </p>
                    <p className="text-[10px] font-mono text-slate-600 mt-2 break-all">
                      VIN: {truck.vin}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteTruck(truck.id)}
                  disabled={isDeleting === truck.id}
                  className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-60 shrink-0"
                >
                  {isDeleting === truck.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>

              <div className="flex justify-between items-center bg-slate-950 p-5 rounded-3xl border border-slate-800">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Status
                </span>
                <span className="text-[10px] font-black text-emerald-400 uppercase italic">
                  {truck.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "drivers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          <button
            type="button"
            onClick={() => {
              setShowDriverModal(true);
              setFormError(null);
            }}
            className="group bg-slate-900 border-2 border-dashed border-slate-800 rounded-[2rem] md:rounded-[3.5rem] p-10 md:p-12 flex flex-col items-center justify-center gap-6 hover:border-emerald-500/40 hover:bg-emerald-600/5 transition-all"
          >
            <Plus className="text-slate-700 group-hover:text-emerald-500 transition-colors" size={48} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white">
              Add Driver
            </span>
          </button>

          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-10 group relative hover:border-emerald-500/30 transition-all shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 md:gap-6 min-w-0">
                  <div className="w-16 h-16 bg-slate-950 rounded-[1.25rem] md:rounded-[2rem] border border-slate-800 flex items-center justify-center text-2xl font-black text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0">
                    {driver.name?.charAt(0)?.toUpperCase() || "D"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter break-words">
                      {driver.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 break-words">
                      {driver.phone}
                    </p>
                    {driver.email ? (
                      <p className="text-[10px] text-slate-600 mt-2 break-all">{driver.email}</p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteDriver(driver.id)}
                  disabled={isDeleting === driver.id}
                  className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-60 shrink-0"
                >
                  {isDeleting === driver.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 gap-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Availability
                  </span>
                  <span className="text-[10px] font-black text-blue-400 uppercase italic text-right">
                    {driver.status}
                  </span>
                </div>

                {"license_number" in driver && (driver as any).license_number ? (
                  <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 gap-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      License
                    </span>
                    <span className="text-[10px] font-black text-slate-300 uppercase italic text-right break-all">
                      {(driver as any).license_number}
                    </span>
                  </div>
                ) : null}

                {"license_expiration" in driver && (driver as any).license_expiration ? (
                  <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 gap-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Expires
                    </span>
                    <span className="text-[10px] font-black text-slate-300 uppercase italic text-right">
                      {(driver as any).license_expiration}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {showTruckModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2rem] md:rounded-[4rem] p-6 md:p-12 shadow-3xl relative">
            <button
              type="button"
              onClick={() => setShowTruckModal(false)}
              className="absolute top-6 right-6 md:top-10 md:right-10 text-slate-500 hover:text-white transition-all"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-4">
              <Truck className="text-blue-500" size={32} />
              New <span className="text-blue-500">Hauler</span>
            </h3>

            {formError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[11px] font-black uppercase">
                <AlertCircle size={14} /> {formError}
              </div>
            )}

            <form onSubmit={handleAddTruck} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                  Internal Name / Unit
                </label>
                <input
                  value={newTruck.name}
                  onChange={(e) => setNewTruck({ ...newTruck, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none"
                  placeholder="Unit name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                    Full VIN
                  </label>
                  <input
                    value={newTruck.vin}
                    onChange={(e) => setNewTruck({ ...newTruck, vin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none"
                    placeholder="VIN"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                    License Plate
                  </label>
                  <input
                    value={newTruck.plate}
                    onChange={(e) => setNewTruck({ ...newTruck, plate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none"
                    placeholder="Plate"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-5 md:py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Save size={20} /> Save Unit
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showDriverModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[2rem] md:rounded-[4rem] p-6 md:p-12 shadow-3xl relative">
            <button
              type="button"
              onClick={() => setShowDriverModal(false)}
              className="absolute top-6 right-6 md:top-10 md:right-10 text-slate-500 hover:text-white transition-all"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-4">
              <Users className="text-emerald-500" size={32} />
              Add <span className="text-emerald-500">Driver</span>
            </h3>

            {formError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[11px] font-black uppercase">
                <AlertCircle size={14} /> {formError}
              </div>
            )}

            <form onSubmit={handleAddDriver} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                  Full Driver Name
                </label>
                <input
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none"
                  placeholder="Full name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Mail size={12} /> Email
                  </label>
                  <input
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none"
                    placeholder="driver@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Phone size={12} /> Phone Number
                  </label>
                  <input
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none"
                    placeholder="Phone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <IdCard size={12} /> License Number
                  </label>
                  <input
                    value={newDriver.license_number}
                    onChange={(e) =>
                      setNewDriver({ ...newDriver, license_number: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none"
                    placeholder="License number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <CalendarDays size={12} /> License Expiration
                  </label>
                  <input
                    type="date"
                    value={newDriver.license_expiration}
                    onChange={(e) =>
                      setNewDriver({ ...newDriver, license_expiration: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-5 md:py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Save size={20} /> Register Driver
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showDriverAccessModal && createdDriverAccess && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2rem] md:rounded-[4rem] p-6 md:p-12 shadow-3xl relative">
            <button
              type="button"
              onClick={() => {
                setShowDriverAccessModal(false);
                setCreatedDriverAccess(null);
              }}
              className="absolute top-6 right-6 md:top-10 md:right-10 text-slate-500 hover:text-white transition-all"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-4">
              <KeyRound className="text-blue-500" size={32} />
              Driver <span className="text-blue-500">Access</span>
            </h3>

            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Driver
                </div>
                <div className="text-white font-bold break-words">
                  {createdDriverAccess.name}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Login Email
                </div>
                <div className="text-white font-bold break-all">
                  {createdDriverAccess.email}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Temporary Password
                </div>
                <div className="text-emerald-400 font-black break-all">
                  {createdDriverAccess.temp_password || "No temporary password returned"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-[11px] text-blue-200">
                Share these credentials with the driver. On first login, the driver must create a new password.
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDriverAccessModal(false);
                  setCreatedDriverAccess(null);
                }}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase tracking-widest"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
