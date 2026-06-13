import React, { useState } from "react";
import {
  Truck,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Globe,
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { DatabaseService } from "../services/database";

const CarrierRegistration: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    dot: "",
    mc: "",
    address1: "",
    city: "",
    state: "",
    zip: "",
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

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.companyName ||
      !formData.ownerName ||
      !formData.email ||
      !formData.password
    ) {
      alert("Missing required fields.");
      return;
    }

    if (
      !formData.phone ||
      !formData.address1 ||
      !formData.city ||
      !formData.state ||
      !formData.zip
    ) {
      alert("Address and phone are required.");
      return;
    }

    if (!files.ownerLicense) {
      alert("Owner driver license is required.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.companyName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: "carrier",
        metadata: {
          owner_name: formData.ownerName,
          dot: formData.dot,
          mc: formData.mc,
          address1: formData.address1,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
      };

      const registerRes: any = await DatabaseService.registerUser(payload);

      if (!registerRes?.kyc_token) {
        throw new Error("KYC token missing after registration.");
      }

      await uploadKycDocs(registerRes.kyc_token);

      alert(
        "Your information and documents have been submitted. After verification, your account will be approved."
      );
      onComplete();
    } catch (error: any) {
      alert(error?.message || "Registration error.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 md:py-5 px-4 text-white outline-none focus:border-blue-500 transition-all";
  const iconInputClass =
    "w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 md:py-5 pl-12 pr-4 text-white outline-none focus:border-blue-500 transition-all";
  const labelClass =
    "text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic";
  const uploadButtonClass =
    "cursor-pointer shrink-0 px-4 py-2 md:px-5 md:py-3 bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase text-blue-400 rounded-xl border border-slate-800 flex items-center gap-2 transition-all text-center";

  return (
    <div className="min-h-screen w-full bg-slate-950 relative overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10" />

      <div className="min-h-screen w-full flex items-start justify-center px-3 py-4 md:px-6 md:py-8">
        <div className="w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-[2rem] md:rounded-[2.75rem] shadow-2xl relative">
          <div className="px-5 pt-6 pb-5 md:px-10 md:pt-10 md:pb-7">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-blue-500/10 text-blue-400 mb-5 md:mb-6 border border-blue-500/20">
                <Truck size={34} className="md:w-10 md:h-10" />
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase">
                Carrier <span className="text-blue-500">Registration</span>
              </h1>

              <p className="text-slate-500 mt-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 italic">
                <Globe size={12} className="text-blue-600" />
                Verified Carrier Access
              </p>
            </div>
          </div>

          <div className="px-5 pb-6 md:px-10 md:pb-10">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 md:space-y-8"
              autoComplete="off"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className={labelClass}>Legal Entity Name</label>
                  <div className="relative">
                    <Building2
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                      size={18}
                    />
                    <input
                      value={formData.companyName}
                      onChange={(e) =>
                        handleChange("companyName", e.target.value)
                      }
                      className={iconInputClass}
                      placeholder="Company legal name"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className={labelClass}>Owner Full Name</label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                      size={18}
                    />
                    <input
                      value={formData.ownerName}
                      onChange={(e) => handleChange("ownerName", e.target.value)}
                      className={iconInputClass}
                      placeholder="Owner full name"
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
                      type="email"
                      name="carrier_email_new"
                      autoComplete="off"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={iconInputClass}
                      placeholder="Business email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Secure Password</label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                      size={18}
                    />
                    <input
                      type="password"
                      name="carrier_password_new"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className={iconInputClass}
                      placeholder="Password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Phone</label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                      size={18}
                    />
                    <input
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className={iconInputClass}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>DOT Number</label>
                  <div className="relative">
                    <BadgeCheck
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                      size={18}
                    />
                    <input
                      value={formData.dot}
                      onChange={(e) => handleChange("dot", e.target.value)}
                      className={iconInputClass}
                      placeholder="DOT number"
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
                      value={formData.mc}
                      onChange={(e) => handleChange("mc", e.target.value)}
                      className={iconInputClass}
                      placeholder="MC number"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className={labelClass}>Address</label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700"
                      size={18}
                    />
                    <input
                      value={formData.address1}
                      onChange={(e) => handleChange("address1", e.target.value)}
                      className={iconInputClass}
                      placeholder="Street address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>City</label>
                  <input
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className={inputClass}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>State</label>
                  <input
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className={inputClass}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className={labelClass}>ZIP</label>
                  <input
                    value={formData.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                    className={inputClass}
                    placeholder="ZIP"
                  />
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 space-y-5">
                <h2 className="text-white font-black uppercase tracking-wider text-sm">
                  Required Documents
                </h2>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl group hover:border-blue-500/30 transition-all">
                  <div className="min-w-0">
                    <label className={labelClass}>Owner Driver License *</label>
                    {files.ownerLicense && (
                      <p className="text-xs text-slate-400 mt-2 break-all">
                        {files.ownerLicense.name}
                      </p>
                    )}
                  </div>

                  <label className={uploadButtonClass}>
                    <FileText size={16} /> Upload File
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => handleFileChange("ownerLicense", e)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl group hover:border-blue-500/30 transition-all">
                  <div className="min-w-0">
                    <label className={labelClass}>Insurance Certificate</label>
                    {files.insuranceDoc && (
                      <p className="text-xs text-slate-400 mt-2 break-all">
                        {files.insuranceDoc.name}
                      </p>
                    )}
                  </div>

                  <label className={uploadButtonClass}>
                    <FileText size={16} /> Upload File
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => handleFileChange("insuranceDoc", e)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl group hover:border-blue-500/30 transition-all">
                  <div className="min-w-0">
                    <label className={labelClass}>
                      Authority / MC Document
                    </label>
                    {files.authorityDoc && (
                      <p className="text-xs text-slate-400 mt-2 break-all">
                        {files.authorityDoc.name}
                      </p>
                    )}
                  </div>

                  <label className={uploadButtonClass}>
                    <FileText size={16} /> Upload File
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => handleFileChange("authorityDoc", e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-blue-500/5 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-blue-500/10 flex gap-3 text-blue-300 text-[11px] font-semibold leading-relaxed">
                <ShieldCheck
                  className="shrink-0 text-blue-500 mt-0.5"
                  size={18}
                />
                <span>
                  Your information and documents will be reviewed. After
                  verification, your account will be approved.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black py-5 md:py-6 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center gap-3 transition-all"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <>
                    Submit Application <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarrierRegistration;
