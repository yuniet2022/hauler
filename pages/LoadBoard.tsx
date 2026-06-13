import React, { useEffect, useMemo, useState } from "react";
import {
  Globe,
  Search,
  MapPin,
  DollarSign,
  ArrowRight,
  RefreshCcw,
  ShieldCheck,
  Loader2,
  TrendingUp,
  Truck,
  Navigation,
} from "lucide-react";
import { API } from "../services/api";

type Load = any;

function getUser() {
  return {
    id: localStorage.getItem("autologix_user_id") || "C-DEV",
    role: localStorage.getItem("autologix_user_role") || "carrier",
    name: localStorage.getItem("autologix_user_name") || "Carrier Node",

    // opcionales (si quieres guardarlos en localStorage)
    company_name: localStorage.getItem("autologix_company_name") || "",
    company_phone: localStorage.getItem("autologix_company_phone") || "",
    company_address: localStorage.getItem("autologix_company_address") || "",
    company_rating: localStorage.getItem("autologix_company_rating") || "",
  };
}

function fmtMoney(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "--";
  return `$${x.toFixed(0)}`;
}

function fmtMiles(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "--";
  return `${x.toFixed(1)} mi`;
}

function fmtETASeconds(s: any) {
  const x = Number(s);
  if (!Number.isFinite(x) || x <= 0) return "--";
  const h = Math.floor(x / 3600);
  const m = Math.floor((x % 3600) / 60);
  // si no quieres horas cuando sea 0:
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function textIncludes(hay: string, needle: string) {
  return (hay || "").toLowerCase().includes((needle || "").toLowerCase());
}

function numOrNull(v: any): number | null {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

/**
 * Los tuyos están guardando así (según tus screenshots):
 * metadata_json: {
 *   routing: { distance_miles, duration_seconds, profile_used, ... }
 *   eta: { eta_seconds, buffer_seconds, breaks_count, break_seconds, ... }
 * }
 */
function getLoadMiles(load: any): number | null {
  return (
    numOrNull(load?.metadata_json?.routing?.distance_miles) ??
    numOrNull(load?.routing?.distance_miles) ??
    numOrNull(load?.metadata_json?.routing?.distanceMiles) ??
    numOrNull(load?.routing?.distanceMiles) ??
    null
  );
}

function getLoadEtaSeconds(load: any): number | null {
  // para carrier queremos el ETA “real” (con buffer/breaks) si existe
  return (
    numOrNull(load?.metadata_json?.eta?.eta_seconds) ??
    numOrNull(load?.eta?.eta_seconds) ??
    // si no existe eta, usa duración de la ruta
    numOrNull(load?.metadata_json?.routing?.duration_seconds) ??
    numOrNull(load?.routing?.duration_seconds) ??
    numOrNull(load?.metadata_json?.routing?.durationSeconds) ??
    numOrNull(load?.routing?.durationSeconds) ??
    null
  );
}

function getLoadProfile(load: any): string | null {
  return (
    load?.metadata_json?.routing?.profile_used ??
    load?.routing?.profile_used ??
    load?.metadata_json?.routing?.profile ??
    load?.routing?.profile ??
    null
  );
}

const LoadBoard: React.FC = () => {
  const user = useMemo(() => getUser(), []);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  // evita bloquear los 2 botones al mismo tiempo por id
  const [isBidding, setIsBidding] = useState<string | null>(null);

  // search
  const [q, setQ] = useState("");

  // precio por load (contraoferta)
  const [bidPriceById, setBidPriceById] = useState<Record<string, string>>({});

  // (opcional) mensaje de éxito en UI (si lo quieres)
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMarket = async () => {
    setLoading(true);
    try {
      const data = await API.getMarketLoads();
      setLoads(data || []);
    } catch (e) {
      console.error("getMarketLoads failed", e);
      setLoads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return loads;

    return loads.filter((load: any) => {
      const o = load?.origin || "";
      const d = load?.destination || "";
      const v = load?.vehicle_info?.text || "";
      return textIncludes(o, q) || textIncludes(d, q) || textIncludes(v, q);
    });
  }, [loads, q]);

  /**
   * Enviar oferta:
   * - Si escribes un número => contraoferta
   * - Si lo dejas vacío => usa fixed price (aceptar “tal cual”)
   */
  const handleBid = async (loadId: string, fixedPrice: number) => {
    setIsBidding(loadId);
    setSuccessMsg(null);

    try {
      const raw = (bidPriceById[loadId] || "").trim();

      const offerPrice =
        raw.length > 0 ? Number(raw) : Number(fixedPrice);

      if (!Number.isFinite(offerPrice) || offerPrice <= 0) {
        alert("Enter a valid offer price.");
        return;
      }

      const offer = {
        carrier_id: user.id,
        carrier_name: user.name,

        // extra info (si lo tienes)
        carrier_company: user.company_name || undefined,
        carrier_phone: user.company_phone || undefined,
        carrier_address: user.company_address || undefined,
        carrier_rating: user.company_rating || undefined,

        price: offerPrice,
        timestamp: new Date().toISOString(),
      };

      await API.placeBid(loadId, offer);

      // limpia el input de ese load
      setBidPriceById((p) => ({ ...p, [loadId]: "" }));

      setSuccessMsg(`Offer sent successfully (${fmtMoney(offerPrice)}).`);
      // si prefieres alert:
      // alert("Offer sent successfully.");

      await fetchMarket();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error sending offer");
    } finally {
      setIsBidding(null);
    }
  };

return (
  <div className="space-y-10 pb-20 animate-in fade-in duration-700">
    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-800 pb-12">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20">
            <Globe size={24} />
          </div>
          <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.4em]">
            Central Dispatch Connector
          </span>
        </div>

        <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">
          Market{" "}
          <span className="underline decoration-blue-600 underline-offset-8">
            Board
          </span>
        </h2>
      </div>

      <div className="flex gap-4">
        <div className="relative group">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"
            size={20}
          />
          <input
            className="bg-slate-900 border border-slate-800 rounded-[2rem] py-5 pl-14 pr-8 text-xs text-white focus:border-blue-500 outline-none w-80 shadow-inner"
            placeholder="Search Origin / Destination / Vehicle"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <button
          onClick={fetchMarket}
          className="p-5 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 hover:text-white transition-all shadow-xl active:scale-95"
          title="Refresh"
        >
          <RefreshCcw size={24} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </div>

    {successMsg && (
      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-6 py-4 rounded-3xl text-sm">
        {successMsg}
      </div>
    )}

    {/* Body */}
    <div className="grid grid-cols-1 gap-8">
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic animate-pulse">
            Scanning Global Marketplace...
          </span>
        </div>
      ) : (
        <>
          {filtered.map((load: any) => {
            const vehText = load?.vehicle_info?.text || "Inventory";
            const miles = getLoadMiles(load);
            const etas = getLoadEtaSeconds(load);
            const prof = getLoadProfile(load);

            return (
              <div
                key={load.id}
                className="bg-slate-900 border border-slate-800 p-10 rounded-[3.5rem] hover:border-blue-500/40 transition-all shadow-3xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] -z-10" />

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                  {/* Left */}
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-4 mb-8">
                      <span className="bg-emerald-500/10 text-emerald-400 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2">
                        <ShieldCheck size={14} /> Verified Client
                      </span>

                      <span className="text-[10px] font-black text-slate-500 uppercase italic flex items-center gap-2">
                        <Truck size={16} className="text-blue-500" />
                        {vehText}
                      </span>
                    </div>

                    {/* Origin / Dest */}
                    <div className="flex flex-col md:flex-row items-center gap-10">
                      <div className="flex items-start gap-6 w-full">
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-700 shadow-inner">
                          <MapPin size={26} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 font-black uppercase mb-1">
                            Origin
                          </p>
                          <p className="text-4xl font-black text-white uppercase italic tracking-tighter">
                            {load.origin}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-20 h-px bg-slate-800 hidden md:block" />
                        <ArrowRight className="text-blue-500/30 my-2" size={34} />
                        <div className="w-20 h-px bg-slate-800 hidden md:block" />
                      </div>

                      <div className="flex items-start gap-6 w-full">
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-700 shadow-inner">
                          <Navigation size={26} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 font-black uppercase mb-1">
                            Destination
                          </p>
                          <p className="text-4xl font-black text-white uppercase italic tracking-tighter">
                            {load.destination}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Route quick info */}
                    <div className="mt-8 flex flex-wrap gap-4">
                      <div className="bg-slate-950/60 border border-slate-800 rounded-3xl px-6 py-4">
                        <div className="text-[10px] uppercase font-black text-slate-500">
                          Miles
                        </div>
                        <div className="text-xl font-black text-white">
                          {fmtMiles(miles)}
                        </div>
                      </div>

                      <div className="bg-slate-950/60 border border-slate-800 rounded-3xl px-6 py-4">
                        <div className="text-[10px] uppercase font-black text-slate-500">
                          ETA
                        </div>
                        <div className="text-xl font-black text-white">
                          {fmtETASeconds(etas)}
                        </div>
                      </div>

                      <div className="bg-slate-950/60 border border-slate-800 rounded-3xl px-6 py-4">
                        <div className="text-[10px] uppercase font-black text-slate-500">
                          Profile
                        </div>
                        <div className="text-xl font-black text-white">
                          {prof || "--"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="w-full lg:w-[360px] bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-600 font-black uppercase mb-1">
                          Fixed Price
                        </p>
                        <div className="text-4xl font-black text-emerald-400 italic tracking-tighter">
                          {fmtMoney(load.price)}
                        </div>
                      </div>
                      <DollarSign className="text-blue-500" size={28} />
                    </div>

                    <div className="mt-6 space-y-3">
                      {/* Counteroffer */}
                      <div className="flex items-center gap-3">
                        <input
                          value={bidPriceById[load.id] ?? ""}
                          onChange={(e) =>
                            setBidPriceById((p) => ({
                              ...p,
                              [load.id]: e.target.value,
                            }))
                          }
                          placeholder="Your offer (e.g. 250)"
                          className="w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] px-5 py-4 text-white text-sm outline-none focus:border-blue-500"
                        />

                        <button
                          onClick={() => handleBid(load.id, Number(load.price))}
                          disabled={isBidding === load.id}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-4 rounded-[2.5rem] text-sm uppercase tracking-widest disabled:opacity-50 disabled:hover:bg-emerald-600"
                          title="Send a counteroffer"
                        >
                          {isBidding === load.id ? (
                            <span className="flex items-center gap-3">
                              <Loader2 className="animate-spin" size={20} />{" "}
                              Sending...
                            </span>
                          ) : (
                            <span className="flex items-center gap-3">
                              <TrendingUp size={20} /> Send Offer
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Accept fixed price */}
                      <button
                        onClick={() => handleBid(load.id, Number(load.price))}
                        disabled={isBidding === load.id}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-5 rounded-[2.5rem] text-sm uppercase tracking-widest disabled:opacity-50 disabled:hover:bg-blue-600"
                        title="Accept fixed price"
                      >
                        {isBidding === load.id ? (
                          <span className="flex items-center justify-center gap-3">
                            <Loader2 className="animate-spin" size={20} />{" "}
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-3">
                            <TrendingUp size={20} /> Take Load Now
                          </span>
                        )}
                      </button>

                      <div className="text-[11px] text-slate-500">
                        Tip: write a number to counteroffer. Leave it empty to
                        accept the fixed price.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div className="text-center text-slate-500 italic text-sm">
              No loads found.
            </div>
          )}
        </>
      )}
    </div>
  </div>
);
};
    export default  LoadBoard;
