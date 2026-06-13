// ClientOnboarding.tsx
import React, { useMemo, useState } from "react";
import { API } from "../services/api";

type KycFileKind =
  | "ID_FRONT"
  | "ID_BACK"
  | "SELFIE_FRONT"
  | "SELFIE_LEFT"
  | "SELFIE_RIGHT"
  | "GESTURE"
  | "VIDEO";

type LocalKycFile = {
  kind: KycFileKind;
  type: "photo" | "video";
  file: File;
};

const kindsOrder: KycFileKind[] = [
  "ID_FRONT",
  "ID_BACK",
  "SELFIE_FRONT",
  "SELFIE_LEFT",
  "SELFIE_RIGHT",
  "GESTURE",
  "VIDEO",
];

export default function ClientOnboarding() {
  const [step, setStep] = useState<"REGISTER" | "KYC" | "DONE">("REGISTER");

  // Register form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // KYC
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [files, setFiles] = useState<LocalKycFile[]>([]);

  const missingKinds = useMemo(() => {
    const have = new Set(files.map((f) => f.kind));
    return kindsOrder.filter((k) => !have.has(k));
  }, [files]);

  const onPick = (kind: KycFileKind, type: "photo" | "video") => (e: any) => {
    const f: File | undefined = e?.target?.files?.[0];
    if (!f) return;

    setFiles((prev) => {
      const next = prev.filter((x) => x.kind !== kind);
      next.push({ kind, type, file: f });
      return next;
    });
  };

  async function doRegister() {
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      const res = await API.register({
        name,
        email,
        password,
        phone,
        role: "client",
      });

      // ✅ guarda token KYC (si backend lo manda)
      if (res.kyc_token) {
        localStorage.setItem("autologix_kyc_token", res.kyc_token);
      }

      // mensaje correcto
      setMsg(
        res.message ||
          "Cuenta creada. Tu cuenta queda PENDIENTE de preaprobación. Completa la verificación (KYC)."
      );

      // crear submission de KYC (requiere KYC token)
      const kyc = await API.createKycSubmission();
      setInspectionId(kyc.inspection_id);

      setStep("KYC");
    } catch (e: any) {
      setErr(e?.message || "Error creando la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadAll() {
    if (!inspectionId) {
      setErr("KYC submission no creado.");
      return;
    }
    if (missingKinds.length > 0) {
      setErr(`Faltan: ${missingKinds.join(", ")}`);
      return;
    }

    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      // 1) presign (tu backend no devuelve kind -> lo resolvemos por orden)
      const pres = await API.presignKyc(
        inspectionId,
        files.map((f) => ({
          type: f.type,
          filename: f.file.name,
          content_type: f.file.type || "application/octet-stream",
        }))
      );

      if (!pres?.uploads?.length || pres.uploads.length !== files.length) {
        throw new Error("Presign inválido: cantidad de uploads no coincide.");
      }

      // 2) upload + register por índice (orden)
      for (let i = 0; i < pres.uploads.length; i++) {
        const u = pres.uploads[i];
        const local = files[i];

        const putRes = await fetch(u.url, {
          method: "PUT",
          body: local.file,
          headers: {
            "Content-Type": local.file.type || "application/octet-stream",
          },
        });

        if (!putRes.ok) {
          throw new Error(`Upload failed (${local.kind})`);
        }

        // 3) register media
        await API.registerKycMedia(inspectionId, {
          type: local.type,
          key: u.key,
          url: u.public_url, // tu backend lo devuelve
          meta: { kind: local.kind },
        });
      }

      setMsg(
        "✅ Documentación enviada. Tu cuenta queda PENDIENTE hasta que el administrador revise y apruebe."
      );
      setStep("DONE");
    } catch (e: any) {
      setErr(e?.message || "Error subiendo documentación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">
            CLIENT <span className="text-blue-500">ONBOARDING</span>
          </h1>
          <div className="text-xs text-slate-400 font-black uppercase tracking-[0.25em]">
            {step === "REGISTER" ? "STEP 1" : step === "KYC" ? "STEP 2" : "DONE"}
          </div>
        </div>

        {msg && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-200 text-sm">
            {msg}
          </div>
        )}
        {err && (
          <div className="mt-6 p-4 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-200 text-sm">
            {err}
          </div>
        )}

        {step === "REGISTER" && (
          <div className="mt-8 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800"
                placeholder="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <input
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              disabled={loading}
              onClick={doRegister}
              className="w-full mt-2 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black tracking-wide disabled:opacity-50"
            >
              {loading ? "CREATING..." : "CREATE ACCOUNT"}
            </button>

            <p className="text-xs text-slate-400 mt-2">
              Al crear tu cuenta, quedas en <b>PENDING</b> hasta que el administrador apruebe.
            </p>
          </div>
        )}

        {step === "KYC" && (
          <div className="mt-8 space-y-6">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-sm font-black uppercase tracking-widest text-slate-300">
                SUBIR DOCUMENTOS (KYC)
              </div>
              <div className="text-xs text-slate-400 mt-2">
                Debes subir: ID (frente/atrás), selfies (frente/izq/der), gesto y video.
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {kindsOrder.map((k) => {
                const isVideo = k === "VIDEO" || k === "GESTURE";
                const label =
                  k === "ID_FRONT"
                    ? "ID FRONT"
                    : k === "ID_BACK"
                    ? "ID BACK"
                    : k === "SELFIE_FRONT"
                    ? "SELFIE FRONT"
                    : k === "SELFIE_LEFT"
                    ? "SELFIE LEFT"
                    : k === "SELFIE_RIGHT"
                    ? "SELFIE RIGHT"
                    : k === "GESTURE"
                    ? "GESTURE (VIDEO)"
                    : "VIDEO";

                const current = files.find((x) => x.kind === k)?.file;

                return (
                  <div key={k} className="p-5 rounded-3xl bg-slate-950 border border-slate-800">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-300">
                      {label}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 truncate">
                      {current ? current.name : "No file selected"}
                    </div>
                    <input
                      className="mt-3 w-full text-xs"
                      type="file"
                      accept={isVideo ? "video/*" : "image/*"}
                      onChange={onPick(k, isVideo ? "video" : "photo")}
                    />
                  </div>
                );
              })}
            </div>

            <button
              disabled={loading}
              onClick={uploadAll}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-black tracking-wide disabled:opacity-50"
            >
              {loading ? "UPLOADING..." : "SUBMIT VERIFICATION"}
            </button>

            <div className="text-xs text-slate-400">
              KYC ID: <span className="font-mono text-slate-200">{inspectionId || "..."}</span>
            </div>
          </div>
        )}

        {step === "DONE" && (
          <div className="mt-10 text-center">
            <div className="text-3xl font-black">✅ DONE</div>
            <div className="text-slate-300 mt-3">
              Tu cuenta está <b>PENDIENTE</b>. El administrador revisará tus documentos y luego aprobará.
            </div>
            <button
              className="mt-8 px-6 py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-900"
              onClick={() => (window.location.href = "/")}
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
