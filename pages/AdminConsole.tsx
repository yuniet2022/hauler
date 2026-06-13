import React, { useEffect, useMemo, useState } from "react";
import {
  Server,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

import { api } from "../services/api";

/* =======================
   Types
======================= */

type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type PendingCompany = {
  id: string;
  display_name: string;
  legal_name: string;
  type: string;
  state?: string;
  city?: string;
  address1?: string;
  zip?: string;
  phone?: string;
  dot_number?: string;
  mc_number?: string;
  approval_status: string;
  owner?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
  };
  docs_count?: number;
};

type PendingPayload = {
  users: PendingUser[];
  companies: PendingCompany[];
};

type KycAsset = {
  id: string;
  kind: string;
  url: string;
  file_name: string;
  content_type?: string;
  status?: string;
  created_at?: string;
};

type KycSubmission = {
  company_name: string;
  company_type: string;
  approval_status: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  dot_number?: string;
  mc_number?: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
};

type KycPayload = {
  has_kyc: boolean;
  submission?: KycSubmission;
  assets: KycAsset[];
  face_verification?: {
    movement_passed: boolean;
    similarity_score: number;
    face_distance: number;
    provisional_access: boolean;
    admin_review_status: string;
    notes?: string | null;
  };
};

/* =======================
   Helpers
======================= */

const isImageFile = (contentType?: string, fileName?: string) => {
  if (contentType?.startsWith("image/")) return true;
  const lower = (fileName || "").toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
};

/* =======================
   Component
======================= */

