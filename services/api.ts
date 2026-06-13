// /services/api.ts
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type OrsSuggestion = {
  label: string;
  formatted: string;
  place_id: string;
  lat: number;
  lng: number;
  raw?: any;
};

export type RoutePoint = {
  lat: number;
  lng?: number; // front usa esto
  lon?: number; // algunos backends usan esto
};

export type RouteEstimatePayload = {
  origin?: RoutePoint;
  destination?: RoutePoint;

  origin_obj?: RoutePoint & { formatted?: string; place_id?: string };
  destination_obj?: RoutePoint & { formatted?: string; place_id?: string };

  profile?: "driving-hgv" | "driving-car";
};

export type RouteEstimateResponse = {
  routing: {
    profile_used: "driving-hgv" | "driving-car";
    distance_meters: number;
    distance_miles: number;
    duration_seconds: number;
    geojson?: any;
    provider: "openrouteservice";
  };
  eta?: {
    avg_speed_mph?: number;
    buffer_seconds?: number;
    breaks_count?: number;
    break_seconds?: number;
    eta_seconds?: number;
  };
};

export type CreateClientRequestPayload = {
  owner_id: string;
  origin: string;
  destination: string;
  vehicle_year?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  target_price?: number;

  origin_obj?: { formatted: string; lat: number; lng: number; place_id?: string };
  destination_obj?: { formatted: string; lat: number; lng: number; place_id?: string };

  metadata_json?: any;
};

export type UserRole = "admin" | "carrier" | "client" | "dealer" | "driver" | "tow";

export type User = {
  id: string;
  name?: string;
  role: UserRole;
  email?: string;
  status?: string;
};

export type LoginResponse = {
  access_token?: string;
  token?: string;
  token_type?: string;
  jwt?: string;
  authToken?: string;
  must_change_password?: boolean;
  user: User;
};

export type RegisterResponse = {
  id: string;
  status: string;
  kyc_token?: string;
  message?: string;
};

export type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export type PendingCompany = {
  id: string;
  display_name: string;
  legal_name: string;
  type: string;
  state?: string;
  approval_status: string;
};

export type PendingPayload = {
  users: PendingUser[];
  companies: PendingCompany[];
};

// ----------- TOKEN HELPERS -----------

function readToken(): string {
  const t1 = localStorage.getItem("autologix_token") || "";
  if (t1) return t1.trim();

  const t2 =
    localStorage.getItem("access_token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("token") ||
    "";
  return (t2 || "").trim();
}

function readKycToken(): string {
  return (localStorage.getItem("autologix_kyc_token") || "").trim();
}

function saveTokenFromLogin(resp: LoginResponse) {
  const token =
    resp?.token ||
    resp?.access_token ||
    resp?.jwt ||
    resp?.authToken ||
    "";

  if (token) localStorage.setItem("autologix_token", token);
}

function clearAuth() {
  localStorage.removeItem("autologix_token");
  localStorage.removeItem("autologix_kyc_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("jwt");
  localStorage.removeItem("token");
}

// ----------- API CLIENT -----------

class ApiClient {
  private baseUrl: string;

  constructor() {
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    // Local dev -> backend directo
    // Prod -> mismo dominio (Nginx proxya /api -> 127.0.0.1:8080)
    this.baseUrl = isLocal ? "http://localhost:8080" : "";
  }

  private buildUrl(path: string) {
    const p = path.startsWith("/") ? path : `/${path}`;
    if (p.startsWith("/api/")) return `${this.baseUrl}${p}`;
    return `${this.baseUrl}/api${p}`;
  }

  private async parseResponse(res: Response) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await res.json();
    return { text: await res.text() };
  }

  async request<T = any>(
    path: string,
    method: HttpMethod = "GET",
    body?: any,
    opts?: { useKycToken?: boolean }
  ): Promise<T> {
    const url = this.buildUrl(path);

    const token = opts?.useKycToken ? readKycToken() : readToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
    });

    const data: any = await this.parseResponse(res);

    if (!res.ok) {
      const msg =
        data?.detail ||
        data?.message ||
        data?.text ||
        `HTTP ${res.status} ${res.statusText}`;

      // Auto-logout en auth errors (evita estados raros)
      if (res.status === 401) {
        clearAuth();
      }

      const err: any = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data as T;
  }

  // ✅ helpers para que AdminConsole pueda usar api.get/api.post
  get<T = any>(path: string): Promise<T> {
    return this.request<T>(path, "GET");
  }
  post<T = any>(path: string, body?: any, opts?: { useKycToken?: boolean }): Promise<T> {
    return this.request<T>(path, "POST", body, opts);
  }
  put<T = any>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, "PUT", body);
  }
  patch<T = any>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, "PATCH", body);
  }
  delete<T = any>(path: string): Promise<T> {
    return this.request<T>(path, "DELETE");
  }

  async getHealth() {
    return this.request("/health", "GET"); // -> /api/health
  }
}

