import React, { useState } from "react";
import { db, auth } from "../../config/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import {
  ShieldAlert,
  Database,
  Rocket,
  Loader2,
  CheckCircle,
  AlertCircle,
  Terminal,
  ShieldCheck,
  Lock,
  Zap,
} from "lucide-react";
import { PATHS } from "../../config/dbPaths";

/**
 * DatabaseSetup V3.0 - Future Factory Root Edition
 * Schrijft de initiële systeemdata naar de nieuwe beveiligde root: /future-factory/
 */
const DatabaseSetup = () => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  // Jouw Master UID uit useAdminAuth.js
  const MASTER_ADMIN_UID = "pzxPfiwQhnQdEQJcXU77ZgT2Jo32";

  const addLog = (msg) => {
    console.log(`[SETUP] ${msg}`);
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15)
    );
  };

  const runSetup = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setLogs([]);
    addLog("Systeem initialisatie gestart voor nieuwe root...");

    try {
      // STAP 1: AUTHENTICATIE CHECK
      if (!auth.currentUser) {
        addLog("Geen actieve sessie. Poging tot anoniem inloggen...");
        try {
          await signInAnonymously(auth);
          addLog("Tijdelijke sessie geactiveerd.");
        } catch (authErr) {
          throw new Error(
            "Authenticatie geblokkeerd. Check 'Anonymous login' in Firebase Console."
          );
        }
      }

      // STAP 2: ALGEMENE INSTELLINGEN
      addLog(`Schrijven naar: ${PATHS.GENERAL_SETTINGS.join("/")}`);
      const settingsRef = doc(db, ...PATHS.GENERAL_SETTINGS);

      const writeSettings = setDoc(
        settingsRef,
        {
          appName: "FPi Future Factory",
          setupStatus: "completed",
          version: "6.11",
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      // Timeout voor Firestore Rules check
      const timeout = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error("Firestore timeout. Staan je 'Rules' wel open?")),
          8000
        )
      );

      await Promise.race([writeSettings, timeout]);
      addLog("✅ Stap 1/3: Systeeminstellingen in de root geplaatst.");

      // STAP 3: FABRIEKSTRUCTUUR
      addLog(`Schrijven naar: ${PATHS.FACTORY_CONFIG.join("/")}`);
      const factoryRef = doc(db, ...PATHS.FACTORY_CONFIG);
      await setDoc(
        factoryRef,
        {
          departments: [
            {
              id: "dept_fittings",
              name: "Fitting Productions",
              slug: "fittings",
              country: "Nederland",
              stations: [
                { id: "st_bm01", name: "BM01" },
                { id: "st_bh11", name: "BH11" },
                { id: "st_bh12", name: "BH12" },
              ],
              shifts: [
                { id: "DAG", label: "Dagdienst", start: "07:15", end: "16:00" },
              ],
            },
          ],
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
      addLog("✅ Stap 2/3: Fabrieksstructuur aangemaakt.");

      // STAP 4: MASTER ADMIN ACCOUNT
      addLog(`Admin rechten toekennen aan UID: ${MASTER_ADMIN_UID}...`);
      const adminRef = doc(db, ...PATHS.USERS, MASTER_ADMIN_UID);
      await setDoc(
        adminRef,
        {
          uid: MASTER_ADMIN_UID,
          name: "Richard van Heerde",
          email: "richard@futurepipe.com",
          role: "admin",
          status: "active",
          isGodMode: true,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      addLog("✅ Stap 3/3: Master Admin account gekoppeld.");
      addLog("HOERA! De nieuwe database root is nu operationeel.");
      setDone(true);
    } catch (err) {
      let msg = err.message;
      if (msg.includes("permission-denied")) {
        msg =
          "TOEGANG GEWEIGERD: Controleer of je Firestore regels (Rules) de map /future-factory/ toestaan.";
      }
      addLog(`❌ FOUT: ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-[50px] p-10 backdrop-blur-xl relative shadow-2xl">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
            <ShieldCheck size={40} />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
              Root <span className="text-blue-500">Activator</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
              Future Factory Setup v3.0
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border-2 border-rose-500/30 p-6 rounded-3xl mb-8 text-left animate-in shake">
            <div className="flex items-center gap-3 text-rose-400 mb-2">
              <AlertCircle size={20} />
              <p className="font-black uppercase text-xs">Setup Geblokkeerd</p>
            </div>
            <p className="text-sm text-rose-100 font-medium mb-4">{error}</p>
            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] text-blue-400 font-black uppercase mb-1 italic text-left">
                Oplossing:
              </p>
              <p className="text-[10px] text-slate-400 text-left">
                Zorg dat je regels in Firebase Console staan op:
                <br />
                <code className="text-emerald-400">
                  match
                  /future-factory/&#123;module&#125;/&#123;document=**&#125;
                  &#123; allow read, write: if true; &#125;
                </code>
              </p>
            </div>
          </div>
        )}

        {done ? (
          <div className="bg-emerald-500/20 border-2 border-emerald-500/40 p-8 rounded-[35px] text-emerald-400 flex items-center gap-6 animate-in zoom-in mb-8">
            <CheckCircle size={48} />
            <div className="text-left">
              <p className="font-black uppercase text-lg tracking-widest leading-none">
                Root is Live!
              </p>
              <p className="text-xs opacity-80 mt-1">
                Je kunt nu uitloggen en opnieuw inloggen via het dashboard.
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={runSetup}
            disabled={loading}
            className="w-full py-7 bg-blue-600 hover:bg-blue-500 rounded-[30px] font-black uppercase tracking-[0.3em] text-sm transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Rocket size={24} />
            )}
            {loading ? "Gegevens Publiceren..." : "Start Root Setup"}
          </button>
        )}

        <div className="mt-10 bg-black/40 rounded-[35px] border border-white/5 p-8 text-left">
          <div className="flex items-center justify-between text-slate-500 mb-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Terminal size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-left">
                Console Log
              </span>
            </div>
            <Zap size={14} className="text-blue-500 animate-pulse" />
          </div>
          <div className="h-32 overflow-y-auto custom-scrollbar space-y-2">
            {logs.length === 0 && (
              <p className="text-[10px] text-slate-700 italic">
                Wacht op activatie...
              </p>
            )}
            {logs.map((log, i) => (
              <p
                key={i}
                className={`text-[11px] font-mono leading-none ${
                  log.includes("FOUT") ? "text-rose-400" : "text-emerald-500/70"
                }`}
              >
                {log}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;
