import React, { useState } from "react";
import { db } from "../../config/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { PATHS } from "../../config/dbPaths";
import {
  ShieldAlert,
  Zap,
  CheckCircle2,
  Loader2,
  Database,
  ArrowRight,
} from "lucide-react";

/**
 * GodModeBootstrap V2.2 - Corrected Target UID
 * Gebruikt nu de UID pFlmcq8IgRNOBxwwV8tS5f8P5BI2
 */
const GodModeBootstrap = () => {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  // GECORRIGEERDE UID UIT JE CONSOLE LOGS
  const targetUid = "pFlmcq8IgRNOBxwwV8tS5f8P5BI2";

  const handleBootstrap = async () => {
    setStatus("loading");
    setError(null);
    try {
      const userRef = doc(db, ...PATHS.USERS, targetUid);

      await setDoc(
        userRef,
        {
          uid: targetUid,
          name: "Richard van Heerde",
          email: "richard@futurepipe.com",
          role: "admin",
          permissions: ["all"],
          isGodMode: true,
          activatedAt: serverTimestamp(),
          lastSync: new Date().toISOString(),
        },
        { merge: true }
      );

      setStatus("success");
      console.log(
        "✅ God Mode record succesvol weggeschreven voor:",
        targetUid
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-left">
      <div className="max-w-xl w-full bg-white/5 border border-white/10 rounded-[50px] p-12 backdrop-blur-xl animate-in zoom-in duration-500 shadow-2xl">
        <div className="flex items-center gap-6 mb-10">
          <div className="p-5 bg-blue-600 rounded-3xl shadow-xl">
            <ShieldAlert size={40} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">
              System <span className="text-blue-500">Restore</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
              Gecorrigeerde UID Activatie
            </p>
          </div>
        </div>

        <div className="bg-black/40 border border-white/5 p-8 rounded-[35px] mb-10 space-y-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Database size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Doel UID:
            </span>
          </div>
          <code className="text-[11px] font-mono text-emerald-400 break-all bg-black/40 p-4 rounded-xl block border border-white/5 text-center">
            {targetUid}
          </code>
        </div>

        {status === "success" ? (
          <div className="bg-emerald-500/20 border-2 border-emerald-500/40 p-8 rounded-[35px] flex items-center gap-6 text-emerald-400 animate-in fade-in">
            <CheckCircle2 size={40} />
            <div className="text-left">
              <p className="font-black uppercase text-sm italic">
                Activatie Voltooid!
              </p>
              <p className="text-[10px] opacity-80 mt-1">
                Je bent nu geregistreerd in de nieuwe database.
              </p>
              <button
                onClick={() => (window.location.href = "/")}
                className="mt-6 flex items-center gap-2 bg-emerald-500 text-slate-900 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-400"
              >
                Ga naar Portal <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleBootstrap}
            disabled={status === "loading"}
            className="w-full py-7 bg-blue-600 hover:bg-blue-500 text-white rounded-[30px] font-black uppercase tracking-[0.3em] text-sm transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95"
          >
            {status === "loading" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Database Schrijven <Zap size={20} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default GodModeBootstrap;