export const api = new ApiClient();

// ----------- HIGH LEVEL API -----------

export const API = {
  // Health
  getHealth: () => api.getHealth(),

  // Auth
  login: async (data: { email: string; password: string }) => {
    const resp = await api.request<LoginResponse>("/auth/login", "POST", data);
    saveTokenFromLogin(resp);
    return resp;
  },
    
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.request("/auth/change-password", "POST", data),

  // Users
  register: (data: any) => api.request<RegisterResponse>("/users", "POST", data),
  getUsers: () => api.request("/users", "GET"),

  // ✅ Admin approvals
  getPendingApprovals: () => api.request<PendingPayload>("/admin/pending", "GET"),
  approveUser: (userId: string, approve: boolean) =>
    api.request(`/admin/users/${encodeURIComponent(userId)}/approve`, "POST", { approve }),
  approveCompany: (companyId: string, approve: boolean) =>
    api.request(`/admin/companies/${encodeURIComponent(companyId)}/approve`, "POST", { approve }),

  // Market / Loads
  getMarketLoads: () => api.request("/market-loads", "GET"),
  placeBid: (loadId: string, offer: any) =>
    api.request(`/loads/${encodeURIComponent(loadId)}/bid`, "POST", offer),

  acceptOffer: (loadId: string, bidderId: string) =>
    api.request(
      `/loads/${encodeURIComponent(loadId)}/offers/${encodeURIComponent(bidderId)}/accept`,
      "POST"
    ),

  rejectOffer: (loadId: string, bidderId: string) =>
    api.request(
      `/loads/${encodeURIComponent(loadId)}/offers/${encodeURIComponent(bidderId)}/reject`,
      "POST"
    ),

  // Client Requests
  getClientRequests: (params: { owner_id?: string; assigned_carrier_id?: string }) => {
    const usp = new URLSearchParams();
    if (params.owner_id) usp.set("owner_id", params.owner_id);
    if (params.assigned_carrier_id) usp.set("assigned_carrier_id", params.assigned_carrier_id);
    const qs = usp.toString();
    return api.request(`/client-requests${qs ? `?${qs}` : ""}`, "GET");
  },

  createClientRequest: (payload: CreateClientRequestPayload) =>
    api.request("/client-requests", "POST", payload),

  assignCarrier: (loadId: string, carrier_id: string) =>
    api.request(`/client-requests/${encodeURIComponent(loadId)}/assign`, "PUT", { carrier_id }),

  // ORS via backend
  geoAutocomplete: (q: string, limit = 8) =>
    api.request<{ results: OrsSuggestion[] }>(
      `/geo/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`,
      "GET"
    ),

  routeEstimate: (payload: RouteEstimatePayload) =>
    api.request<RouteEstimateResponse>("/route/estimate", "POST", payload),

  // Trucks / Drivers
  getTrucks: (carrierId: string) =>
    api.request(`/trucks/${encodeURIComponent(carrierId)}`, "GET"),
  addTruck: (data: any) => api.request("/trucks", "POST", data),
  deleteTruck: (truckId: string) =>
    api.request(`/trucks/${encodeURIComponent(truckId)}`, "DELETE"),

  getDrivers: (carrierId: string) =>
    api.request(`/drivers/${encodeURIComponent(carrierId)}`, "GET"),
  addDriver: (data: any) => api.request("/drivers", "POST", data),
  deleteDriver: (driverId: string) =>
    api.request(`/drivers/${encodeURIComponent(driverId)}`, "DELETE"),

  // System (dev)
  resetSystem: () => api.request("/system/reset", "POST"),

  // ----------- KYC / INSPECTIONS (usa KYC token) -----------

  createKycSubmission: () =>
    api.request<{ inspection_id: string; status: string }>(
      "/inspections",
      "POST",
      { metadata_json: { kind: "KYC" } },
      { useKycToken: true }
    ),

  presignKyc: (inspectionId: string, files: any[]) =>
    api.request<{ uploads: any[] }>(
      `/inspections/${encodeURIComponent(inspectionId)}/presign`,
      "POST",
      { files },
      { useKycToken: true }
    ),

  registerKycMedia: (inspectionId: string, payload: any) =>
    api.request(
      `/inspections/${encodeURIComponent(inspectionId)}/media`,
      "POST",
      payload,
      { useKycToken: true }
    ),

  getKycSubmission: (inspectionId: string) =>
    api.request(
      `/inspections/${encodeURIComponent(inspectionId)}`,
      "GET",
      undefined,
      { useKycToken: true }
    ),
};
