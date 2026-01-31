import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  Search,
  RefreshCw,
  Trash2,
  ChevronRight,
  FileText,
  AlertTriangle,
  Loader2,
  HardDrive,
  Layers,
  Table,
  SearchCode,
  Map,
  Fingerprint,
  Eye,
  Globe,
  Activity,
  Terminal,
  Bug,
  SearchIcon,
  ShieldCheck,
  ShieldAlert,
  X,
} from "lucide-react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  limit,
  getDoc,
  collectionGroup,
} from "firebase/firestore";
import { PATHS, isValidPath } from "../../config/dbPaths";

/**
 * AdminDatabaseView V4.0 - Root-Ready Forensic Edition
 * Gebruikt PATHS uit dbPaths.js om data te valideren in de /future-factory/ root.
 * Bevat een 'Crawl' functie om door legacy collecties te zoeken.
 */
const AdminDatabaseView = () => {
  const [selectedKey, setSelectedKey] = useState("PRODUCTS");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Metadata & Recovery
  const [discoveryLog, setDiscoveryLog] = useState([]);
  const [activePath, setActivePath] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);

  // Lijst van modules gebaseerd op dbPaths.js
  const MODULES = [
    { key: "PRODUCTS", label: "Product Catalogus", icon: <Layers size={18} /> },
    {
      key: "PLANNING",
      label: "Digitale Planning",
      icon: <Activity size={18} />,
    },
    { key: "TRACKING", label: "Live Tracking", icon: <SearchCode size={18} /> },
    {
      key: "USERS",
      label: "Gebruikers Accounts",
      icon: <Fingerprint size={18} />,
    },
    {
      key: "GENERAL_SETTINGS",
      label: "Systeem Config",
      icon: <Terminal size={18} />,
    },
    {
      key: "BORE_DIMENSIONS",
      label: "Boring Specs",
      icon: <Table size={18} />,
    },
    {
      key: "CB_DIMENSIONS",
      label: "CB Mof Maten",
      icon: <Database size={18} />,
    },
    {
      key: "TB_DIMENSIONS",
      label: "TB Mof Maten",
      icon: <Database size={18} />,
    },
  ];

  const addLog = (msg) =>
    setDiscoveryLog((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10)
    );

  // 1. FORENSIC CRAWLER: Zoekt op collectienaam (collectionGroup)
  const runDeepCrawl = async () => {
    setIsCrawling(true);
    setDocuments([]);
    const colName = PATHS[selectedKey][PATHS[selectedKey].length - 1];
    addLog(`Deep Crawl gestart voor collectie: ${colName}...`);

    try {
      const groupRef = collectionGroup(db, colName);
      const q = query(groupRef, limit(25));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const foundPath = snapshot.docs[0].ref.path.split(
          "/" + snapshot.docs[0].id
        )[0];
        addLog(`🔥 DATA GEVONDEN! PUNT: /${foundPath}`);
        setActivePath(foundPath);
        setDocuments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } else {
        addLog(`❌ Geen data gevonden voor '${colName}' in de gehele DB.`);
      }
    } catch (err) {
      addLog(`FOUT: ${err.code}`);
    } finally {
      setIsCrawling(false);
    }
  };

  // 2. PRIMARY FETCH (Gebruikt dbPaths.js)
  const fetchPathData = async () => {
    if (!isValidPath(selectedKey)) return;

    setLoading(true);
    setDocuments([]);
    const pathArray = PATHS[selectedKey];
    const pathStr = pathArray.join("/");
    setActivePath(pathStr);

    addLog(`Inspectie pad: /${pathStr}`);

    try {
      // Als pad-lengte even is, is het een document. Als het oneven is, een collectie.
      if (pathArray.length % 2 !== 0) {
        const colRef = collection(db, ...pathArray);
        const snapshot = await getDocs(query(colRef, limit(50)));
        setDocuments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        addLog(`✅ ${snapshot.size} items geladen.`);
      } else {
        // Het is een document (bijv. settings/main)
        const docRef = doc(db, ...pathArray);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setDocuments([{ id: snap.id, ...snap.data(), _isSingleDoc: true }]);
          addLog(`✅ Document geladen.`);
        } else {
          addLog(`ℹ️ Document bestaat niet op dit pad.`);
        }
      }
    } catch (e) {
      addLog(`❌ Fout: ${e.code}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPathData();
  }, [selectedKey]);

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Document definitief verwijderen uit de root?")) return;
    try {
      const docRef = doc(db, ...activePath.split("/"), docId);
      await deleteDoc(docRef);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      addLog(`Verwijderd: ${docId}`);
    } catch (error) {
      alert("Delete failed: " + error.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden animate-in fade-in text-left">
      {/* HEADER */}
      <div className="p-6 bg-slate-900 border-b border-white/10 flex justify-between items-center shrink-0 z-10 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-xl rotate-2">
            <Bug size={28} />
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
              Root <span className="text-blue-500">Explorer</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">
              V4.0 | Path Integrity Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={runDeepCrawl}
            disabled={isCrawling}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] tracking-widest flex items-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isCrawling ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <SearchIcon size={18} />
            )}
            Forensic Crawl
          </button>
          <button
            onClick={fetchPathData}
            className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 active:scale-95"
          >
            <RefreshCw
              size={20}
              className={
                loading ? "animate-spin text-blue-400" : "text-slate-400"
              }
            />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-80 border-r border-white/10 bg-slate-950 flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar shadow-2xl z-20">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Terminal size={12} className="text-blue-500" />
              <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Gevalideerde Mappen
              </h3>
            </div>

            {MODULES.map((mod) => (
              <button
                key={mod.key}
                onClick={() => setSelectedKey(mod.key)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left border-2 group ${
                  selectedKey === mod.key
                    ? "bg-blue-600/10 border-blue-500 shadow-lg"
                    : "bg-white/5 border-transparent hover:bg-white/10 text-slate-400"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedKey === mod.key
                      ? "bg-blue-500 text-white"
                      : "bg-slate-900 text-slate-600"
                  }`}
                >
                  {mod.icon}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span
                    className={`text-xs font-black uppercase italic tracking-tight ${
                      selectedKey === mod.key ? "text-white" : "text-slate-400"
                    }`}
                  >
                    {mod.label}
                  </span>
                  <span className="text-[8px] font-mono text-slate-600 truncate uppercase">
                    {mod.key}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-auto p-6 bg-slate-900 rounded-[30px] border border-white/5 relative overflow-hidden shadow-inner">
            <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
              <HardDrive size={60} />
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">
              Huidig Root Pad:
            </p>
            <code className="text-[10px] font-mono text-emerald-400 break-all leading-relaxed block bg-black/40 p-3 rounded-xl border border-white/5">
              /{activePath || "Selecteer module..."}
            </code>
          </div>
        </div>

        {/* DATA CONTENT */}
        <div className="flex-1 flex flex-col bg-slate-900 relative">
          {/* LOGS BAR */}
          <div className="p-3 bg-black/40 border-b border-white/5 flex gap-4 overflow-x-auto no-scrollbar shrink-0 shadow-inner">
            {discoveryLog.map((log, i) => (
              <div
                key={i}
                className={`whitespace-nowrap px-4 py-1.5 rounded-lg border text-[9px] font-mono ${
                  log.includes("✅") || log.includes("🔥")
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-white/5 border-white/5 text-slate-500"
                }`}
              >
                {log}
              </div>
            ))}
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {loading || isCrawling ? (
              <div className="h-full flex flex-col items-center justify-center opacity-60">
                <Loader2
                  className="animate-spin text-blue-400 mb-4"
                  size={40}
                />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 italic animate-pulse">
                  Synchroniseren...
                </p>
              </div>
            ) : documents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                <div className="p-10 bg-white/5 rounded-full mb-6 border-2 border-dashed border-white/10">
                  <Database size={60} className="text-slate-600" />
                </div>
                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">
                  Pad is leeg
                </h4>
                <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
                  Dit gedeelte van de <b>/future-factory/</b> root bevat nog
                  geen documenten.
                </p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6 pb-40">
                <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/10 mb-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span className="text-xs font-black uppercase italic tracking-widest text-slate-300">
                      Live Root Data: {selectedKey}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {documents.length} Records
                  </span>
                </div>

                {documents.map((docItem) => (
                  <div
                    key={docItem.id}
                    className="bg-slate-900 border border-white/10 rounded-[35px] overflow-hidden shadow-xl hover:border-blue-500/30 transition-all group"
                  >
                    <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                            Document ID
                          </p>
                          <code className="text-xs font-black text-blue-300 uppercase tracking-tight">
                            {docItem.id}
                          </code>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDoc(docItem.id)}
                        className="p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="p-8">
                      <pre className="text-xs font-mono text-slate-400 leading-relaxed max-h-96 overflow-y-auto custom-scrollbar text-left bg-black/40 p-6 rounded-[25px] border border-white/5 shadow-inner">
                        {JSON.stringify(
                          docItem,
                          (key, value) =>
                            key.startsWith("_") ? undefined : value,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-950 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] px-10 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <Globe size={12} /> Global Node Active
          </span>
          <span className="flex items-center gap-2">
            <ShieldAlert size={12} /> High-Level Diagnostics
          </span>
        </div>
        <span className="opacity-50">Future Factory MES Core v6.11</span>
      </div>
    </div>
  );
};

export default AdminDatabaseView;
