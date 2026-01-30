import React, { useState, useEffect } from "react";
import { db, auth } from "../../config/firebase";
import {
  collection,
  getDocs,
  query,
  limit,
  collectionGroup,
} from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  Database,
  Search,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FolderSearch,
  Zap,
  Globe,
  Terminal,
  ShieldCheck,
  Fingerprint,
  MapPin,
  SearchCode,
  Scan,
} from "lucide-react";

/**
 * UniversalRescueTool V4.0 - Forensic Discovery
 * Deze tool toont exact welk Project ID wordt gebruikt en probeert
 * via 'Collection Groups' data te vinden die diep in mappen verstopt zit.
 */
const UniversalRescueTool = () => {
  const [foundCollections, setFoundCollections] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState("Controleren...");

  // Forensic Info
  const activeProjectId = db?._databaseId?.projectId || "ONBEKEND";
  const currentAppId =
    typeof __app_id !== "undefined" ? __app_id : "fittings-app-v1";

  const addLog = (msg) => {
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 25)
    );
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthStatus(`Ingelogd (${user.uid.substring(0, 8)})`);
        addLog("Sessie geactiveerd.");
      } else {
        setAuthStatus("Niet ingelogd...");
        signInAnonymously(auth).catch((err) =>
          addLog("Auth Fout: " + err.message)
        );
      }
    });
    return () => unsub();
  }, []);

  const runDeepForensicScan = async () => {
    setIsScanning(true);
    setError(null);
    setFoundCollections([]);
    setLogs([]);
    addLog(`Forensische scan gestart voor Project: ${activeProjectId}`);

    // Lijst van collectie-namen die we MOETEN vinden
    const targetCollections = [
      "products",
      "digital_planning",
      "user_roles",
      "settings",
      "tracked_products",
    ];

    // We testen ook verschillende AppID variaties die in de loop der tijd gebruikt kunnen zijn
    const appIdVariations = [
      currentAppId,
      "fittings-app-v1",
      "fpi-factory",
      "mes-portal",
      "fittings-app",
    ];

    try {
      // METHODE 1: Collection Groups (Zoekt overal, ongeacht hoe diep de map is)
      addLog("Start Methode 1: Collection Group Discovery...");
      for (const colName of targetCollections) {
        addLog(`Zoeken naar collectie-naam: '${colName}' overal in DB...`);
        try {
          const groupRef = collectionGroup(db, colName);
          const q = query(groupRef, limit(1));
          const snap = await getDocs(q);

          if (!snap.empty) {
            const foundPath = snap.docs[0].ref.path;
            addLog(`🔥 HOERA! Data gevonden voor '${colName}'!`);
            addLog(`📍 Volledig pad: /${foundPath}`);
            setFoundCollections((prev) => [
              ...prev,
              {
                name: colName,
                path: foundPath.replace(`/${snap.docs[0].id}`, ""),
                count: "Aanwezig",
                method: "Global Search",
              },
            ]);
          }
        } catch (e) {
          addLog(
            `⚠️ Groep '${colName}' mislukt: ${e.message.substring(0, 40)}...`
          );
        }
      }

      // METHODE 2: Brute Force Path Probing
      if (foundCollections.length === 0) {
        addLog("Start Methode 2: Brute Force Path Probing...");
        const pathTemplates = [
          (id) => ["artifacts", id, "public", "data"],
          (id) => ["artifacts", id, "public"],
          (id) => ["production", id],
          (id) => [id],
        ];

        for (const idVar of appIdVariations) {
          for (const template of pathTemplates) {
            const basePath = template(idVar);
            for (const col of targetCollections) {
              const fullPath = [...basePath, col];
              try {
                const colRef = collection(db, ...fullPath);
                const q = query(colRef, limit(1));
                const snap = await getDocs(q);
                if (!snap.empty) {
                  addLog(`🔥 GEVONDEN via Probing: /${fullPath.join("/")}`);
                  setFoundCollections((prev) => [
                    ...prev,
                    {
                      name: col,
                      path: fullPath.join("/"),
                      count: "Gevonden",
                      method: "Path Probing",
                    },
                  ]);
                }
              } catch (e) {}
            }
          }
        }
      }

      if (foundCollections.length === 0) {
        setError(
          `Geen data gevonden in Project '${activeProjectId}'. Controleer of dit ID klopt met je werkende sandbox.`
        );
      }
      addLog("Scan voltooid.");
    } catch (err) {
      setError("Fataal: " + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 text-white font-sans">
      <div className="max-w-5xl w-full bg-white/5 border border-white/10 rounded-[50px] p-8 md:p-12 backdrop-blur-xl relative">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-3 shrink-0">
            <SearchCode size={40} />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
              Forensic <span className="text-blue-500">Rescue</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic">
              Versie 4.0 | Global Collection Discovery
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-black/40 rounded-[35px] p-8 border border-white/5 text-left space-y-6">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} /> Database Vingerafdruk
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1">
                    Huidig Project ID (Live):
                  </p>
                  <p className="font-mono text-base text-emerald-400 font-bold">
                    {activeProjectId}
                  </p>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1">
                    Authenticatie Status:
                  </p>
                  <p className="font-mono text-[10px] text-blue-400 italic">
                    <ShieldCheck size={12} className="inline mr-1" />{" "}
                    {authStatus}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={runDeepForensicScan}
              disabled={isScanning}
              className="w-full py-8 bg-blue-600 hover:bg-blue-500 rounded-[35px] font-black uppercase text-sm tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
            >
              {isScanning ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <Scan size={24} />
              )}
              {isScanning ? "Deep Searching..." : "Start Forensische Scan"}
            </button>

            {error && (
              <div className="bg-rose-500/10 border-2 border-rose-500/30 p-6 rounded-3xl text-left animate-in shake">
                <div className="flex items-center gap-3 text-rose-500 mb-2 font-black uppercase text-xs">
                  <AlertTriangle size={20} /> Geen resultaat
                </div>
                <p className="text-sm text-rose-200/80 leading-relaxed">
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="bg-black/60 rounded-[35px] border border-white/10 p-8 flex flex-col h-[450px]">
            <div className="flex items-center justify-between text-slate-500 mb-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Terminal size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest text-left">
                  Discovery Log
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 text-left">
              {logs.length === 0 && (
                <p className="text-[10px] text-slate-700 italic text-center py-20">
                  Klaar voor forensisch onderzoek...
                </p>
              )}
              {logs.map((log, i) => (
                <p
                  key={i}
                  className={`text-[11px] font-mono leading-relaxed ${
                    log.includes("🔥")
                      ? "text-emerald-400 font-bold bg-emerald-400/5 p-1 rounded"
                      : log.includes("⚠️")
                      ? "text-amber-500"
                      : "text-slate-400"
                  }`}
                >
                  {log}
                </p>
              ))}
            </div>
          </div>
        </div>

        {foundCollections.length > 0 && (
          <div className="mt-10 space-y-4 animate-in slide-in-from-bottom-6 duration-700">
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest ml-4 text-left flex items-center gap-2">
              <CheckCircle2 size={16} /> Locaties gevonden in Project '
              {activeProjectId}':
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {foundCollections.map((col, i) => (
                <div
                  key={i}
                  className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-[30px] flex items-center justify-between text-left group hover:bg-emerald-500/20 transition-all"
                >
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-400 shadow-inner">
                      <Database size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-none mb-2">
                        {col.name}
                      </p>
                      <code className="text-sm font-mono text-slate-200 select-all">
                        /{col.path}/{col.name}
                      </code>
                      <p className="text-[8px] font-bold text-slate-500 uppercase mt-2">
                        Methode: {col.method}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-blue-600/10 border border-blue-500/30 rounded-[30px] text-left">
              <p className="text-xs text-blue-300 font-bold leading-relaxed">
                <Zap size={14} className="inline mr-2" />
                ACTIE: Kopieer de <b>witte code-regels</b> hierboven. Dit zijn
                de paden waar jouw data staat. Stuur ze naar mij!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalRescueTool;
