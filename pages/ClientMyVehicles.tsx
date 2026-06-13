// pages/ClientMyVehicles.tsx
import React, { useEffect, useMemo, useState } from "react";
import { DatabaseService } from "../services/database";

type Offer = {
  id?: string;
  carrier_id?: string;
  company_id?: string;
  price?: number;
  offer_price?: number;
  status?: string;
  created_at?: string;
};

type RouteSummary = {
  profile_used?: string | null;
  distance_miles?: number | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  eta?: {
    eta_seconds?: number;
    avg_speed_mph?: number;
    breaks_count?: number;
    break_seconds?: number;
    buffers_count?: number;
    buffer_seconds?: number;
  };
};

type VehicleInfo = {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  vin?: string | null;
  text?: string | null;
};

type ClientRequest = {
  id: string;
  origin: string;
  destination: string;

  // backend nuevo
  vehicle_info?: VehicleInfo;
  route_summary?: RouteSummary;

  // precio (según tu DB/modelo)
  target_price?: number;

  // por si tu backend aún manda price
  price?: number;

  status?: string;
  owner_user_id?: string;
  owner_id?: string;

  offers?: Offer[];

  // compat viejo (si aún existe en algunos registros)
  metadata_json?: any;
};

function formatETA(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "--";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs <= 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

function money(val?: number | null) {
  if (typeof val !== "number" || Number.isNaN(val)) return "--";
  return val.toFixed(0);
}

export default function ClientMyVehicles() {
  const ownerId = localStorage.getItem("autologix_user_id") || "TEST";

  const [rows, setRows] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await DatabaseService.getRequests(ownerId);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load vehicles");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const view = useMemo(() => {
    return (rows || []).map((r) => {
      // Prefer backend nuevo
      const vehicleText =
        (r.vehicle_info?.text || "").trim() ||
        [r.vehicle_info?.year, r.vehicle_info?.make, r.vehicle_info?.model]
          .filter(Boolean)
          .join(" ") ||
        "Vehicle";

      const miles =
        typeof r.route_summary?.distance_miles === "number"
          ? r.route_summary!.distance_miles
          : null;

      const etaSeconds =
        typeof r.route_summary?.eta?.eta_seconds === "number"
          ? r.route_summary!.eta!.eta_seconds
          : null;

      // Precio: prefer target_price, si no, price (por compat)
      const price =
        typeof r.target_price === "number"
          ? r.target_price
          : typeof r.price === "number"
          ? r.price
          : null;

      const offers = Array.isArray(r.offers) ? r.offers : [];

      return {
        ...r,
        vehicleText,
        miles,
        etaSeconds,
        price,
        offers,
      };
    });
  }, [rows]);

  return (
    <div className="p-4 max-w-[1100px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[22px] font-extrabold">My Vehicles</h2>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => (window.location.href = "/client-direct")}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
          >
            + New Vehicle
          </button>
        </div>
      </div>

      {error && <div className="mt-3 text-red-300">{error}</div>}

      <div className="mt-4 space-y-3">
        {view.length === 0 && !loading && (
          <div className="text-slate-400">
            You have no vehicles yet. Click <b>New Vehicle</b> to publish one to the market.
          </div>
        )}

        {view.map((r: any) => (
          <div
            key={r.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-slate-400 text-[12px]">Vehicle</div>
                <div className="text-slate-200 font-extrabold">
                  {r.vehicleText}
                </div>
                <div className="text-slate-500 text-[12px] font-mono">
                  {r.id}
                </div>
              </div>

              <div className="text-right">
                <div className="text-slate-400 text-[12px]">Status</div>
                <div className="font-bold text-slate-100">{r.status || "--"}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-3">
                <div className="text-slate-400 text-[12px]">Origin</div>
                <div className="text-slate-100">{r.origin}</div>
              </div>

              <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-3">
                <div className="text-slate-400 text-[12px]">Destination</div>
                <div className="text-slate-100">{r.destination}</div>
              </div>

              <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-3">
                <div className="text-slate-400 text-[12px]">Price</div>
                <div className="text-slate-100 font-extrabold">
                  ${money(r.price)}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-3">
                <div className="text-slate-400 text-[12px]">Miles</div>
                <div className="text-slate-100 font-bold">
                  {typeof r.miles === "number" ? r.miles.toFixed(1) : "--"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-3">
                <div className="text-slate-400 text-[12px]">ETA</div>
                <div className="text-slate-100 font-bold">
                  {formatETA(r.etaSeconds)}
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-3">
                <div className="text-slate-400 text-[12px]">Offers</div>
                <div className="text-slate-100 font-bold">{r.offers?.length ?? 0}</div>
              </div>
            </div>

            {r.offers?.length > 0 && (
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <div className="text-slate-300 font-bold mb-2">Offers</div>
                <div className="space-y-2">
                  {r.offers.map((o: Offer, idx: number) => {
                    const offerPrice =
                      typeof o.offer_price === "number"
                        ? o.offer_price
                        : typeof o.price === "number"
                        ? o.price
                        : null;

                    const who = o.company_id || o.carrier_id || "--";

                    return (
                      <div
                        key={`${r.id}-offer-${idx}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2"
                      >
                        <div className="text-slate-200">
                          <span className="text-slate-400 text-[12px] mr-2">
                            Carrier/Company
                          </span>
                          <span className="font-mono">{who}</span>
                        </div>
                        <div className="text-slate-200 font-bold">
                          ${money(offerPrice)}
                        </div>
                        <div className="text-slate-300">{o.status || "--"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
