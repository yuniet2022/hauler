import React, { useEffect, useMemo, useState } from "react";
import {
  Package, Truck, Users, RefreshCcw, MapPin, Navigation, Clock, Radar
} from "lucide-react";
import { API } from "../services/api";

type Load = any;

function getUser() {
  return {
    id: localStorage.getItem("autologix_user_id") || "C-DEV",
    role: localStorage.getItem("autologix_user_role") || "carrier",
    name: localStorage.getItem("autologix_user_name") || "Carrier",
  };
}

function fmtMoney(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "-";
  return `$${x.toFixed(0)}`;
}

function fmtETASeconds(s: any) {
  const x = Number(s);
  if (!Number.isFinite(x) || x <= 0) return "-";
  const h = Math.floor(x / 3600);
  const m = Math.floor((x % 3600) / 60);
  return `${h}h ${m}m`;
}

function fmtCoord(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "-";
  return x.toFixed(5);
}

function getCarrierGps(load: any) {
  // Carrier ve exacto si existe algo así en metadata_json:
  // metadata_json.gps = { lat, lng, updated_at, source, truck_id }
  // o metadata_json.gps_live = { ... }
  const md = load?.metadata_json || {};
  return md.gps || md.gps_live || null;
}

function getLastMilestone(load: any) {
  const md = load?.metadata_json || {};
  const timeline = md.timeline || md.milestones || null;
  if (!Array.isArray(timeline) || timeline.length === 0) return null;
  return timeline[timeline.length - 1];
}

const MyLoads: React.FC = () => {
  const user = useMemo(() => getUser(), []);

  const [inventory, setInventory] = useState<Load[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inv, t, d] = await Promise.all([
        API.getClientRequests({ assigned_carrier_id: user.id }),
        API.getTrucks(user.id),
        API.getDrivers(user.id),
      ]);
      setInventory(inv || []);
      setTrucks(t || []);
      setDrivers(d || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (user.role !== "carrier") {
    return (
      <div className="p-10 text-slate-300">
        This view is for carriers only.
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-slate-800 pb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
              <Package size={24} />
            </div>
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em]">
              Operational TMS Node
            </span>
          </div>

          <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">
            Dispatcher <span className="underline decoration-emerald-600 underline-offset-8">Hub</span>
          </h2>
        </div>

        <button
          onClick={fetchData}
          className="p-5 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 hover:text-white transition-all shadow-xl active:scale-95"
          title="Refresh"
        >
          <RefreshCcw size={24} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Package size={16} className="text-emerald-500" />
              Active Inventory ({inventory.length})
            </h3>
          </div>

          {inventory.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
              <Package size={48} className="mx-auto text-slate-700 mb-6" />
              <p className="text-slate-500 font-black uppercase text-xs tracking-widest italic">
                Inventory is empty. Get loads from Market Board.
              </p>
            </div>
          )}

          {inventory.map((load: any) => {
            const miles = load?.metadata_json?.truck_miles;
            const etaSeconds = load?.metadata_json?.eta?.eta_seconds;
            const gps = getCarrierGps(load);
            const last = getLastMilestone(load);

            return (
              <div
                key={load.id}
                className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] hover:border-emerald-500/40 transition-all shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-inner">
                      <Package size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                        Load ID
                      </div>
                      <div className="text-white font-black italic">{load.id}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Payout
                    </div>
                    <div className="text-2xl font-black text-emerald-400 italic">
                      {fmtMoney(load.price)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin size={18} className="text-slate-500" />
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Origin</span>
                    </div>
                    <div className="text-white font-black italic">{load.origin}</div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Navigation size={18} className="text-slate-500" />
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Destination</span>
                    </div>
                    <div className="text-white font-black italic">{load.destination}</div>
                  </div>
                </div>

                {/* Route / ETA */}
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="bg-slate-950/40 border border-slate-800 rounded-3xl px-6 py-4 flex items-center gap-3">
                    <Clock size={18} className="text-slate-500" />
                    <div>
                      <div className="text-[10px] uppercase font-black text-slate-500">ETA</div>
                      <div className="text-white font-black">{fmtETASeconds(etaSeconds)}</div>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-3xl px-6 py-4 flex items-center gap-3">
                    <Truck size={18} className="text-slate-500" />
                    <div>
                      <div className="text-[10px] uppercase font-black text-slate-500">Miles</div>
                      <div className="text-white font-black">
                        {Number.isFinite(Number(miles)) ? `${Number(miles).toFixed(1)} mi` : "-"}
                      </div>
                    </div>
                  </div>

                  {/* Carrier exact GPS (si existe) */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-3xl px-6 py-4 flex items-center gap-3">
                    <Radar size={18} className="text-emerald-400" />
                    <div>
                      <div className="text-[10px] uppercase font-black text-slate-500">
                        Live GPS (Carrier)
                      </div>
                      {gps ? (
                        <div className="text-white font-black">
                          {fmtCoord(gps.lat)}, {fmtCoord(gps.lng)}
                          <span className="text-slate-500 font-bold ml-2 text-[10px]">
                            {gps.updated_at ? `• ${gps.updated_at}` : ""}
                          </span>
                        </div>
                      ) : (
                        <div className="text-slate-500 font-black">Not attached</div>
                      )}
                    </div>
                  </div>

                  {/* Milestone (si existe) */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-3xl px-6 py-4">
                    <div className="text-[10px] uppercase font-black text-slate-500">Last Milestone</div>
                    <div className="text-white font-black">
                      {last?.label || last?.status || load.status || "-"}
                      <span className="text-slate-500 font-bold ml-2 text-[10px]">
                        {last?.at || last?.timestamp ? `• ${last.at || last.timestamp}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column: Fleet */}
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl h-fit">
            <h3 className="text-xs font-black uppercase text-white tracking-[0.2em] mb-8 flex items-center gap-2">
              <Truck size={16} className="text-blue-500" />
              Fleet Status
            </h3>

            <div className="space-y-4">
              {trucks.map((t: any) => (
                <div
                  key={t.id}
                  className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center">
                      <Truck size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic">{t.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{t.plate}</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black text-emerald-500 uppercase italic px-3 py-1 bg-emerald-500/10 rounded-full">
                    {t.status}
                  </span>
                </div>
              ))}
              {trucks.length === 0 && !loading && (
                <p className="text-[10px] text-slate-500 italic text-center py-4">
                  No trucks registered.
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl h-fit">
            <h3 className="text-xs font-black uppercase text-white tracking-[0.2em] mb-8 flex items-center gap-2">
              <Users size={16} className="text-purple-500" />
              Personnel
            </h3>

            <div className="space-y-4">
              {drivers.map((d: any) => (
                <div
                  key={d.id}
                  className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center">
                      <Users size={20} className="text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic">{d.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{d.phone}</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black text-blue-500 uppercase italic px-3 py-1 bg-blue-500/10 rounded-full">
                    {d.status}
                  </span>
                </div>
              ))}
              {drivers.length === 0 && !loading && (
                <p className="text-[10px] text-slate-500 italic text-center py-4">
                  No drivers registered.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLoads;
