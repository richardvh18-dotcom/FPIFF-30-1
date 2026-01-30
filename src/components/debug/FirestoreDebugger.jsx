import React, { useState, useEffect } from "react";
import { db, auth } from "../../config/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";
import {
  Terminal,
  Database,
  ShieldAlert,
  CheckCircle2,
  SearchCode,
} from "lucide-react";

/**
 * FirestoreDebugger - Hulpmiddel om database paden te valideren.
 */
const FirestoreDebugger = () => {
  const [logs, setLogs] = useState([]);
  const [activeId, setActiveId] = useState(
    typeof __app_id !== "undefined" ? __app_id : "default"
  );

  const addLog = (msg, type = "info") => {
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10)
    );
  };

  const testPath = async (pathArray) => {
    const pathStr = pathArray.join("/");
    addLog(`Testen: /${pathStr}...`);
    try {
      const snap = await getDocs(query(collection(db, ...pathArray), limit(1)));
      if (!snap.empty) {
        addLog(`✅ DATA GEVONDEN op /${pathStr}`, "success");
      } else {
        addLog(`ℹ️ Pad bestaat, maar map is leeg: /${pathStr}`);
      }
    } catch (e) {
      addLog(`❌ FOUT (${e.code}) op /${pathStr}`, "error");
    }
  };

  const runDiagnostics = () => {
    setLogs([]);
    addLog(`Start diagnostiek voor App ID: ${activeId}`);

    // Test Sandbox Paden
    testPath(["artifacts", activeId, "public", "data", "products"]);
    testPath(["artifacts", activeId, "public", "data", "user_roles"]);

    // Test Root Paden
    testPath(["future-factory", "products"]);
  };

  return (
    <div className="p-4 bg-slate-900 rounded-2xl border border-white/10 text-left shadow-2xl">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2 text-blue-400">
          <Terminal size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Firestore Path Debugger
          </span>
        </div>
        <button
          onClick={runDiagnostics}
          className="text-[9px] font-black bg-blue-600 text-white px-3 py-1 rounded-lg uppercase tracking-tighter hover:bg-blue-500 transition-all"
        >
          Scan Database
        </button>
      </div>

      <div className="space-y-1 h-32 overflow-y-auto custom-scrollbar pr-2">
        {logs.length === 0 ? (
          <p className="text-[10px] text-slate-500 italic">
            Klik op 'Scan Database' om paden te controleren.
          </p>
        ) : (
          logs.map((log, i) => (
            <p
              key={i}
              className={`text-[10px] font-mono leading-tight ${
                log.includes("✅")
                  ? "text-emerald-400"
                  : log.includes("❌")
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {log}
            </p>
          ))
        )}
      </div>
    </div>
  );
};

export default FirestoreDebugger;
