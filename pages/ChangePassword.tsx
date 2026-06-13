import React, { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { DatabaseService } from "../services/database";

interface ChangePasswordProps {
  onDone: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ onDone }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword.trim()) {
      setError("Current password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);
      await DatabaseService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      onDone();
    } catch (err: any) {
      setError(err?.message || "Could not change password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-blue-600/20">
            <KeyRound className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase italic">Change Password</h1>
            <p className="text-sm text-slate-400">
              You must create your own password before continuing.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase text-slate-400 font-bold">
              Temporary Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="text-xs uppercase text-slate-400 font-bold">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="text-xs uppercase text-slate-400 font-bold">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none"
            />
          </div>

          {error ? <div className="text-red-400 text-sm">{error}</div> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-3 font-black uppercase flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Save Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
