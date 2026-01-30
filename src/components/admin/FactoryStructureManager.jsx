import React, { useState, useEffect } from "react";
import {
  Building2,
  Cpu,
  Plus,
  Trash2,
  Save,
  Loader2,
  Layout,
  X,
  Database,
  AlertCircle,
  CheckCircle2,
  Globe,
  ChevronDown,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Bug,
  Settings2,
  Activity,
} from "lucide-react";
import { db } from "../../config/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { PATHS } from "../../config/dbPaths";

/**
 * FactoryStructureManager V4.0 - Full Functionality Restore
 * Beheert afdelingen, machines en ploegen in de nieuwe database-root.
 */
const FactoryStructureManager = () => {
  const [config, setConfig] = useState({ departments: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [expandedDepts, setExpandedDepts] = useState({});
  const [showDebug, setShowDebug] = useState(false);

  // Pad: /future-factory/production/config/factory_config
  const CONFIG_PATH = PATHS.FACTORY_CONFIG;

  useEffect(() => {
    const docRef = doc(db, ...CONFIG_PATH);
    const unsub = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setConfig(docSnap.data());
        } else {
          setConfig({ departments: [] });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Fout:", err);
        setStatus({ type: "error", msg: `Toegang geweigerd: ${err.code}` });
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const toggleExpand = (id) => {
    setExpandedDepts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- LOGICA VOOR AFDELINGEN ---
  const addDepartment = () => {
    const id = `dept_${Date.now()}`;
    const newDept = {
      id: id,
      name: "Nieuwe Afdeling",
      slug: "new-dept",
      country: "Nederland",
      stations: [],
      shifts: [
        { id: "VROEG", label: "Vroege Ploeg", start: "06:00", end: "14:15" },
        { id: "LAAT", label: "Late Ploeg", start: "14:15", end: "22:30" },
      ],
      isActive: true,
    };
    setConfig((prev) => ({
      ...prev,
      departments: [...(prev.departments || []), newDept],
    }));
    setExpandedDepts((prev) => ({ ...prev, [id]: true }));
  };

  const updateDept = (id, field, value) => {
    setConfig((prev) => ({
      ...prev,
      departments: (prev.departments || []).map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
  };

  const deleteDept = (id) => {
    if (
      !window.confirm(
        "Weet je zeker dat je deze volledige afdeling wilt verwijderen?"
      )
    )
      return;
    setConfig((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d.id !== id),
    }));
  };

  // --- LOGICA VOOR STATIONS ---
  const addStation = (deptId) => {
    setConfig((prev) => ({
      ...prev,
      departments: prev.departments.map((d) => {
        if (d.id === deptId) {
          const newStation = {
            id: `st_${Date.now()}`,
            name: "MACHINE-01",
            type: "machine",
          };
          return { ...d, stations: [...(d.stations || []), newStation] };
        }
        return d;
      }),
    }));
  };

  const updateStation = (deptId, stationId, value) => {
    setConfig((prev) => ({
      ...prev,
      departments: prev.departments.map((d) => {
        if (d.id === deptId) {
          return {
            ...d,
            stations: d.stations.map((s) =>
              s.id === stationId ? { ...s, name: value.toUpperCase() } : s
            ),
          };
        }
        return d;
      }),
    }));
  };

  const removeStation = (deptId, stationId) => {
    setConfig((prev) => ({
      ...prev,
      departments: prev.departments.map((d) => {
        if (d.id === deptId) {
          return {
            ...d,
            stations: (d.stations || []).filter((s) => s.id !== stationId),
          };
        }
        return d;
      }),
    }));
  };

  // --- LOGICA VOOR PLOEGEN ---
  const addShift = (deptId) => {
    setConfig((prev) => ({
      ...prev,
      departments: prev.departments.map((d) => {
        if (d.id === deptId) {
          const newShift = {
            id: `sh_${Date.now()}`,
            label: "Dagdienst",
            start: "07:30",
            end: "16:15",
          };
          return { ...d, shifts: [...(d.shifts || []), newShift] };
        }
        return d;
      }),
    }));
  };

  const updateShift = (deptId, shiftId, field, value) => {
    setConfig((prev) => ({
      ...prev,
      departments: prev.departments.map((d) => {
        if (d.id === deptId) {
          return {
            ...d,
            shifts: d.shifts.map((s) =>
              s.id === shiftId ? { ...s, [field]: value } : s
            ),
          };
        }
        return d;
      }),
    }));
  };

  const removeShift = (deptId, shiftId) => {
    setConfig((prev) => ({
      ...prev,
      departments: prev.departments.map((d) => {
        if (d.id === deptId) {
          return { ...d, shifts: d.shifts.filter((s) => s.id !== shiftId) };
        }
        return d;
      }),
    }));
  };

  // --- OPSLAAN NAAR FIRESTORE ---
  const saveConfig = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const docRef = doc(db, ...CONFIG_PATH);
      await setDoc(
        docRef,
        {
          ...config,
          lastUpdated: serverTimestamp(),
          projectName: "Future Factory Production",
          version: "4.0",
        },
        { merge: true }
      );

      setStatus({ type: "success", msg: "Configuratie live gezet!" });
      setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      console.error("Save Error:", err);
      setStatus({ type: "error", msg: `Fout: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-blue-500 mx-auto" size={48} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            Fabrieksdata ophalen...
          </p>
        </div>
      </div>
    );

  return (
    <div className="h-full bg-slate-50 overflow-y-auto custom-scrollbar text-left pb-40">
      <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in">
        {/* Header Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Settings2 size={120} className="text-slate-900" />
          </div>

          <div className="text-left relative z-10">
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Fabrieks <span className="text-blue-600">Structuur</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" /> Database
              Root: /future-factory/
            </p>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            {status && (
              <div
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 animate-in slide-in-from-right-2 ${
                  status.type === "success"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                {status.msg}
              </div>
            )}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`p-4 rounded-2xl transition-all ${
                showDebug
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              }`}
              title="Pad Debugger"
            >
              <Bug size={18} />
            </button>
            <button
              onClick={addDepartment}
              className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all active:scale-95"
            >
              <Plus size={16} /> Nieuwe Afdeling
            </button>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 hover:bg-blue-700 transition-all"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}{" "}
              Publiceren
            </button>
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div className="bg-slate-900 rounded-3xl p-6 text-white font-mono text-[10px] space-y-2 animate-in zoom-in-95 border-b-4 border-blue-500 shadow-2xl">
            <p className="text-blue-400 font-black mb-2">
              --- DATABASE PATH DEBUGGER ---
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p>
                <span className="text-slate-500">Root:</span> {CONFIG_PATH[0]}
              </p>
              <p>
                <span className="text-slate-500">Doc:</span> {CONFIG_PATH[1]}
              </p>
              <p>
                <span className="text-slate-500">Col:</span> {CONFIG_PATH[2]}
              </p>
              <p>
                <span className="text-slate-500">Target:</span> {CONFIG_PATH[3]}
              </p>
            </div>
            <p className="pt-4 text-slate-500 border-t border-white/10 italic">
              Volledig Firestore Pad: /{CONFIG_PATH.join("/")}
            </p>
          </div>
        )}

        {/* Departments Grid */}
        <div className="space-y-6">
          {(config.departments || []).length === 0 ? (
            <div className="bg-white border-4 border-dashed border-slate-200 rounded-[45px] p-24 text-center opacity-60">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Building2 size={40} />
              </div>
              <h3 className="text-xl font-black uppercase italic text-slate-800">
                Geen afdelingen gevonden
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 mb-8">
                Begin met het opbouwen van je fabriek
              </p>
              <button
                onClick={addDepartment}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-700 transition-all"
              >
                + Voeg Afdeling Toe
              </button>
            </div>
          ) : (
            config.departments.map((dept) => (
              <div
                key={dept.id}
                className={`bg-white rounded-[45px] border-2 transition-all duration-300 shadow-sm overflow-hidden ${
                  expandedDepts[dept.id]
                    ? "border-blue-500 ring-8 ring-blue-500/5 shadow-2xl"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div
                  className={`p-8 flex justify-between items-center cursor-pointer transition-colors ${
                    expandedDepts[dept.id]
                      ? "bg-blue-50/20"
                      : "hover:bg-slate-50/50"
                  }`}
                  onClick={() => toggleExpand(dept.id)}
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`p-5 rounded-2xl shadow-md transition-all ${
                        expandedDepts[dept.id]
                          ? "bg-blue-600 text-white scale-110"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Building2 size={28} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                        {dept.name}
                      </h4>
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Globe size={12} /> {dept.country}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-l border-slate-200 pl-4">
                          <Cpu size={12} /> {(dept.stations || []).length}{" "}
                          Stations
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-l border-slate-200 pl-4">
                          <Clock size={12} /> {(dept.shifts || []).length}{" "}
                          Ploegen
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDept(dept.id);
                      }}
                      className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                    <ChevronDown
                      className={`transition-transform duration-500 ${
                        expandedDepts[dept.id]
                          ? "rotate-180 text-blue-500"
                          : "text-slate-300"
                      }`}
                      size={28}
                    />
                  </div>
                </div>

                {expandedDepts[dept.id] && (
                  <div className="p-8 md:p-12 border-t border-slate-100 bg-white space-y-12 animate-in slide-in-from-top-4 duration-500">
                    {/* 1. Basis Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">
                          Afdeling Naam
                        </label>
                        <input
                          type="text"
                          value={dept.name}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateDept(dept.id, "name", e.target.value)
                          }
                          className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[22px] font-black uppercase text-sm outline-none focus:border-blue-500 transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">
                          Hub Land / Locatie
                        </label>
                        <select
                          value={dept.country}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateDept(dept.id, "country", e.target.value)
                          }
                          className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[22px] font-black uppercase text-sm outline-none focus:border-blue-500 transition-all cursor-pointer shadow-inner"
                        >
                          <option value="Nederland">
                            Nederland (FPi Hardenberg)
                          </option>
                          <option value="Dubai">Dubai (DXB Plant)</option>
                          <option value="EGT">Egypte (EGT Plant)</option>
                        </select>
                      </div>
                    </div>

                    {/* 2. Stations Editor */}
                    <div className="space-y-6 pt-6 border-t border-slate-50">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                          <Activity size={16} /> Productie Stations
                        </h5>
                        <button
                          onClick={() => addStation(dept.id)}
                          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all"
                        >
                          + Station
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {(dept.stations || []).map((station) => (
                          <div key={station.id} className="relative group/st">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover/st:text-blue-500 transition-colors pointer-events-none">
                              <Cpu size={16} />
                            </div>
                            <input
                              type="text"
                              value={station.name}
                              onChange={(e) =>
                                updateStation(
                                  dept.id,
                                  station.id,
                                  e.target.value
                                )
                              }
                              className="w-full pl-12 pr-10 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none focus:border-blue-500 focus:bg-white shadow-sm transition-all"
                            />
                            <button
                              onClick={() => removeStation(dept.id, station.id)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-200 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Shifts Editor */}
                    <div className="space-y-6 pt-6 border-t border-slate-50">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-[11px] font-black text-orange-600 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                          <Clock size={16} /> Ploegendiensten (Shifts)
                        </h5>
                        <button
                          onClick={() => addShift(dept.id)}
                          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-slate-800 transition-all"
                        >
                          + Ploeg
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(dept.shifts || []).map((shift) => (
                          <div
                            key={shift.id}
                            className="p-6 bg-slate-50 rounded-[30px] border border-slate-200 space-y-4 relative group/sh"
                          >
                            <input
                              type="text"
                              value={shift.label}
                              onChange={(e) =>
                                updateShift(
                                  dept.id,
                                  shift.id,
                                  "label",
                                  e.target.value
                                )
                              }
                              className="w-full bg-transparent font-black uppercase text-xs text-slate-800 outline-none border-b border-transparent focus:border-orange-300"
                            />
                            <div className="flex items-center gap-3">
                              <input
                                type="time"
                                value={shift.start}
                                onChange={(e) =>
                                  updateShift(
                                    dept.id,
                                    shift.id,
                                    "start",
                                    e.target.value
                                  )
                                }
                                className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                              />
                              <ArrowRight
                                size={14}
                                className="text-slate-300"
                              />
                              <input
                                type="time"
                                value={shift.end}
                                onChange={(e) =>
                                  updateShift(
                                    dept.id,
                                    shift.id,
                                    "end",
                                    e.target.value
                                  )
                                }
                                className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                              />
                            </div>
                            <button
                              onClick={() => removeShift(dept.id, shift.id)}
                              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover/sh:opacity-100 transition-all"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FactoryStructureManager;
