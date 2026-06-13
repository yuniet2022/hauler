// pages/ClientDirect.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DatabaseService } from "../services/database";

type Suggestion = {
  formatted: string;
  place_id?: string;
  lat: number;
  lng: number;
  label?: string;
};

const toNum = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const formatETA = (seconds: number | null) => {
  if (!seconds || seconds <= 0) return "--";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs <= 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
};

const ClientDirect: React.FC = () => {
  const ownerId = localStorage.getItem("autologix_user_id") || "TEST";

  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");

  const [originObj, setOriginObj] = useState<Suggestion | null>(null);
  const [destObj, setDestObj] = useState<Suggestion | null>(null);

  const [originSug, setOriginSug] = useState<any[]>([]);
  const [destSug, setDestSug] = useState<any[]>([]);

  const [vehicleYear, setVehicleYear] = useState<number>(2024);
  const [vehicleMake, setVehicleMake] = useState<string>("TOYOTA");
  const [vehicleModel, setVehicleModel] = useState<string>("CAMRY");
  const [targetPrice, setTargetPrice] = useState<number>(200);

  const [loading, setLoading] = useState(false);

  // UI output
  const [routeMiles, setRouteMiles] = useState<number | null>(null);
  const [routeProfile, setRouteProfile] = useState<string | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Debounce timers
  const originTimer = useRef<any>(null);
  const destTimer = useRef<any>(null);

  const canEstimate = useMemo(() => {
    const ok = (n: any) => Number.isFinite(Number(n));
    return !!(
      originObj &&
      destObj &&
      ok(originObj.lat) &&
      ok(originObj.lng) &&
      ok(destObj.lat) &&
      ok(destObj.lng)
    );
  }, [originObj, destObj]);

  // Si el user escribe a mano, invalidamos coords para no usar data vieja
  useEffect(() => {
    if (originObj && originText !== originObj.formatted) setOriginObj(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originText]);

  useEffect(() => {
    if (destObj && destText !== destObj.formatted) setDestObj(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destText]);

  // -----------------------------
  // Autocomplete (usa /api/autocomplete)
  // -----------------------------
  const fetchAutocomplete = async (q: string) => {
    const res = await fetch(
      `/api/autocomplete?q=${encodeURIComponent(q)}&limit=8`
    );
    if (!res.ok) throw new Error("autocomplete_failed");
    return res.json();
  };

  const searchOrigin = (q: string) => {
    const txt = (q || "").trim();
    if (originTimer.current) clearTimeout(originTimer.current);

    if (txt.length < 3) {
      setOriginSug([]);
      return;
    }

    originTimer.current = setTimeout(async () => {
      try {
        const data = await fetchAutocomplete(txt);

        // backend devuelve { results: [...] }
        const out = Array.isArray(data?.results) ? data.results : [];
        setOriginSug(out);
      } catch {
        setOriginSug([]);
      }
    }, 250);
  };

  const searchDest = (q: string) => {
    const txt = (q || "").trim();
    if (destTimer.current) clearTimeout(destTimer.current);

    if (txt.length < 3) {
      setDestSug([]);
      return;
    }

    destTimer.current = setTimeout(async () => {
      try {
        const data = await fetchAutocomplete(txt);
        const out = Array.isArray(data?.results) ? data.results : [];
        setDestSug(out);
      } catch {
        setDestSug([]);
      }
    }, 250);
  };

  // Normaliza suggestion
  const normalizeSuggestion = (s: any): Suggestion => {
    const lat = toNum(s?.lat);
    const lng = Number.isFinite(toNum(s?.lng)) ? toNum(s?.lng) : toNum(s?.lon);

    return {
      formatted: String(s?.label || s?.formatted || "").trim(),
      place_id: s?.place_id,
      lat,
      lng,
      label: s?.label,
    };
  };

  const pickOrigin = (s: any) => {
    const obj = normalizeSuggestion(s);
    if (!Number.isFinite(obj.lat) || !Number.isFinite(obj.lng)) return;

    setOriginObj(obj);
    setOriginText(obj.formatted);
    setOriginSug([]);

    // reset routing output when changing selection
    setRouteMiles(null);
    setRouteProfile(null);
    setEtaSeconds(null);
  };

  const pickDest = (s: any) => {
    const obj = normalizeSuggestion(s);
    if (!Number.isFinite(obj.lat) || !Number.isFinite(obj.lng)) return;

    setDestObj(obj);
    setDestText(obj.formatted);
    setDestSug([]);

    setRouteMiles(null);
    setRouteProfile(null);
    setEtaSeconds(null);
  };

  // -----------------------------
  // ROUTE ESTIMATE (millas + ETA)
  // -----------------------------
 const estimateRoute = async () => {
    if (!originObj || !destObj) throw new Error("missing_coords");
    setLoading(true);
    // 1) Intentar HGV primero
    try {
      const r1 = await DatabaseService.routeEstimate(
        { lat: originObj.lat, lng: originObj.lng },
        { lat: destObj.lat, lng: destObj.lng }
      );

      const miles = r1?.routing?.distance_miles;
      const secs = r1?.routing?.duration_seconds;
      const profile = r1?.routing?.profile_used;

      if (typeof miles === "number") setRouteMiles(miles);
      if (typeof secs === "number") setEtaSeconds(secs);
      if (profile) setRouteProfile(profile);

      return;
    } catch (e) {
      // seguimos a fallback
    }

    // 2) Fallback: driving-car si HGV falla
    const r2 = await DatabaseService.routeEstimateCar(
      { lat: originObj.lat, lng: originObj.lng },
      { lat: destObj.lat, lng: destObj.lng }
    );

    const miles2 = r2?.routing?.distance_miles;
    const secs2 = r2?.routing?.duration_seconds;
    const profile2 = r2?.routing?.profile_used;

    if (typeof miles2 === "number") setRouteMiles(miles2);
    if (typeof secs2 === "number") setEtaSeconds(secs2);
    if (profile2) setRouteProfile(profile2);
  };

  // -----------------------------
  // Submit
  // -----------------------------
const submit = async () => {
  setError(null);
  setLoading(true);
  setSuccessMsg(null);

  try {
    const payload: any = {
      owner_id: ownerId,
      origin: originText,
      destination: destText,
      vehicle_year: vehicleYear,
      vehicle_make: vehicleMake,
      vehicle_model: vehicleModel,
      target_price: targetPrice,
    };

    // coords si vienen de autocomplete
    if (originObj && Number.isFinite(originObj.lat) && Number.isFinite(originObj.lng)) {
      payload.origin_obj = {
        formatted: originObj.formatted,
        lat: originObj.lat,
        lng: originObj.lng,
        place_id: originObj.place_id,
      };
    }

    if (destObj && Number.isFinite(destObj.lat) && Number.isFinite(destObj.lng)) {
      payload.destination_obj = {
        formatted: destObj.formatted,
        lat: destObj.lat,
        lng: destObj.lng,
        place_id: destObj.place_id,
      };
    }

    // metadata base
    payload.metadata_json = {
      client_side: { captured_at: new Date().toISOString() },
    };

    // ✅ 1) si hay coords, calcula ruta ANTES de guardar y persiste routing/eta
    const canEstimate =
      payload.origin_obj?.lat != null &&
      payload.origin_obj?.lng != null &&
      payload.destination_obj?.lat != null &&
      payload.destination_obj?.lng != null;

    if (canEstimate) {
      const est = await DatabaseService.routeEstimateCar(
        { lat: payload.origin_obj.lat, lng: payload.origin_obj.lng },
        { lat: payload.destination_obj.lat, lng: payload.destination_obj.lng }
      );

      // guarda lo importante en metadata_json (esto viaja al market-loads)
      payload.metadata_json.routing = est?.routing ?? null;
      payload.metadata_json.eta = est?.eta ?? null;

      // y también lo pones en UI local
      setRouteMiles(est?.routing?.distance_miles ?? null);
      setEtaSeconds(est?.eta?.eta_seconds ?? est?.routing?.duration_seconds ?? null);
      setRouteProfile(est?.routing?.profile_used ?? null);
    } else {
      setRouteMiles(null);
      setEtaSeconds(null);
      setRouteProfile(null);
    }

    // ✅ 2) ahora sí guarda el request ya “completo”
    const created = await DatabaseService.saveRequest(payload);

    // mensaje bonito (no alert feo)
    setSuccessMsg("✅ Your vehicle was sent to the market. Carriers can now place offers.");

    // opcional: refrescar lista local “My Vehicles” si la tienes
    // await loadMyVehicles();

  } catch (e: any) {
    setError(e?.message || "Error creando request");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-4 max-w-[900px]">
      <h2 className="text-[22px] font-extrabold">Client Direct</h2>

      {/* Origin */}
      <div className="mt-3 relative">
        <label className="text-sm text-slate-300">Origin (address)</label>
        <input
          value={originText}
          onChange={(e) => {
            setOriginText(e.target.value);
            searchOrigin(e.target.value);
          }}
          placeholder="123 NW 1st St, Miami, FL 33128"
          className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 placeholder:text-slate-500"
        />

        {originSug.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 z-[9999] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl max-h-64 overflow-auto">
            {originSug.map((s: any, idx: number) => (
              <div
                key={idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickOrigin(s);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-slate-800 border-b border-slate-800 last:border-b-0"
              >
                {s?.label || s?.formatted}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Destination */}
      <div className="mt-3 relative">
        <label className="text-sm text-slate-300">Destination (address)</label>
        <input
          value={destText}
          onChange={(e) => {
            setDestText(e.target.value);
            searchDest(e.target.value);
          }}
          placeholder="9800 International Dr, Orlando, FL 32819"
          className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 placeholder:text-slate-500"
        />

        {destSug.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 z-[9999] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl max-h-64 overflow-auto">
            {destSug.map((s: any, idx: number) => (
              <div
                key={idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickDest(s);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-slate-800 border-b border-slate-800 last:border-b-0"
              >
                {s?.label || s?.formatted}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vehicle */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm text-slate-300">Year</label>
          <input
            type="number"
            value={vehicleYear}
            onChange={(e) => setVehicleYear(Number(e.target.value))}
            className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
          />
        </div>

        <div>
          <label className="text-sm text-slate-300">Make</label>
          <input
            value={vehicleMake}
            onChange={(e) => setVehicleMake(e.target.value)}
            className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
          />
        </div>

        <div>
          <label className="text-sm text-slate-300">Model</label>
          <input
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
          />
        </div>

        <div>
          <label className="text-sm text-slate-300">Target Price</label>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(Number(e.target.value))}
            className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <button
          disabled={loading}
          onClick={submit}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-extrabold disabled:opacity-50 disabled:hover:bg-blue-600"
          title={
            !canEstimate
              ? "Puedes guardar igual, pero si eliges sugerencias con coords el backend calcula millas/ETA."
              : ""
          }
        >
          {loading ? "Saving..." : "Create Request"}
        </button>
      </div>

      {/* Output */}
      {(routeMiles !== null || etaSeconds !== null) && (
        <div className="mt-3 p-3 rounded-xl border border-slate-700 bg-slate-900">
          <div>
            <b>Profile used:</b> {routeProfile || "--"}
          </div>
          <div>
            <b>Miles:</b> {routeMiles !== null ? routeMiles.toFixed(1) : "--"}
          </div>
          <div>
            <b>ETA:</b> {formatETA(etaSeconds)}
          </div>
        </div>
      )}

      {error && <div className="mt-3 text-red-300">{error}</div>}

      <div className="mt-3 text-[12px] text-slate-500">
        Tip: para que calcule millas/ETA, selecciona la sugerencia (clic) para
        guardar los coords.
      </div>
    </div>
  );
};

export default ClientDirect;
