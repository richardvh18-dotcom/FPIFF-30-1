import React, { useState, useEffect } from "react";
import {
  Grid,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Layers,
  Ruler,
  LayoutDashboard,
  FileText,
  Settings,
  FileUp,
  Database,
  Loader2,
  TableProperties,
  Target,
} from "lucide-react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { PATHS, isValidPath } from "../../../config/dbPaths";

// Sub-componenten
import AvailabilityView from "./AvailabilityView";
import LibraryView from "./LibraryView";
import BlueprintsView from "./BlueprintsView";
import DimensionsView from "./DimensionsView";
import SpecsView from "./SpecsView";
import BulkUploadView from "./BulkUploadView";
import MatrixRangesView from "./MatrixRangesView";
import AdminDrillingView from "./AdminDrillingView"; // NIEUW: Boorpatronen beheer

/**
 * AdminMatrixManager V7.5 - Full Access Edition
 * Beheert de volledige technische intelligentie inclusief boorpatronen (Drilling).
 */
const AdminMatrixManager = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("matrix");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Data States
  const [matrixData, setMatrixData] = useState({});
  const [libraryData, setLibraryData] = useState({
    connections: [],
    labels: [],
    extraCodes: [],
    product_names: [],
    pns: [],
    diameters: [],
    angles: [],
    borings: [],
  });
  const [blueprints, setBlueprints] = useState({});

  const addLog = (type, msg) => {
    setStatus({ type, msg });
    if (type === "error") console.error(`[MatrixManager] ${msg}`);
  };

  // 1. DATA INITIALISATIE UIT ROOT
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!isValidPath("MATRIX_CONFIG") || !isValidPath("GENERAL_SETTINGS")) {
          throw new Error("Systeempaden niet correct geconfigureerd.");
        }

        const [rangeSnap, configSnap, templatesSnap] = await Promise.all([
          getDoc(doc(db, ...PATHS.MATRIX_CONFIG)),
          getDoc(doc(db, ...PATHS.GENERAL_SETTINGS)),
          getDoc(doc(db, ...PATHS.BLUEPRINTS)),
        ]);

        if (rangeSnap.exists()) setMatrixData(rangeSnap.data());
        if (configSnap.exists()) setLibraryData(configSnap.data());
        if (templatesSnap.exists()) setBlueprints(templatesSnap.data());

        console.log("✅ Matrix Hub: Alle data gesynchroniseerd.");
      } catch (err) {
        addLog("error", `Sync fout: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. CENTRAAL OPSLAAN (Voor tabs die state in de parent beheren)
  const handleSave = async () => {
    setLoading(true);
    let pathArray = [];
    let data = {};

    if (activeTab === "matrix") {
      pathArray = PATHS.MATRIX_CONFIG;
      data = matrixData;
    } else if (activeTab === "library") {
      pathArray = PATHS.GENERAL_SETTINGS;
      data = libraryData;
    } else if (activeTab === "blueprints") {
      pathArray = PATHS.BLUEPRINTS;
      data = blueprints;
    } else {
      setLoading(false);
      return;
    }

    try {
      await setDoc(
        doc(db, ...pathArray),
        {
          ...data,
          lastUpdated: serverTimestamp(),
          updatedBy: "Admin Hub Core",
        },
        { merge: true }
      );

      addLog("success", "Wijzigingen live gepubliceerd!");
      setHasUnsavedChanges(false);
    } catch (e) {
      addLog("error", `Opslaan mislukt: ${e.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: "", msg: "" }), 4000);
    }
  };

  const TABS = [
    { id: "matrix", label: "Beschikbaarheid", icon: <Grid size={14} /> },
    { id: "drilling", label: "Boringen", icon: <Target size={14} /> }, // NIEUW: Tab voor boorpatronen
    { id: "ranges", label: "Wanddiktes", icon: <TableProperties size={14} /> },
    { id: "library", label: "Bibliotheek", icon: <Settings size={14} /> },
    { id: "blueprints", label: "Blauwdrukken", icon: <Layers size={14} /> },
    { id: "dimensions", label: "Maatvoering", icon: <Ruler size={14} /> },
    { id: "admin_upload", label: "Bulk Upload", icon: <FileUp size={14} /> },
    { id: "specs", label: "Overzicht", icon: <FileText size={14} /> },
  ];

  if (loading && Object.keys(matrixData).length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Matrix Hub Laden...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 w-full items-center text-left">
      {/* Header Unit */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 shadow-sm z-20 w-full h-20">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 italic uppercase leading-none">
            <LayoutDashboard size={24} className="text-blue-600" /> Matrix{" "}
            <span className="text-blue-600">Hub</span>
          </h2>
          {["matrix", "library", "blueprints"].includes(activeTab) && (
            <>
              <div className="h-8 w-px bg-slate-200"></div>
              <button
                onClick={handleSave}
                disabled={
                  loading || (!hasUnsavedChanges && status.type !== "error")
                }
                className={`px-8 py-2.5 rounded-xl transition-all font-black text-sm flex items-center gap-2 shadow-lg uppercase tracking-widest ${
                  hasUnsavedChanges || status.type === "error"
                    ? "bg-slate-900 text-white hover:bg-blue-600"
                    : "bg-slate-100 text-slate-300"
                }`}
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}{" "}
                Opslaan
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {hasUnsavedChanges && (
            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 uppercase tracking-widest animate-pulse italic">
              Wijzigingen in concept
            </span>
          )}
          {status.msg && (
            <div
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 animate-in fade-in zoom-in ${
                status.type === "error"
                  ? "bg-rose-50 text-rose-600 border border-rose-100 shadow-sm"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm"
              }`}
            >
              {status.type === "error" ? (
                <AlertTriangle size={14} />
              ) : (
                <CheckCircle size={14} />
              )}{" "}
              {status.msg}
            </div>
          )}
        </div>
      </div>

      {/* Navigatie Tabs */}
      <div className="flex justify-center bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 w-full overflow-x-auto no-scrollbar">
        <div className="flex gap-4 px-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? `border-blue-600 text-slate-900 bg-slate-50/50`
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="mr-2 opacity-50">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar w-full flex justify-center pb-20 text-left">
        <div className="w-full max-w-7xl p-8 animate-in fade-in duration-300">
          {activeTab === "matrix" && (
            <AvailabilityView
              libraryData={libraryData}
              matrixData={matrixData}
              setMatrixData={setMatrixData}
              setHasUnsavedChanges={setHasUnsavedChanges}
            />
          )}
          {activeTab === "drilling" && <AdminDrillingView />}
          {activeTab === "ranges" && <MatrixRangesView />}
          {activeTab === "library" && (
            <LibraryView
              libraryData={libraryData}
              setLibraryData={setLibraryData}
              setHasUnsavedChanges={setHasUnsavedChanges}
            />
          )}
          {activeTab === "blueprints" && (
            <BlueprintsView
              blueprints={blueprints}
              setBlueprints={setBlueprints}
              libraryData={libraryData}
              setHasUnsavedChanges={setHasUnsavedChanges}
            />
          )}
          {activeTab === "dimensions" && (
            <DimensionsView
              libraryData={libraryData}
              blueprints={blueprints}
              productRange={matrixData}
            />
          )}
          {activeTab === "admin_upload" && <BulkUploadView />}
          {activeTab === "specs" && <SpecsView blueprints={blueprints} />}
        </div>
      </div>
    </div>
  );
};

export default AdminMatrixManager;
