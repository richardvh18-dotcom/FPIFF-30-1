import React, { useState } from "react";
import {
  Factory,
  KeyRound,
  Mail,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

/**
 * LoginView V3.5 - Stabilized
 * Zorgt ervoor dat inlogpogingen correct worden doorgegeven aan Firebase.
 */
const LoginView = ({ onLogin, error: externalError }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [internalError, setInternalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setInternalError(null);
    console.log("🚀 Inlogpoging gestart voor:", email);

    try {
      await onLogin(email, password);
    } catch (err) {
      console.error("❌ Login Component Fout:", err);
      setInternalError("Systeemfout bij inloggen.");
    } finally {
      setLoading(false);
    }
  };

  const displayError = externalError || internalError;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-left">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="bg-slate-900 p-10 text-center relative border-b-4 border-blue-600">
          <Factory className="text-blue-500 w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
            Future <span className="text-blue-500">Factory</span>
          </h1>
          <p className="text-slate-500 text-[9px] font-black uppercase mt-3 tracking-[0.3em]">
            Industrial MES Portal
          </p>
        </div>

        <div className="p-10 space-y-6">
          {displayError && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake">
              <AlertCircle size={18} />
              <p className="text-xs font-bold uppercase">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                E-mailadres
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all text-sm text-slate-900"
                  placeholder="naam@futurepipe.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Wachtwoord
              </label>
              <div className="relative group">
                <KeyRound
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"
                  size={18}
                />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all text-sm text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4 shadow-xl"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Systeem Inloggen <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <ShieldCheck size={12} />
            <p className="text-[9px] font-black uppercase tracking-[0.2em]">
              Secure Node 377EF
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
