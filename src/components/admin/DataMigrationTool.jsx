import React, { useState } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import {
  Database,
  Play,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";

/**
 * DataMigrationTool V2.1 - Even-Path Update
 * Kopieert data naar de /future-factory/production/... structuur.
 */
const DataMigrationTool = () => {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    module: "",
  });
  const [logs, setLogs] = useState([]);

  const appId = typeof __app_id !== "undefined" ? __app_id : "fittings-app-v1";

  const MODULES = [
    { id: "products", old: "products", new: "products" },
    { id: "planning", old: "digital_planning", new: "digital_planning" },
    { id: "tracking", old: "tracked_products", new: "tracked_products" },
    { id: "dimensions", old: "dimensions", new: "dimensions" },
    { id: "settings", old: "settings", new: "settings" },
    { id: "users", old: "user_roles", new: "user_roles" },
    { id: "messages", old: "messages", new: "messages" },
    {
      id: "conversions",
      old: "product_conversions",
      new: "product_conversions",
    },
  ];

  const addLog = (msg) =>
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15)
    );

  const runMigration = async () => {
    if (!window.confirm("Start migratie naar /future-factory/production/ ?"))
      return;

    setStatus("running");
    try {
      for (const mod of MODULES) {
        setProgress((p) => ({ ...p, module: mod.id, current: 0 }));
        addLog(`Scannen: ${mod.old}...`);

        const oldRef = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          mod.old
        );
        const snapshot = await getDocs(oldRef);

        if (snapshot.empty) {
          addLog(`- ${mod.id} is leeg.`);
          continue;
        }

        addLog(`📦 ${snapshot.size} items gevonden. Verhuizen...`);
        const batch = writeBatch(db);

        snapshot.docs.forEach((oldDoc) => {
          // CORRECTIE: We voegen 'production' toe tussen de root en de module
          const newDocRef = doc(
            db,
            "future-factory",
            "production",
            mod.new,
            oldDoc.id
          );
          batch.set(
            newDocRef,
            {
              ...oldDoc.data(),
              migratedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        });

        await batch.commit();
        addLog(`✅ ${mod.id} voltooid.`);
      }
      setStatus("done");
    } catch (err) {
      addLog(`❌ FOUT: ${err.message}`);
      setStatus("error");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-left space-y-6">
      <div className="bg-slate-900 p-8 rounded-[40px] text-white flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-600 rounded-3xl shadow-lg">
            <Database size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">
              Systeem <span className="text-blue-500">Migratie</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Artifacts ➔ Future-Factory/Production
            </p>
          </div>
        </div>
        {status === "running" && (
          <Loader2 className="animate-spin text-blue-500" size={32} />
        )}
      </div>

      {status === "done" && (
        <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-3xl flex items-center gap-4 animate-in zoom-in">
          <CheckCircle2 className="text-emerald-500" size={32} />
          <div>
            <p className="font-black text-emerald-900 uppercase text-sm">
              Migratie Geslaagd!
            </p>
            <p className="text-xs text-emerald-700">
              Zet nu <code>IS_ROOT_STRUCTURE</code> op <b>true</b> in{" "}
              <code>dbPaths.js</code>.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border-2 border-slate-100 rounded-[35px] p-8 space-y-6 shadow-sm">
        <div className="bg-blue-50 p-5 rounded-2xl flex items-start gap-4 border border-blue-100">
          <Info className="text-blue-600 shrink-0" size={20} />
          <p className="text-xs text-blue-800 leading-relaxed font-medium">
            Deze tool verhuist de data naar een veilige 4-staps structuur. Dit
            lost het probleem op waarbij de database bleef "hangen" op ongeldige
            paden.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 h-48 overflow-y-auto font-mono text-[10px] text-slate-500 space-y-1 custom-scrollbar border border-slate-100">
          {logs.map((log, i) => (
            <p key={i}>{log}</p>
          ))}
          {logs.length === 0 && <p className="italic">Wacht op start...</p>}
        </div>

        <button
          onClick={runMigration}
          disabled={status === "running"}
          className="w-full py-6 bg-slate-900 text-white rounded-[25px] font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all disabled:opacity-50"
        >
          {status === "running" ? "Bezig met verplaatsen..." : "Start Migratie"}
        </button>
      </div>
    </div>
  );
};

export default DataMigrationTool;