const AdminConsole: React.FC = () => {
  const [serverStatus, setServerStatus] = useState({
    online: false,
    db: "Scanning...",
    node: "Nginx Proxy",
  });

  const [loading, setLoading] = useState(true);

  const [pending, setPending] = useState<PendingPayload>({
    users: [],
    companies: [],
  });

  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [kycOpen, setKycOpen] = useState(false);
  const [kycUser, setKycUser] = useState<PendingUser | null>(null);
  const [kycData, setKycData] = useState<KycPayload | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  const getDocLabel = (kind: string, companyType?: string) => {
    if (companyType && companyType !== "CLIENT") {
      if (kind === "OWNER_LICENSE") return "OWNER DRIVER LICENSE";
      if (kind === "INSURANCE") return "INSURANCE";
      if (kind === "AUTHORITY") return "AUTHORITY / MC";
    }

    if (kind === "CLIENT_LICENSE") return "DRIVER LICENSE";
    if (kind === "CLIENT_SELFIE") return "SELFIE";

    return kind.split("_").join(" ");
  };

  const uniqueAssets = useMemo(() => {
    const seen = new Set<string>();
    const assets = kycData?.assets || [];

    return assets.filter((a) => {
      const key = `${a.kind}|${a.file_name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [kycData]);

  const openProtectedDocument = async (url: string, fileName: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Admin token missing");

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Failed to open document");
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err: any) {
      alert(err?.message || "Could not open file");
    }
  };

  const checkHealth = async () => {
    try {
      const h = await api.getHealth();
      setServerStatus({
        online: true,
        db: h?.db || "PostgreSQL",
        node: h?.node || "AutoLogix Core",
      });
    } catch {
      setServerStatus({
        online: false,
        db: "Unreachable",
        node: "Proxy Error",
      });
    }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get<PendingPayload>("/api/admin/pending");
      setPending({
        users: res.users || [],
        companies: res.companies || [],
      });
    } catch {
      setPending({ users: [], companies: [] });
    }
  };

  const approveUser = async (id: string, approve: boolean) => {
    setBusyId(id);
    try {
      await api.post(`/api/admin/users/${id}/approve`, { approve });
      closeKyc();
      await fetchPending();
    } finally {
      setBusyId(null);
    }
  };

  const approveCompany = async (id: string, approve: boolean) => {
    setBusyId(id);
    try {
      await api.post(`/api/admin/companies/${id}/approve`, { approve });
      await fetchPending();
    } finally {
      setBusyId(null);
    }
  };

  const openKyc = async (u: PendingUser) => {
    setKycUser(u);
    setKycOpen(true);
    setKycLoading(true);
    setKycError(null);
    setKycData(null);

    try {
      const data = await api.get<KycPayload>(`/api/admin/users/${u.id}/kyc`);
      setKycData(data);
    } catch (e: any) {
      setKycError(e.message || "Failed to load KYC");
      setKycData(null);
    } finally {
      setKycLoading(false);
    }
  };
 const closeKyc = () => {
  setKycOpen(false);
  setKycUser(null);
  setKycData(null);
  setKycError(null);
  setKycLoading(false);
};
  useEffect(() => {
    (async () => {
      setLoading(true);
      await checkHealth();
      await fetchPending();
      setLoading(false);
    })();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return pending.users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [pending.users, search]);

  const filteredCompanies = useMemo(() => {
    const q = search.toLowerCase();
    return pending.companies.filter(
      (c) =>
        c.legal_name.toLowerCase().includes(q) ||
        c.display_name.toLowerCase().includes(q) ||
        (c.owner?.email || "").toLowerCase().includes(q) ||
        (c.owner?.name || "").toLowerCase().includes(q)
    );
  }, [pending.companies, search]);

return (
  <div className="w-full min-h-screen overflow-x-hidden space-y-6 pb-20 px-4 md:px-6 lg:px-8">
    {/* HEADER */}
    <div className="bg-slate-900 border border-slate-800 p-4 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem]">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          <Server size={36} className="shrink-0 md:w-[42px] md:h-[42px]" />
          <div className="min-w-0">
            <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic leading-tight break-words">
              Admin Control
            </h2>
            <p className="text-xs text-slate-500 break-words">
              {serverStatus.online ? "ONLINE" : "OFFLINE"} · {serverStatus.node}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full md:w-[240px] bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none"
            />
          </div>

          <button
            onClick={fetchPending}
            className="shrink-0 p-3 rounded-xl bg-slate-950 border border-slate-800"
            type="button"
          >
            <RefreshCcw className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>

    {/* USERS */}
    <div className="bg-slate-900 border border-slate-800 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem]">
      <div className="flex items-center gap-3 mb-6">
        <Users className="shrink-0" />
        <h3 className="font-black uppercase text-sm md:text-base">
          User Pre-Approvals
        </h3>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-slate-500 text-sm">No pending users.</div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="p-4 md:p-5 bg-slate-950 rounded-xl flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center"
            >
              <div className="min-w-0">
                <div className="font-black break-words">{u.name}</div>
                <div className="text-xs text-slate-500 break-all">{u.email}</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <button
                  onClick={() => openKyc(u)}
                  className="px-4 py-2 bg-slate-800 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto"
                  type="button"
                >
                  <ImageIcon size={16} /> Docs
                </button>

                <button
                  disabled={busyId === u.id}
                  onClick={() => approveUser(u.id, true)}
                  className="px-4 py-2 bg-emerald-600 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-60"
                  type="button"
                >
                  <CheckCircle2 size={16} /> Approve
                </button>

                <button
                  disabled={busyId === u.id}
                  onClick={() => approveUser(u.id, false)}
                  className="px-4 py-2 bg-red-600 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-60"
                  type="button"
                >
                  <XCircle size={16} /> Disable
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* COMPANIES */}
    <div className="bg-slate-900 border border-slate-800 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem]">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="shrink-0" />
        <h3 className="font-black uppercase text-sm md:text-base">
          Company Pre-Approvals
        </h3>
      </div>

      {filteredCompanies.length === 0 ? (
        <div className="text-slate-500 text-sm">No pending companies.</div>
      ) : (
        <div className="space-y-3">
          {filteredCompanies.map((c) => (
            <div
              key={c.id}
              className="p-4 md:p-5 bg-slate-950 rounded-xl flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center"
            >
              <div className="min-w-0">
                <div className="font-black break-words">{c.legal_name}</div>
                <div className="text-xs text-slate-500 break-words">
                  {c.display_name}
                </div>
                <div className="text-xs text-slate-600 uppercase break-words">
                  {c.type} · {c.approval_status}
                </div>
                <div className="text-xs text-slate-500 break-words">
                  DOT: {c.dot_number || "-"} · MC: {c.mc_number || "-"} · Docs:{" "}
                  {c.docs_count || 0}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                {c.owner?.id && (
                  <button
                    onClick={() =>
                      openKyc({
                        id: c.owner!.id!,
                        name: c.owner?.name || c.legal_name,
                        email: c.owner?.email || "",
                        role: c.type.toLowerCase(),
                        status: c.owner?.status || "PENDING",
                      })
                    }
                    className="px-4 py-2 bg-slate-800 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto"
                    type="button"
                  >
                    <ImageIcon size={16} /> Docs
                  </button>
                )}

                <button
                  disabled={busyId === c.id}
                  onClick={() => approveCompany(c.id, true)}
                  className="px-4 py-2 bg-emerald-600 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-60"
                  type="button"
                >
                  <CheckCircle2 size={16} /> Approve
                </button>

                <button
                  disabled={busyId === c.id}
                  onClick={() => approveCompany(c.id, false)}
                  className="px-4 py-2 bg-red-600 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-60"
                  type="button"
                >
                  <XCircle size={16} /> Disable
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* KYC MODAL */}
    {kycOpen && (
      <div
        className="fixed inset-0 z-[9999] bg-black/70 overflow-y-auto p-3 md:p-6"
        onClick={closeKyc}
      >
        <div
          className="w-full max-w-lg md:max-w-5xl mx-auto my-4 md:my-8 bg-slate-900 rounded-[1.5rem] md:rounded-3xl p-4 md:p-8 max-h-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 mb-6 sticky top-0 bg-slate-900 py-2 z-10">
            <h3 className="font-black uppercase text-sm md:text-xl break-words pr-2">
              KYC — {kycData?.submission?.company_name || kycUser?.name}
            </h3>
            <button
              onClick={closeKyc}
              className="shrink-0 px-3 py-2 rounded-lg bg-slate-800 text-white text-sm"
              type="button"
            >
              Close
            </button>
          </div>

          {kycLoading && <div>Loading…</div>}
          {kycError && <div className="text-red-400">{kycError}</div>}

          {kycData && (
            <div className="space-y-6">
              {kycData?.submission?.company_type === "CLIENT" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <b>Full Name:</b> {kycData.submission?.owner_name}
                  </div>
                  <div className="break-all">
                    <b>Email:</b> {kycData.submission?.owner_email}
                  </div>
                  <div>
                    <b>Phone:</b> {kycData.submission?.owner_phone || "-"}
                  </div>
                  <div>
                    <b>Status:</b> {kycData.submission?.approval_status || "-"}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="break-words">
                    <b>Company:</b> {kycData.submission?.company_name}
                  </div>
                  <div className="break-words">
                    <b>Owner:</b> {kycData.submission?.owner_name}
                  </div>
                  <div>
                    <b>DOT:</b> {kycData.submission?.dot_number || "-"}
                  </div>
                  <div>
                    <b>MC:</b> {kycData.submission?.mc_number || "-"}
                  </div>
                </div>
              )}

              {kycData?.face_verification && (
                <div className="bg-slate-950 rounded-2xl p-4 md:p-5 border border-slate-800">
                  <div className="text-white font-black uppercase mb-4">
                    Face Verification
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-slate-300">
                      <span className="text-slate-500">Movement Passed:</span>{" "}
                      {kycData.face_verification.movement_passed ? "YES" : "NO"}
                    </div>

                    <div className="text-slate-300">
                      <span className="text-slate-500">Similarity Score:</span>{" "}
                      {kycData.face_verification.similarity_score}%
                    </div>

                    <div className="text-slate-300">
                      <span className="text-slate-500">Face Distance:</span>{" "}
                      {kycData.face_verification.face_distance}
                    </div>

                    <div className="text-slate-300">
                      <span className="text-slate-500">Provisional Access:</span>{" "}
                      {kycData.face_verification.provisional_access ? "YES" : "NO"}
                    </div>

                    <div className="text-slate-300">
                      <span className="text-slate-500">Admin Review:</span>{" "}
                      {kycData.face_verification.admin_review_status}
                    </div>

                    <div className="text-slate-300 break-words">
                      <span className="text-slate-500">Notes:</span>{" "}
                      {kycData.face_verification.notes || "-"}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {uniqueAssets.map((a) => (
                  <div key={a.id} className="bg-slate-800 rounded-xl p-4 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="font-bold break-words">
                          {getDocLabel(a.kind, kycData?.submission?.company_type)}
                        </div>
                        <div className="text-xs text-gray-400 break-all">
                          {a.file_name}
                        </div>
                      </div>

                      <button
                        onClick={() => openProtectedDocument(a.url, a.file_name)}
                        className="bg-blue-600 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 w-full sm:w-auto"
                        type="button"
                      >
                        <ExternalLink size={16} />
                        Open
                      </button>
                    </div>

                    {isImageFile(a.content_type, a.file_name) && (
                      <img
                        src={a.url}
                        className="rounded-lg w-full max-h-[280px] object-contain"
                        alt={a.file_name}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);
};

export default AdminConsole;
