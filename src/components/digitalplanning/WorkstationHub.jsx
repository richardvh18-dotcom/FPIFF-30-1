import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Cpu,
  UserCircle,
  ChevronRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { PATHS } from "../../config/dbPaths";

/**
 * WorkstationHub - V4.1 (Centralized Path Sync)
 * Gebruikt nu het gevalideerde 4-segmenten pad voor factory_config.
 */
const WorkstationHub = ({ department, onBack }) => {
  const [factoryConfig, setFactoryConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // PAD FIX: doc() vereist een even aantal segmenten
    const docRef = doc(db, ...PATHS.FACTORY_CONFIG);

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setFactoryConfig(snap.data());
        }
        setLoading(false);
      },
      (err) => {
        console.error("Fout bij laden factory_config:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const stations = useMemo(() => {
    if (!factoryConfig || !department) return [];
    const slugMap = { FITTINGS: "fittings", PIPES: "pipes", SPOOLS: "spools" };
    const targetSlug = slugMap[department] || department.toLowerCase();
    const deptData = (factoryConfig.departments || []).find(
      (d) => d.slug === targetSlug
    );
    return deptData ? deptData.stations || [] : [];
  }, [factoryConfig, department]);

  if (loading)
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col animate-in fade-in duration-500 overflow-hidden text-left">
      <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 shadow-sm px-8">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-400 transition-all active:scale-90 shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-left">
            <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              {department} <span className="text-blue-600">Productions</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 italic">
              Gevalideerd via MES Core
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => (
            <div
              key={station.id}
              className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-sm"
            >
              <Cpu size={32} className="text-blue-500 mb-6" />
              <h4 className="text-xl font-black text-slate-800 uppercase italic">
                {station.name}
              </h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkstationHub;
