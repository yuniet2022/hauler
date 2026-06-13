import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Camera,
  ArrowRight,
  CheckCircle,
  Lock,
  Loader2,
  AlertTriangle,
  ScanFace,
} from "lucide-react";
import { DatabaseService } from "../services/database";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

interface ClientRegistrationProps {
  onComplete: () => void;
  onCancel: () => void;
}

const ClientRegistration: React.FC<ClientRegistrationProps> = ({
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState(1);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const [movementUp, setMovementUp] = useState(false);
  const [movementLeft, setMovementLeft] = useState(false);
  const [movementRight, setMovementRight] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const movementPassed = movementUp && movementLeft && movementRight;
  const cameraBlocked = errorStatus === "CAMERA_ERROR";
  useEffect(() => {
    if (step !== 3) return;

    let stream: MediaStream | null = null;
    let cancelled = false;

    const startCamera = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 720 },
            height: { ideal: 1280 },
            aspectRatio: { ideal: 0.5625 },
          },
          audio: false,
        });

        if (!videoRef.current || cancelled) return;

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);

        const tick = () => {
          if (!videoRef.current || !landmarkerRef.current) {
            animationRef.current = requestAnimationFrame(tick);
            return;
          }

          const result = landmarkerRef.current.detectForVideo(
            videoRef.current,
            performance.now()
          );

          const face = result.faceLandmarks?.[0];
          if (face && face.length > 200) {
            const nose = face[1];
            const leftCheek = face[234];
            const rightCheek = face[454];
            const forehead = face[10];
            const chin = face[152];

            const faceWidth = Math.abs(rightCheek.x - leftCheek.x) || 1;
            const faceHeight = Math.abs(chin.y - forehead.y) || 1;

            const centerX = (leftCheek.x + rightCheek.x) / 2;
            const centerY = (forehead.y + chin.y) / 2;

            const yaw = (nose.x - centerX) / faceWidth;
            const pitch = (nose.y - centerY) / faceHeight;

            if (pitch < -0.08) setMovementUp(true);
            if (yaw < -0.08) setMovementLeft(true);
            if (yaw > 0.08) setMovementRight(true);
          }

          animationRef.current = requestAnimationFrame(tick);
        };

        animationRef.current = requestAnimationFrame(tick);
      } catch {
        setErrorStatus("CAMERA_ERROR");
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setCameraReady(false);
    };
  }, [step]);

  const captureSelfie = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
    );

    if (blob) {
      setSelfieBlob(blob);
      alert("Selfie captured successfully.");
    }
  };

  const uploadClientVerification = async (kycToken: string) => {
    if (!licenseFile) throw new Error("License image is required.");
    if (!selfieBlob) throw new Error("Selfie is required.");
    if (!movementPassed) {
      throw new Error("Face movement check not completed.");
    }

    const form = new FormData();
    form.append("license_image", licenseFile);
    form.append(
      "selfie_image",
      new File([selfieBlob], "selfie.jpg", { type: "image/jpeg" })
    );
    form.append("movement_passed", String(movementPassed));

    const res = await fetch("/api/client-kyc/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kycToken}`,
      },
      body: form,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.detail || "Client verification failed");
    }

    return data;
  };

  const rollbackClientRegistration = async (kycToken: string) => {
    try {
      await fetch("/api/client-kyc/rollback", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${kycToken}`,
        },
      });
    } catch {
      // ignore rollback errors
    }
  };

const handleFinalSubmit = async () => {
  setErrorStatus(null);

  if (!formData.fullName || !formData.email || !formData.phone) {
    alert("Please complete all required fields.");
    return;
  }

  if (!licenseFile) {
    alert("Please upload your driver license image.");
    return;
  }

  if (cameraBlocked) {
    alert(
      "This device does not have a working camera. Please use another device to complete facial verification."
    );
    return;
  }

  if (!selfieBlob) {
    alert("Please capture your selfie.");
    return;
  }

  if (!movementPassed) {
    alert("You must complete the face movements: up, left, right.");
    return;
  }

  if (!formData.password || !formData.confirmPassword) {
    alert("Please enter your password.");
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  if (formData.password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  setIsSubmitting(true);

  const userData = {
    name: formData.fullName,
    email: formData.email,
    password: formData.password,
    role: "client",
    phone: formData.phone,
  };

  let kycToken = "";

  try {
    const result: any = await DatabaseService.registerUser(userData);

    if (!result?.kyc_token) {
      throw new Error("KYC token missing after registration.");
    }

    kycToken = result.kyc_token;

    const verification = await uploadClientVerification(kycToken);

    if (verification?.provisional_access === true) {
      alert(
        `Face match approved (${verification.similarity_score}%). You can log in provisionally while admin review remains pending.`
      );
      onComplete();
      return;
    }

    // IMPORTANTE:
    // Menor de 75 NO es fallo. Solo queda pendiente de aprobación manual.
    alert(
      `Face match below threshold (${verification.similarity_score}%). Your account was created successfully and is now pending mandatory admin approval before login.`
    );
    onComplete();
  } catch (e: any) {
    const msg = (e?.message || "").toLowerCase();

    // SOLO rollback en errores reales de verificación
    const mustRollback =
      msg.includes("no_face_found_in_license") ||
      msg.includes("no_face_found_in_selfie") ||
      msg.includes("license_image_must_be_image") ||
      msg.includes("selfie_image_must_be_image") ||
      msg.includes("client_verification_failed");

    if (kycToken && mustRollback) {
      await rollbackClientRegistration(kycToken);
    }

    if (mustRollback) {
      alert(
        "Facial recognition failed. Please create the account again and make sure to upload the correct information."
      );
      onCancel();
      return;
    }

    if (msg.includes("email_already_exists")) {
      alert("This email is already in use.");
      return;
    }

    setErrorStatus("CONNECTION_ERROR");
    alert("Registration failed. Please try again.");
    onCancel();
  } finally {
    setIsSubmitting(false);
  }
};
return (
  <div className="min-h-screen w-full bg-slate-950 relative">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10" />

    <div className="min-h-screen w-full flex items-center justify-center px-3 py-4 md:px-6 md:py-8">
      <div className="w-full max-w-lg md:max-w-xl bg-slate-900/95 border border-slate-800 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[96vh]">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 md:top-5 md:right-5 text-slate-500 hover:text-white transition-all z-20"
        >
          ✕
        </button>

        {/* HEADER FIJO */}
        <div className="shrink-0 px-5 pt-6 pb-4 md:px-10 md:pt-10 md:pb-6">
          <div className="text-center">
            <div className="inline-flex p-4 bg-blue-600/10 rounded-3xl border border-blue-500/20 mb-5 md:mb-6">
              <User className="text-blue-500" size={32} />
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
              Client <span className="text-blue-600">Onboarding</span>
            </h1>

            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 italic">
              Face Match + Liveness
            </p>
          </div>

          {errorStatus && (
            <div className="mt-6 p-4 md:p-5 bg-red-500/10 border border-red-500/20 rounded-2xl md:rounded-3xl flex items-center gap-3 text-red-500">
              <AlertTriangle size={22} />
              <div className="text-[10px] font-black uppercase tracking-widest">
                {errorStatus === "CAMERA_ERROR"
                  ? "Camera initialization failed."
                  : "Registration or verification error."}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6 md:mt-8">
            <div
              className={`h-1 flex-1 rounded-full ${
                step >= 1 ? "bg-blue-600" : "bg-slate-800"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full ${
                step >= 2 ? "bg-blue-600" : "bg-slate-800"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full ${
                step >= 3 ? "bg-blue-600" : "bg-slate-800"
              }`}
            />
          </div>
        </div>

        {/* CONTENIDO CON SCROLL */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 md:px-10 md:pb-10">
          {step === 1 && (
            <div className="space-y-5 md:space-y-6">
              <div className="relative">
                <User
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700"
                  size={18}
                />
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 md:py-5 pl-14 pr-4 text-white outline-none focus:border-blue-500"
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>

              <div className="relative">
                <Mail
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700"
                  size={18}
                />
                <input
                  type="email"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 md:py-5 pl-14 pr-4 text-white outline-none focus:border-blue-500"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="relative">
                <Phone
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700"
                  size={18}
                />
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 md:py-5 pl-14 pr-4 text-white outline-none focus:border-blue-500"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 md:py-6 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center gap-3 transition-all"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 md:space-y-6">
              <label className="block w-full border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 md:p-8 text-center cursor-pointer bg-slate-900/40 transition-all">
                <input
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                />

                {licenseFile ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-[10px] uppercase break-all">
                    <CheckCircle size={20} /> {licenseFile.name}
                  </div>
                ) : (
                  <>
                    <Camera className="mx-auto mb-3 text-slate-700" size={32} />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      Upload Driver License Image
                    </span>
                  </>
                )}
              </label>

              <p className="text-xs text-slate-500 leading-relaxed">
                Upload a clear image of your driver license. PDFs are not allowed
                for face match.
              </p>

              <div className="flex gap-3 md:gap-4 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 md:px-8 text-slate-600 font-black uppercase text-[10px] tracking-widest"
                >
                  Back
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 md:py-6 rounded-2xl transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 md:space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 md:p-5">
                <div className="flex items-center gap-2 text-white font-black uppercase text-sm mb-4">
                  <ScanFace size={18} />
                  Liveness Check
                </div>

                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full max-w-[320px] md:max-w-[360px] mx-auto h-[300px] md:h-[380px] rounded-2xl bg-black object-cover"
                />

                <canvas ref={canvasRef} className="hidden" />

                <div className="grid grid-cols-3 gap-2 mt-4 text-[11px]">
                  <div
                    className={`rounded-xl p-3 text-center ${
                      movementUp
                        ? "bg-emerald-600/20 text-emerald-400"
                        : "bg-slate-900 text-slate-400"
                    }`}
                  >
                    Look Up
                  </div>
                  <div
                    className={`rounded-xl p-3 text-center ${
                      movementLeft
                        ? "bg-emerald-600/20 text-emerald-400"
                        : "bg-slate-900 text-slate-400"
                    }`}
                  >
                    Look Left
                  </div>
                  <div
                    className={`rounded-xl p-3 text-center ${
                      movementRight
                        ? "bg-emerald-600/20 text-emerald-400"
                        : "bg-slate-900 text-slate-400"
                    }`}
                  >
                    Look Right
                  </div>
                </div>

                <button
                  onClick={captureSelfie}
                  disabled={!cameraReady || !movementPassed}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all"
                >
                  Capture Final Selfie
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Lock
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700"
                    size={18}
                  />
                  <input
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 md:py-5 pl-14 pr-4 text-white outline-none focus:border-blue-500"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>

                <div className="relative">
                  <Lock
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700"
                    size={18}
                  />
                  <input
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 md:py-5 pl-14 pr-4 text-white outline-none focus:border-blue-500"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 md:py-7 rounded-[1.75rem] md:rounded-[2.5rem] flex items-center justify-center gap-3 disabled:opacity-40 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    Finalize Registration <CheckCircle size={24} />
                  </>
                )}
              </button>

              <div className="h-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};
export default ClientRegistration;
