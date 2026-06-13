import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LoadBoard from "./pages/LoadBoard";
import MyLoads from "./pages/MyLoads";
import FleetManagement from "./pages/FleetManagement";
import DriverActiveLoad from "./pages/DriverActiveLoad";
import ClientDirect from "./pages/ClientDirect";
import ClientMyVehicles from "./pages/ClientMyVehicles";
import Finance from "./pages/Finance";
import CarrierRegistration from "./pages/CarrierRegistration";
import ClientRegistration from "./pages/ClientRegistration";
import DealerRegistration from "./pages/DealerRegistration";
import DriverProfile from "./pages/DriverProfile";
import AdminConsole from "./pages/AdminConsole";
import ChangePassword from "./pages/ChangePassword";
import { UserRole, RegistrationRole } from "./types";
import {
  Mail,
  Lock,
  Ship,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { DatabaseService } from "./services/database";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("carrier");
  const [currentView, setCurrentView] = useState("dashboard");
  const [registerRole, setRegisterRole] = useState<RegistrationRole>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const savedUserId = localStorage.getItem("autologix_user_id");
    const savedRole = localStorage.getItem("autologix_user_role");
    const savedMustChangePassword =
      localStorage.getItem("autologix_must_change_password") === "true";

    const role = savedRole as UserRole;

    if (savedUserId && savedRole) {
      setUserRole(role);
      setIsAuthenticated(true);
      setMustChangePassword(savedMustChangePassword);

      if (savedMustChangePassword) {
        setCurrentView("change-password");
        return;
      }

      setCurrentView(
        role === "admin"
          ? "admin-console"
          : role === "carrier"
          ? "dashboard"
          : role === "driver"
          ? "driver-profile"
          : "client-direct"
      );
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const res = await DatabaseService.login(
        loginForm.email,
        loginForm.password
      );

      const user = res.user;
      const role = user.role as UserRole;
      const needsPasswordChange = !!res.must_change_password;

      if (user && user.id) {
        localStorage.setItem("autologix_user_id", user.id);
        localStorage.setItem("autologix_user_role", user.role);
        localStorage.setItem(
          "autologix_must_change_password",
          needsPasswordChange ? "true" : "false"
        );

        if (user.name) {
          localStorage.setItem("autologix_user_name", user.name);
        }

        if (user.email) {
          localStorage.setItem("autologix_user_email", user.email);
        }

        setUserRole(role);
        setMustChangePassword(needsPasswordChange);
        setIsAuthenticated(true);

        if (needsPasswordChange) {
          setCurrentView("change-password");
          return;
        }

        setCurrentView(
          role === "admin"
            ? "admin-console"
            : role === "carrier"
            ? "dashboard"
            : role === "driver"
            ? "driver-profile"
            : "client-direct"
        );
      } else {
        setLoginError("Credenciales incorrectas.");
      }
    } catch (err: any) {
      const status =
        err?.status || err?.response?.status || err?.data?.status;

      const detail =
        err?.data?.detail ||
        err?.response?.data?.detail ||
        err?.message ||
        "";

      const d = String(detail);

      if (Number(status) === 403 && d.startsWith("USER_")) {
        if (d === "USER_PENDING") {
          setLoginError(
            "Tu cuenta está PENDIENTE. No puedes iniciar sesión hasta que el administrador te apruebe."
          );
          return;
        }
        if (d === "USER_DISABLED") {
          setLoginError(
            "Tu cuenta está DESHABILITADA. Contacta al administrador."
          );
          return;
        }
        setLoginError("Tu cuenta no está activa. Contacta al administrador.");
        return;
      }

      if (Number(status) === 401 && d.includes("INVALID_CREDENTIALS")) {
        setLoginError("Email o contraseña incorrectos.");
        return;
      }

      if (Number(status) === 404) {
        setLoginError(
          "Endpoint no encontrado (404). Revisa la ruta /api/auth/login y el proxy de Nginx."
        );
        return;
      }

      setLoginError("Error de conexión con el servidor.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePasswordChanged = () => {
    localStorage.setItem("autologix_must_change_password", "false");
    setMustChangePassword(false);

    setCurrentView(
      userRole === "admin"
        ? "admin-console"
        : userRole === "carrier"
        ? "dashboard"
        : userRole === "driver"
        ? "driver-profile"
        : "client-direct"
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setMustChangePassword(false);
    setCurrentView("dashboard");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10" />

        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-blue-600/10 rounded-3xl border border-blue-500/20 mb-6">
              <Ship className="text-blue-500" size={32} />
            </div>

            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
              Car Route <span className="text-blue-600">System</span>
            </h1>

            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">
              Unified Logistics Ecosystem
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {loginError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center">
                {loginError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600"
                  size={18}
                />
                <input
                  required
                  type="email"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, email: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 pl-14 text-white outline-none focus:border-blue-500"
                  placeholder="Email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                Secure Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600"
                  size={18}
                />
                <input
                  required
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 pl-14 text-white outline-none focus:border-blue-500"
                  placeholder="Password"
                />
              </div>
            </div>

            <button
              disabled={isLoggingIn}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[2rem] shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {isLoggingIn ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col gap-4 text-center">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              Registration
            </p>

            <div className="flex justify-center gap-6">
              <button
                onClick={() => setRegisterRole("carrier")}
                className="text-blue-400 font-bold text-[10px] uppercase hover:underline"
              >
                Carrier
              </button>
              <button
                onClick={() => setRegisterRole("dealer")}
                className="text-purple-400 font-bold text-[10px] uppercase hover:underline"
              >
                Dealer
              </button>
              <button
                onClick={() => setRegisterRole("client")}
                className="text-emerald-400 font-bold text-[10px] uppercase hover:underline"
              >
                Client
              </button>
            </div>
          </div>
        </div>

        {registerRole && (
          <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto">
            <div className="min-h-full flex items-start justify-center p-3 md:p-6">
              {registerRole === "carrier" && (
                <CarrierRegistration
                  onComplete={() => setRegisterRole(null)}
                />
              )}

              {registerRole === "client" && (
                <ClientRegistration
                  onComplete={() => setRegisterRole(null)}
                  onCancel={() => setRegisterRole(null)}
                />
              )}

              {registerRole === "dealer" && (
                <DealerRegistration
                  onComplete={() => setRegisterRole(null)}
                  onCancel={() => setRegisterRole(null)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mustChangePassword) {
    return <ChangePassword onDone={handlePasswordChanged} />;
  }

  return (
    <Layout
      userRole={userRole}
      currentView={currentView}
      onNavigate={setCurrentView}
      onLogout={handleLogout}
    >
      {currentView === "dashboard" && <Dashboard userRole={userRole} />}
      {currentView === "admin-console" && <AdminConsole />}
      {currentView === "loadboard" && <LoadBoard />}
      {currentView === "my-loads" && <MyLoads />}
      {currentView === "tracking" && <ClientMyVehicles />}
      {currentView === "fleet" && <FleetManagement />}
      {currentView === "driver-active" && <DriverActiveLoad />}
      {currentView === "client-direct" && <ClientDirect />}
      {currentView === "finance" && <Finance />}
      {currentView === "driver-profile" && <DriverProfile />}
    </Layout>
  );
};

export default App;
