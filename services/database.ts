// /services/database.ts
import {
  API,
  CreateClientRequestPayload,
  OrsSuggestion,
  RouteEstimateResponse,
  RouteEstimatePayload,
  User,
} from "./api";

function safeNumber(n: any, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickToken(res: any): string {
  return String(res?.access_token || res?.token || res?.jwt || res?.authToken || "").trim();
}

function saveToken(token: string) {
  if (!token) return;

  // Official key (new)
  localStorage.setItem("autologix_token", token);

  // Compatibility keys (optional, to avoid older screens breaking)
  localStorage.setItem("access_token", token);
  localStorage.setItem("authToken", token);
  localStorage.setItem("jwt", token);
  localStorage.setItem("token", token);
}

function saveUserToLocalStorage(user: User) {
  localStorage.setItem("autologix_user_id", String(user.id));
  localStorage.setItem("autologix_user_role", String(user.role));
  if (user.email) localStorage.setItem("autologix_user_email", String(user.email));
  if (user.name) localStorage.setItem("autologix_user_name", String(user.name));
}

export const DatabaseService = {
  // ---------------- AUTH ----------------
login: async (email: string, password: string): Promise<any> => {
  const res: any = await API.login({ email, password });

  const user: User | undefined = res?.user;
  if (!user?.id || !user?.role) {
    throw new Error("Credenciales incorrectas o usuario no verificado.");
  }

  // Token (seguro: Bearer)
  const token = pickToken(res);
  saveToken(token);

  // User session keys
  saveUserToLocalStorage(user);

  return {
    user,
    must_change_password: !!res?.must_change_password,
  };
},
  logout: () => {
    // Limpia todo lo relacionado a sesión
    localStorage.removeItem("autologix_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("jwt");
    localStorage.removeItem("token");

    localStorage.removeItem("autologix_user_id");
    localStorage.removeItem("autologix_user_role");
    localStorage.removeItem("autologix_user_name");
    localStorage.removeItem("autologix_user_email");
  },

  register: async (payload: any) => API.register(payload),
  registerUser: async (payload: any) => API.register(payload),

  getUsers: async () => API.getUsers(),

  // ---------------- HEALTH ----------------
  getHealth: async () => API.getHealth(),

  // ---------------- ORS / ROUTE ----------------
  orsAutocomplete: async (q: string, limit = 8): Promise<OrsSuggestion[]> => {
    const txt = (q || "").trim();
    if (txt.length < 3) return [];
    const res: any = await API.geoAutocomplete(txt, limit);
    const out = res?.results ?? res;
    return Array.isArray(out) ? out : [];
  },

  routeEstimate: async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteEstimateResponse> => {
    const payload: RouteEstimatePayload = {
      origin,
      destination,
      profile: "driving-hgv",
    };
    return API.routeEstimate(payload);
  },
routeEstimateCar: async (origin, destination) => {
  const payload = {
    origin,
    destination,
    profile: "driving-car" as const,
  };
  return API.routeEstimate(payload);
},

  // ---------------- LOADS / MARKET ----------------
  getLoads: async () => API.getMarketLoads(),
  getMarketLoads: async () => API.getMarketLoads(),

  submitOffer: async (loadId: string, offer: any) => API.placeBid(loadId, offer),
  placeBidOnLoad: async (loadId: string, offer: any) => API.placeBid(loadId, offer),

  // ---------------- CLIENT REQUESTS ----------------
  getRequests: async (owner_id: string) => {
    const id = (owner_id || "").trim();
    if (!id) return [];
    // Nota: el backend seguro va a ignorar owner_id si el rol no es admin
    return API.getClientRequests({ owner_id: id });
  },

  getAssignedToCarrier: async (carrier_id: string) => {
    const id = (carrier_id || "").trim();
    if (!id) return [];
    return API.getClientRequests({ assigned_carrier_id: id });
  },

  saveRequest: async (data: any) => {
    // owner_id lo usa tu frontend, pero el backend seguro debería tomar owner_id desde el token
    const owner_id = String(data?.owner_id || "").trim();
    if (!owner_id) throw new Error("owner_id requerido");

    const origin = String(data?.origin || "").trim();
    const destination = String(data?.destination || "").trim();
    if (!origin || !destination) throw new Error("origin y destination requeridos");

    const payload: CreateClientRequestPayload = {
      owner_id,
      origin,
      destination,
      vehicle_year: clamp(safeNumber(data?.vehicle_year, 2024), 1900, 2100),
      vehicle_make: String(data?.vehicle_make || "").trim(),
      vehicle_model: String(data?.vehicle_model || "").trim(),
      target_price: clamp(safeNumber(data?.target_price, 0), 0, 10_000_000),
    };

    // si viene de autocomplete
    if (data?.origin_obj?.lat && data?.origin_obj?.lng) payload.origin_obj = data.origin_obj;
    if (data?.destination_obj?.lat && data?.destination_obj?.lng) payload.destination_obj = data.destination_obj;

    if (data?.metadata_json) payload.metadata_json = data.metadata_json;

    return API.createClientRequest(payload);
  },

  assignCarrier: async (loadId: string, carrierId: string) => {
    const lid = String(loadId || "").trim();
    const cid = String(carrierId || "").trim();
    if (!lid || !cid) throw new Error("loadId y carrierId requeridos");
    return API.assignCarrier(lid, cid);
  },

  // ---------------- TRUCKS / DRIVERS ----------------
  getTrucks: async (carrierId: string) => API.getTrucks(carrierId),
  getDrivers: async (carrierId: string) => API.getDrivers(carrierId),

  addTruck: async (data: any) => API.addTruck(data),
  addDriver: async (data: any) => API.addDriver(data),

  deleteTruck: async (truckId: string) => API.deleteTruck(truckId),
  deleteDriver: async (driverId: string) => API.deleteDriver(driverId),

  // Alias para pantallas viejas
  saveTruck: async (data: any) => API.addTruck(data),
  saveDriver: async (data: any) => API.addDriver(data),

  // ---------------- AUTH ----------------
  changePassword: async (data: { current_password: string; new_password: string }) =>
    API.changePassword(data),

  // ---------------- ACCOUNTING (placeholder) ----------------
  getTrips: async (_ownerId: string) => {
    return [];
  },
  getTransactions: async () => {
    return [];
  },

  // ---------------- DEV ----------------
  resetSystem: async () => API.resetSystem(),
};
