import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { db, auth } from "../../config/firebase";
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

/**
 * AdminDatabaseView V3.3 - Brute Force Crawler Edition
 * Deze versie bevat een 'Crawler' die door de hele database zoekt naar data,
 * ongeacht de mappenstructuur of App ID.
 */
const AdminDatabaseView = () => {
  const [selectedCollection, setSelectedCollection] = useState("products");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Debug & Discovery state
  const [discoveryLog, setDiscoveryLog] = useState([]);
  const [foundAppIds, setFoundAppIds] = useState([]);
  const [activePath, setActivePath] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);

  const appId = typeof __app_id !== "undefined" ? __app_id : "fittings-app-v1";

  const COLLECTIONS = [
    { id: "products", label: "Producten", color: "text-blue-400" },
    { id: "digital_planning", label: "Planning", color: "text-emerald-400" },
    { id: "user_roles", label: "Gebruikers", color: "text-indigo-400" },
    { id: "tracked_products", label: "Tracking", color: "text-orange-400" },
    { id: "settings", label: "Instellingen", color: "text-amber-400" },
  ];

  const addLog = (msg) =>
    setDiscoveryLog((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15)
    );

  // 1. CRAWLER: Zoekt overal naar de collectienaam (negeert paden)
  const runDeepCrawl = async () => {
    setIsCrawling(true);
    setDocuments([]);
    addLog(`Deep Crawl gestart voor: ${selectedCollection}...`);

    try {
      // Gebruik collectionGroup om overal in de DB te zoeken
      const groupRef = collectionGroup(db, selectedCollection);
      const q = query(groupRef, limit(20));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const foundPath = snapshot.docs[0].ref.path.split(
          "/" + snapshot.docs[0].id
        )[0];
        addLog(`🔥 DATA GEVONDEN via Crawler!`);
        addLog(`📍 Locatie: /${foundPath}`);
        setActivePath(foundPath);

        const docsList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDocuments(docsList);
      } else {
        addLog(
          `❌ Crawler kon niets vinden voor '${selectedCollection}' in de gehele database.`
        );
      }
    } catch (err) {
      addLog(`FOUT tijdens crawl: ${err.code}`);
      if (err.code === "failed-precondition") {
        addLog("Advies: Maak een index aan in Firebase Console (zie log).");
      }
    } finally {
      setIsCrawling(false);
    }
  };

  // 2. STANDAARD FETCH (Met pad-switch)
  const fetchCollectionData = async () => {
    setLoading(true);
    setDocuments([]);

    const pathsToTry = [
      ["artifacts", appId, "public", "data", selectedCollection],
      ["artifacts", appId, selectedCollection],
      [selectedCollection], // Root level fallback
    ];

    let found = false;

    for (const pathArray of pathsToTry) {
      const pathStr = pathArray.join("/");
      addLog(`Check: /${pathStr}`);

      try {
        const colRef = collection(db, ...pathArray);
        const snapshot = await getDocs(query(colRef, limit(20)));

        if (!snapshot.empty) {
          addLog(`✅ Succes op pad: /${pathStr}`);
          setActivePath(pathStr);
          setDocuments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
          found = true;
          break;
        }
      } catch (e) {
        addLog(`⚠️ Pad /${pathStr} mislukt: ${e.code}`);
      }
    }

    if (!found) addLog(`❌ Geen data gevonden via standaard paden.`);
    setLoading(false);
  };

  // Scan root IDs bij laden
  useEffect(() => {
    const scanRoot = async () => {
      try {
        const snap = await getDocs(collection(db, "artifacts"));
        setFoundAppIds(snap.docs.map((d) => d.id));
      } catch (e) {}
    };
    scanRoot();
    fetchCollectionData();
  }, [selectedCollection, appId]);

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Document definitief verwijderen?")) return;
    try {
      const pathParts = activePath.split("/");
      const docRef = doc(db, ...pathParts, docId);
      await deleteDoc(docRef);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      addLog(`Verwijderd: ${docId}`);
    } catch (error) {
      alert("Fout: " + error.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden animate-in fade-in text-left">
      {/* TOPBAR */}
      <div className="p-6 bg-slate-900 border-b border-white/10 flex justify-between items-center shrink-0 z-10 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40 rotate-2">
            <Bug size={28} />
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
              Database <span className="text-blue-500">Crawler</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">
              V3.3 | Forensic Recovery
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={runDeepCrawl}
            disabled={isCrawling}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isCrawling ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <SearchIcon size={18} />
            )}
            Deep Crawl DB
          </button>
          <button
            onClick={fetchCollectionData}
            className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 active:scale-95"
          >
            <RefreshCw
              size={20}
              className={`${
                loading ? "animate-spin text-blue-400" : "text-slate-400"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (Linker Kolom - w-96) */}
        <div className="w-96 border-r border-white/10 bg-slate-950 flex flex-col p-6 gap-8 overflow-y-auto custom-scrollbar shadow-2xl z-20">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Terminal size={14} className="text-blue-500" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Kies Map om te Scannen
              </h3>
            </div>

            {COLLECTIONS.map((col) => (
              <button
                key={col.id}
                onClick={() => setSelectedCollection(col.id)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all text-left border-2 group relative overflow-hidden ${
                  selectedCollection === col.id
                    ? "bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                    : "bg-white/5 border-transparent hover:bg-white/10 text-slate-400"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      selectedCollection === col.id
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-slate-900 text-slate-500"
                    }`}
                  >
                    <Table size={20} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span
                      className={`text-base font-black uppercase italic tracking-tight leading-none ${
                        selectedCollection === col.id
                          ? "text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {col.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mt-1.5">
                      /{col.id}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-auto space-y-6">
            <div className="p-6 bg-black/60 rounded-[35px] border border-white/5 text-left">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Globe size={14} className="text-blue-400" /> Geregistreerde
                Project IDs
              </p>
              <div className="flex flex-col gap-2">
                {foundAppIds.map((id) => (
                  <div
                    key={id}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-mono font-bold ${
                      id === appId
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-white/5 text-slate-500"
                    }`}
                  >
                    <span>{id}</span>
                    {id === appId && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-[35px] border border-white/10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                <HardDrive size={70} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity size={14} className="text-emerald-500" /> Huidig Pad:
              </p>
              <code className="text-[11px] font-mono text-blue-400 break-all leading-relaxed block bg-black/40 p-4 rounded-2xl border border-white/5">
                /{activePath || "Zoeken..."}
              </code>
            </div>
          </div>
        </div>

        {/* MAIN VIEW AREA */}
        <div className="flex-1 flex flex-col bg-slate-900 relative">
          {/* DEBUG LOG PANEL */}
          <div className="p-4 bg-black/40 border-b border-white/5 flex gap-4 overflow-x-auto no-scrollbar shrink-0 shadow-inner">
            <div className="flex items-center gap-3 px-4 border-r border-white/10 shrink-0">
              <Terminal size={12} className="text-slate-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Systeem Logboek
              </span>
            </div>
            {discoveryLog.map((log, i) => (
              <div
                key={i}
                className={`whitespace-nowrap px-4 py-1.5 rounded-xl border text-[10px] font-mono transition-all ${
                  log.includes("✅") || log.includes("🔥")
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : log.includes("❌") || log.includes("FOUT")
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-white/5 border-white/5 text-slate-500"
                }`}
              >
                {log}
              </div>
            ))}
          </div>

          {/* DOCUMENT LIST */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gradient-to-b from-slate-900 to-slate-950">
            {loading || isCrawling ? (
              <div className="h-full flex flex-col items-center justify-center opacity-60">
                <Loader2
                  className="animate-spin text-blue-400 mb-4"
                  size={48}
                />
                <p className="text-xs font-black uppercase tracking-[0.4em] text-blue-400 animate-pulse italic">
                  Onderzoek in uitvoering...
                </p>
              </div>
            ) : documents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center animate-in zoom-in">
                <div className="p-12 bg-white/5 rounded-full mb-8 border-2 border-dashed border-white/10 shadow-inner">
                  <AlertTriangle size={80} className="text-slate-600" />
                </div>
                <h4 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2">
                  Geen Documenten
                </h4>
                <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Geen data gevonden voor{" "}
                  <span className="text-white">'{selectedCollection}'</span> via
                  de standaard paden.
                  <br />
                  <br />
                  Gebruik de knop <b>"Deep Crawl DB"</b> rechtsboven om de hele
                  database te doorzoeken.
                </p>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto grid grid-cols-1 gap-8 pb-40">
                <div className="flex items-center justify-between px-4 bg-white/5 p-5 rounded-[30px] border border-white/5 mb-2">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-lg">
                      <Layers size={18} />
                    </div>
                    <span className="text-base font-black text-white uppercase italic tracking-tight">
                      {documents.length} Items gevonden in /{activePath}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                    Raw Data View
                  </span>
                </div>

                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-slate-900 border border-white/10 rounded-[45px] overflow-hidden shadow-2xl hover:border-blue-500/40 transition-all group relative text-left"
                  >
                    <div className="p-7 bg-white/5 border-b border-white/5 flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-600/20 text-blue-400 rounded-2xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText size={24} />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5">
                            Document ID
                          </p>
                          <code className="text-sm font-black text-blue-300 bg-black/40 px-4 py-1.5 rounded-xl border border-white/10">
                            {doc.id}
                          </code>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-4 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>

                    <div className="p-10">
                      <pre className="text-[13px] font-mono text-slate-400 leading-loose max-h-96 overflow-y-auto custom-scrollbar text-left bg-black/20 p-8 rounded-[35px] border border-white/5 shadow-inner">
                        {JSON.stringify(doc, null, 2)}
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
        <span>Future Factory DB Crawler v3.3</span>
        <div className="flex gap-10">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>{" "}
            Connected: {appId}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminDatabaseView;
