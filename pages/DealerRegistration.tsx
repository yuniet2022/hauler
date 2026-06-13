import React, { useState } from "react";
import {
  Building2,
  FileText,
  ArrowRight,
  ShieldCheck,
  Mail,
  Phone,
  Upload,
  Lock,
  Loader2,
  User,
  MapPin,
  BadgeCheck,
} from "lucide-react";
import { DatabaseService } from "../services/database";

interface DealerRegistrationProps {
  onComplete: () => void;
  onCancel: () => void;
}

const DealerRegistration: React.FC<DealerRegistrationProps> = ({
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    licenseNumber: "",
    ein: "",
    dot: "",
    mc: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [files, setFiles] = useState<{
    ownerLicense: File | null;
    insuranceDoc: File | null;
    authorityDoc: File | null;
  }>({
    ownerLicense: null,
    insuranceDoc: null,
    authorityDoc: null,
  });

  const handleFileChange = (
    field: keyof typeof files,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    setFiles((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const uploadKycDocs = async (kycToken: string) => {
    const form = new FormData();

    if (!files.ownerLicense) {
      throw new Error("Owner driver license is required.");
    }

    form.append("owner_license", files.ownerLicense);

    if (files.insuranceDoc) {
      form.append("insurance_doc", files.insuranceDoc);
    }

    if (files.authorityDoc) {
      form.append("authority_doc", files.authorityDoc);
    }

    const res = await fetch("/api/kyc/documents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kycToken}`,
      },
      body: form,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.detail || "KYC upload failed");
    }

    return data;
  };

  const handleSubmit = async () => {
    if (
      !formData.businessName ||
      !formData.ownerName ||
      !formData.email ||
      !formData.password
    ) {
      alert("Missing required fields.");
      return;
    }

    if (
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.zip
    ) {
      alert("Address and phone are required.");
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

    if (!files.ownerLicense) {
      alert("Owner driver license is required.");
      return;
    }

    setLoading(true);

    const dealerData = {
      name: formData.businessName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: "dealer",
      metadata: {
        owner_name: formData.ownerName,
        license: formData.licenseNumber,
        ein: formData.ein,
        dot: formData.dot,
        mc: formData.mc,
        address1: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        registration_date: new Date().toISOString(),
        status: "PENDING_REVIEW",
      },
    };

    try {
      const result: any = await DatabaseService.registerUser(dealerData);

      if (!result?.kyc_token) {
        throw new Error("KYC token missing after registration.");
      }

      await uploadKycDocs(result.kyc_token);

      alert(
        "Your documents have been submitted successfully. After verification, your account will be approved."
      );
      onComplete();
    } catch (e: any) {
      alert(e?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 md:py-5 px-4 text-white outline-none focus:border-purple-500 transition-all";

  const iconInputClass =
    "w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 md:py-5 pl-12 pr-4 text-white outline-none focus:border-purple-500 transition-all";

  const labelClass =
    "text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic";

  const uploadButtonClass =
    "cursor-pointer shrink-0 px-4 py-2 md:px-5 md:py-3 bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase text-purple-400 rounded-xl border border-slate-800 flex items-center gap-2 transition-all text-center";

  return (
    <div className="min-h-screen w-full bg-slate-950 relative overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950 -z-10" />

      <div className="min-h-screen w-full flex items-start justify-center px-3 py-4 md:px-6 md:py-8">
        <div className="w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-[2rem] md:rounded-[2.75rem] shadow-2xl relative flex flex-col max-h-[96vh]">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 md:top-5 md:right-5 text-slate-500 hover:text-white transition-all z-20"
          >
            ✕
          </button>

          <div className="shrink-0 px-5 pt-6 pb-5 md:px-10 md:pt-10 md:pb-7">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2.5rem] bg-purple-500/10 text-purple-400 mb-5 md:mb-6 border border-purple-500/20 shadow-inner">
                <Building2 size={34} className="md:w-10 md:h-10" />
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
                Dealer{" "}
                <span className="text-purple-500 underline underline-offset-8 decoration-2 decoration-purple-500/30">
                  Registry
                </span>
              </h1>

              <p className="text-slate-500 mt-3 text-[10px] font-black uppercase tracking-widest italic">
                Authorized Inventory Partner Access
              </p>
            </div>

            <div className="flex justify-center gap-3 md:gap-4 mt-8 md:mt-10">
              <div
                className={`h-1.5 w-16 md:w-20 rounded-full transition-all duration-500 ${
                  step >= 1
                    ? "bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                    : "bg-slate-800"
                }`}
              />
              <div
                className={`h-1.5 w-16 md:w-20 rounded-full transition-all duration-500 ${
                  step >= 2
                    ? "bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                    : "bg-slate-800"
                }`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-6 md:px-10 md:pb-10">
            {step === 1 && (
              <div className="space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className={labelClass}>Legal Business Name</label>
                    <input
                      className={inputClass}
                      placeholder="Auto Empire LLC"
                      value={formData.businessName}
                      onChange={(e) =>
                        handleInputChange("businessName", e.target.value)
                      }
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className={labelClass}>Owner Full Name</label>
                    <div className="relative">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                        size={18}
                      />
                      <input
                        className={iconInputClass}
                        placeholder="John Smith"
                        value={formData.ownerName}
                        onChange={(e) =>
                          handleInputChange("ownerName", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Dealer License #</label>
                    <input
                      className={inputClass}
                      placeholder="D-123456"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        handleInputChange("licenseNumber", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Tax ID (EIN)</label>
                    <input
                      className={inputClass}
                      placeholder="XX-XXXXXXX"
                      value={formData.ein}
                      onChange={(e) => handleInputChange("ein", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>DOT Number</label>
                    <div className="relative">
                      <BadgeCheck
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                        size={18}
                      />
                      <input
                        className={iconInputClass}
                        placeholder="12345678"
                        value={formData.dot}
                        onChange={(e) => handleInputChange("dot", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>MC Number</label>
                    <div className="relative">
                      <FileText
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                        size={18}
                      />
                      <input
                        className={iconInputClass}
                        placeholder="MC-123456"
                        value={formData.mc}
                        onChange={(e) => handleInputChange("mc", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Business Email</label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                        size={18}
                      />
                      <input
                        className={iconInputClass}
                        placeholder="sales@dealer.com"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Contact Phone</label>
                    <div className="relative">
                      <Phone
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                        size={18}
                      />
                      <input
                        className={iconInputClass}
                        placeholder="(555) 000-0000"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Security Password</label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                        size={18}
                      />
                      <input
                        className={iconInputClass}
                        placeholder="••••••••"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Confirm Password</label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                        size={18}
                      />
                      <input
                        className={iconInputClass}
                        placeholder="••••••••"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className={labelClass}>Primary Lot Address</label>
                    <div className="relative">
                      <MapPin
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                        size={18}
                      />
                      <input
                        className={iconInputClass}
                        placeholder="1234 Auto Park Way"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>City</label>
                    <input
                      className={inputClass}
                      placeholder="Miami"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>State</label>
                    <input
                      className={inputClass}
                      placeholder="FL"
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className={labelClass}>ZIP</label>
                    <input
                      className={inputClass}
                      placeholder="33142"
                      value={formData.zip}
                      onChange={(e) => handleInputChange("zip", e.target.value)}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-5 md:py-6 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center gap-3 md:gap-4 transition-all shadow-xl"
                >
                  Next Step <ArrowRight size={22} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 md:space-y-8">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-1">
                  Business Compliance Documents
                </h2>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 md:p-5 bg-slate-950 border border-slate-800 rounded-[1.5rem] md:rounded-[2rem] group hover:border-purple-500/30 transition-all">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="p-3 bg-slate-900 rounded-2xl text-slate-400 group-hover:text-purple-400 transition-colors shrink-0">
                        <FileText size={22} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-300 text-sm uppercase tracking-tight block">
                          Owner Driver License *
                        </span>
                        {files.ownerLicense && (
                          <span className="text-xs text-slate-500 break-all">
                            {files.ownerLicense.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <label className={uploadButtonClass}>
                      <Upload size={16} /> Upload File
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => handleFileChange("ownerLicense", e)}
                      />
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 md:p-5 bg-slate-950 border border-slate-800 rounded-[1.5rem] md:rounded-[2rem] group hover:border-purple-500/30 transition-all">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="p-3 bg-slate-900 rounded-2xl text-slate-400 group-hover:text-purple-400 transition-colors shrink-0">
                        <FileText size={22} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-300 text-sm uppercase tracking-tight block">
                          Dealer License Certificate / Insurance
                        </span>
                        {files.insuranceDoc && (
                          <span className="text-xs text-slate-500 break-all">
                            {files.insuranceDoc.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <label className={uploadButtonClass}>
                      <Upload size={16} /> Upload File
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => handleFileChange("insuranceDoc", e)}
                      />
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 md:p-5 bg-slate-950 border border-slate-800 rounded-[1.5rem] md:rounded-[2rem] group hover:border-purple-500/30 transition-all">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="p-3 bg-slate-900 rounded-2xl text-slate-400 group-hover:text-purple-400 transition-colors shrink-0">
                        <FileText size={22} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-300 text-sm uppercase tracking-tight block">
                          Liability Insurance / Supporting Document
                        </span>
                        {files.authorityDoc && (
                          <span className="text-xs text-slate-500 break-all">
                            {files.authorityDoc.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <label className={uploadButtonClass}>
                      <Upload size={16} /> Upload File
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => handleFileChange("authorityDoc", e)}
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-purple-500/5 border border-purple-500/10 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] flex gap-3 text-purple-300 text-[11px] font-semibold leading-relaxed">
                  <ShieldCheck
                    className="shrink-0 text-purple-500 mt-0.5"
                    size={18}
                  />
                  <span>
                    Your information and documents will be reviewed. After
                    verification, your account will be approved.
                  </span>
                </div>

                <div className="flex gap-3 md:gap-4 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 md:px-10 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all"
                  >
                    Back
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-5 md:py-6 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center gap-3 md:gap-4 disabled:opacity-60 transition-all shadow-xl"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        <ShieldCheck size={22} /> Submit Application
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerRegistration;
