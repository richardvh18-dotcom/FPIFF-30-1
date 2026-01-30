import React, { useState, useEffect } from "react";
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
} from "lucide-react";

/**
 * DatabaseSetup V2.2 - Debugging Edition
 * Deze versie is gebouwd om precies te achterhalen waarom Firestore "hangt".
 */
const DatabaseSetup = () => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  // Jouw Master UID
  const MASTER_ADMIN_UID = "pFlmcq8IgRNOBxwwV8tS5f8P5BI2";
  const appId = "fittings-app-v1";

  const addLog = (msg) => {
    console.log(`[SETUP] ${msg}`);
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runSetup = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setLogs([]);
    addLog("Systeem initialisatie gestart...");

    try {
      // STAP 1: AUTHENTICATIE CHECK
      addLog("Checken van authenticatie status...");
      if (!auth.currentUser) {
        addLog("Geen gebruiker gevonden. Poging tot anoniem inloggen...");
        try {
          const cred = await signInAnonymously(auth);
          addLog(`Anoniem ingelogd. UID: ${cred.user.uid}`);
        } catch (authErr) {
          addLog(`AUTH FOUT: ${authErr.code} - ${authErr.message}`);
          if (authErr.code === "auth/admin-restricted-operation") {
            throw new Error(
              "Anonieme login staat UIT in de Firebase Console. Schakel dit in bij 'Authentication' > 'Sign-in method'."
            );
          }
          throw authErr;
        }
      } else {
        addLog(`Reeds ingelogd als: ${auth.currentUser.uid}`);
      }

      // STAP 2: SCHRIJVEN NAAR SETTINGS
      // Als het hier blijft hangen, zijn de Firestore Rules het probleem.
      addLog("Test schrijven naar: artifacts/settings/general_config...");

      const settingsRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "settings",
        "general_config"
      );

      // We gebruiken een timeout om te voorkomen dat de UI voor altijd 'hangt'
      const writePromise = setDoc(
        settingsRef,
        {
          appName: "FPi Future Factory",
          lastUpdated: serverTimestamp(),
          setupStatus: "completed",
        },
        { merge: true }
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Firestore timeout: De database reageert niet. Controleer je 'Rules' in de Firebase Console."
              )
            ),
          8000
        )
      );

      await Promise.race([writePromise, timeoutPromise]);
      addLog("STAP 1/3: Basis instellingen opgeslagen.");

      // STAP 3: FABRIEKSTRUCTUUR
      addLog("Schrijven van fabrieksstructuur...");
      const factoryRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "config",
        "factory_config"
      );
      await setDoc(
        factoryRef,
        {
          departments: [
            {
              id: "dept_1",
              name: "Fitting Productions",
              slug: "fittings",
              country: "Nederland",
              stations: [
                { id: "st_1", name: "BM01" },
                { id: "st_2", name: "BH11" },
              ],
              shifts: [
                {
                  id: "VROEG",
                  label: "Vroege Ploeg",
                  start: "06:00",
                  end: "14:15",
                },
              ],
            },
          ],
        },
        { merge: true }
      );
      addLog("STAP 2/3: Fabrieksstructuur aangemaakt.");

      // STAP 4: GOD MODE ACTIVATIE
      addLog(`Admin rechten toekennen aan: ${MASTER_ADMIN_UID}...`);
      const adminRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "user_roles",
        MASTER_ADMIN_UID
      );
      await setDoc(
        adminRef,
        {
          uid: MASTER_ADMIN_UID,
          name: "Richard (Master Admin)",
          role: "admin",
          status: "active",
          permissions: {
            isAdmin: true,
            accessCatalog: true,
            accessPlanning: true,
            accessTerminals: true,
          },
        },
        { merge: true }
      );

      addLog("STAP 3/3: God Mode geactiveerd.");
      addLog("SYSTEEM SETUP VOLTOOID!");
      setDone(true);
    } catch (err) {
      addLog(`CRITICAL ERROR: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans overflow-y-auto">
      <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-[50px] p-10 backdrop-blur-xl relative">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3">
            <ShieldAlert size={40} />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
              Database <span className="text-blue-500">Fixer</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
              Versie 2.2 | Debug & Deploy
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border-2 border-rose-500/30 p-6 rounded-3xl mb-8 animate-in shake text-left">
            <div className="flex items-center gap-3 text-rose-400 mb-2">
              <AlertCircle size={20} />
              <p className="font-black uppercase text-xs">Setup Geblokkeerd</p>
            </div>
            <p className="text-sm text-rose-200/80 leading-relaxed font-medium">
              {error}
            </p>
            <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-rose-500/20">
              <p className="text-[10px] text-rose-300 font-bold uppercase mb-2 italic">
                Mogelijke Oplossingen:
              </p>
              <ul className="text-[10px] text-slate-400 space-y-1 list-disc ml-4">
                <li>
                  Ga naar Firebase Console &gt; Authentication &gt; Sign-in
                  method &gt; Schakel <b>Anonymous</b> in.
                </li>
                <li>
                  Ga naar Firestore Database &gt; Rules &gt; Zet op{" "}
                  <b>Test Mode</b> (allow read, write: if true).
                </li>
                <li>Controleer of je API Key exact klopt in firebase.js.</li>
              </ul>
            </div>
          </div>
        )}

        {done ? (
          <div className="bg-emerald-500/20 border-2 border-emerald-500/40 p-8 rounded-[35px] text-emerald-400 flex items-center gap-6 animate-in zoom-in mb-8 shadow-2xl shadow-emerald-500/10">
            <CheckCircle size={48} />
            <div className="text-left">
              <p className="font-black uppercase text-lg tracking-widest leading-none mb-1">
                Gelukt!
              </p>
              <p className="text-xs opacity-80 font-medium">
                De database is geconfigureerd en je hebt Admin toegang. Herstel
                main.jsx en log in.
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={runSetup}
            disabled={loading}
            className="w-full py-7 bg-blue-600 hover:bg-blue-500 rounded-[30px] font-black uppercase tracking-[0.3em] text-sm transition-all shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <Rocket size={24} />
            )}
            {loading ? "Poging tot Schrijven..." : "Start Database Setup"}
          </button>
        )}

        <div className="mt-10 bg-black/60 rounded-[35px] border border-white/5 p-8 space-y-4">
          <div className="flex items-center justify-between text-slate-500 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Terminal size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-left">
                Live Systeem Log
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <div className="h-48 overflow-y-auto custom-scrollbar space-y-2 text-left pr-2">
            {logs.length === 0 && (
              <p className="text-[10px] text-slate-700 italic">
                Klaar voor start...
              </p>
            )}
            {logs.map((log, i) => (
              <p
                key={i}
                className={`text-[11px] font-mono leading-relaxed break-words ${
                  log.includes("FOUT") || log.includes("ERROR")
                    ? "text-rose-400"
                    : "text-emerald-500/80"
                }`}
              >
                {log}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-6 opacity-30">
          <div className="flex items-center gap-1.5">
            <Database size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest">
              Firestore
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest">
              Auth Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;
