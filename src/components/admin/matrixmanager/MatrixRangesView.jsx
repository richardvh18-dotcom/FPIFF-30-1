import React, { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  Database,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Settings2,
} from "lucide-react";
import { db } from "../../../config/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { PATHS } from "../../../config/dbPaths";

/**
 * MatrixRangesView V5.0 - Root Enforcement
 * Beheert de wanddiktes en logica bereiken.
 * ALLES wordt nu opgeslagen op het root-pad: /future-factory/settings/matrix/main
 */
const MatrixRangesView = () => {
  const [config, setConfig] = useState({ ranges: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // 1. Data laden uit de nieuwe root-structuur
  useEffect(() => {
    // We gebruiken het centrale pad uit de dbPaths manager
    const docRef = doc(db, ...PATHS.MATRIX_CONFIG);

    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setConfig({
            ...data,
            ranges: Array.isArray(data.ranges) ? data.ranges : [],
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Fout bij laden matrix config:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // 2. Data opslaan naar de root
  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const docRef = doc(db, ...PATHS.MATRIX_CONFIG);

      await setDoc(
        docRef,
        {
          ...config,
          lastUpdated: serverTimestamp(),
          type: "MATRIX_RANGES_CONFIG",
          storagePath: PATHS.MATRIX_CONFIG.join("/"),
        },
        { merge: true }
      );

      setStatus({
        type: "success",
        msg: "Matrix succesvol gepubliceerd in de root!",
      });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setStatus({ type: "error", msg: `Opslaan mislukt: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const addRange = () => {
    const newRange = { id: Date.now(), min: 0, max: 0, wallThickness: 0 };
    setConfig((prev) => ({
      ...prev,
      ranges: [...(prev.ranges || []), newRange],
    }));
  };

  const removeRange = (idx) => {
    setConfig((prev) => ({
      ...prev,
      ranges: prev.ranges.filter((_, i) => i !== idx),
    }));
  };

  const updateRange = (idx, field, value) => {
    const newRanges = [...config.ranges];
    newRanges[idx][field] = value;
    setConfig({ ...config, ranges: newRanges });
  };

  if (loading)
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Matrix gegevens synchroniseren...
        </p>
      </div>
    );

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50 text-left custom-scrollbar animate-in fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Sectie */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-left">
            <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none">
              Matrix <span className="text-blue-600">Bereiken</span>
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <Database size={12} className="text-blue-500" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Actief Pad:
              </span>
              <code className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 italic">
                /{PATHS.MATRIX_CONFIG.join("/")}
              </code>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 flex items-center gap-3 active:scale-95"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}{" "}
            Bereiken Publiceren
          </button>
        </div>

        {/* Status Meldingen */}
        {status && (
          <div
            className={`p-5 rounded-3xl border-2 flex items-center gap-4 animate-in slide-in-from-top-2 ${
              status.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-700 shadow-emerald-100 shadow-md"
                : "bg-rose-50 border-rose-100 text-rose-700 shadow-rose-100 shadow-md"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <p className="text-[10px] font-black uppercase tracking-widest">
              {status.msg}
            </p>
          </div>
        )}

        {/* Tabel Kaart */}
        <div className="bg-white rounded-[45px] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-left">
                Wanddikte Calculatie Tabel (mm)
              </span>
            </div>
            <button
              onClick={addRange}
              className="p-2.5 bg-white rounded-xl text-blue-600 border border-slate-200 hover:bg-blue-50 transition-all shadow-sm active:scale-90"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="p-8 space-y-4">
            {config.ranges.length === 0 ? (
              <div className="py-12 text-center opacity-30 italic">
                <Database size={32} className="mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Geen bereiken geconfigureerd
                </p>
              </div>
            ) : (
              config.ranges.map((range, idx) => (
                <div
                  key={range.id || idx}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center bg-slate-50 p-6 rounded-[25px] border border-slate-100 group hover:border-blue-200 transition-all relative overflow-hidden"
                >
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      Minimale Ø (mm)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-mono text-sm font-bold outline-none focus:border-blue-500 transition-all"
                      value={range.min}
                      onChange={(e) => updateRange(idx, "min", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      Maximale Ø (mm)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-mono text-sm font-bold outline-none focus:border-blue-500 transition-all"
                      value={range.max}
                      onChange={(e) => updateRange(idx, "max", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 text-left relative">
                    <label className="text-[8px] font-black text-blue-500 uppercase tracking-tighter ml-1">
                      Wanddikte (mm)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.1"
                        className="w-full bg-white border-2 border-blue-100 rounded-xl p-3 font-mono text-sm font-black text-blue-600 outline-none focus:border-blue-500 transition-all shadow-sm"
                        value={range.wallThickness}
                        onChange={(e) =>
                          updateRange(idx, "wallThickness", e.target.value)
                        }
                      />
                      <button
                        onClick={() => removeRange(idx)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Verwijder bereik"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Informatieve Footer */}
        <div className="bg-slate-900 p-8 rounded-[45px] text-white/50 text-[9px] font-black uppercase tracking-[0.2em] flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
            <Database size={100} />
          </div>
          <div className="p-4 bg-blue-600 rounded-2xl shadow-lg text-white">
            <Settings2 size={20} />
          </div>
          <div className="text-left flex-1 relative z-10">
            <p className="text-white text-xs mb-1 italic tracking-tight">
              Root Protection Protocol Active
            </p>
            <p className="leading-relaxed">
              Deze instellingen worden gebruikt door de calculatoren om
              automatisch de juiste wanddikte te bepalen op basis van de
              geselecteerde productdiameter. Alle wijzigingen zijn direct live
              voor het hele systeem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatrixRangesView;
