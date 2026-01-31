import React, { useState, useEffect, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  Layers,
  Database,
  CalendarRange,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import WorkstationHub from "./WorkstationHub";
import PlannerHub from "./PlannerHub";

/**
 * DigitalPlanningHub V5.0 - Stability Edition
 * Voorkomt witte schermen bij refresh door fallback-logica en
 * het opvangen van ontbrekende router states.
 */
const DigitalPlanningHub = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDept, setActiveDept] = useState(null);
  const [hasError, setHasError] = useState(false);

  // --- REFRESH VEILIGHEID ---
  useEffect(() => {
    try {
      // Als we via een link met state binnenkomen (bijv. vanaf Portal)
      if (location.state?.initialView) {
        setActiveDept(location.state.initialView);
      }
    } catch (err) {
      console.error("Fout bij initialiseren planning view:", err);
      setHasError(true);
    }
  }, [location]);

  const DEPARTMENTS = [
    {
      id: "FITTINGS",
      title: "Fitting Productions",
      icon: <Layers size={32} />,
      description: "Hulpstukken & Voorbewerking",
      color: "bg-emerald-600",
    },
    {
      id: "PIPES",
      title: "Pipe Productions",
      icon: <Database size={32} />,
      description: "Leidingwerk & Lamineren",
      color: "bg-orange-600",
    },
    {
      id: "SPOOLS",
      title: "Spools Productions",
      icon: <Activity size={32} />,
      description: "Assemblage & Prefab",
      color: "bg-purple-600",
    },
    {
      id: "PLANNER",
      title: "Central Planner",
      icon: <CalendarRange size={32} />,
      description: "Werkvoorbereiding & Planning",
      color: "bg-blue-600",
    },
  ];

  // Foutscherm als er iets kritiek misgaat
  if (hasError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 bg-slate-50">
        <AlertTriangle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-black uppercase">
          Systeemfout in Planning
        </h2>
        <p className="text-slate-500 text-sm mt-2">
          De module kon niet correct worden geladen.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs"
        >
          Herstellen
        </button>
      </div>
    );
  }

  // Toon de Planner Hub (Centrale Planning)
  if (activeDept === "PLANNER") {
    return (
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        }
      >
        <PlannerHub onBack={() => setActiveDept(null)} />
      </Suspense>
    );
  }

  // Toon de Workstation Hub (Afdelings-specifiek)
  if (activeDept) {
    return (
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        }
      >
        <WorkstationHub
          key={activeDept}
          department={activeDept}
          onBack={() => setActiveDept(null)}
        />
      </Suspense>
    );
  }

  // Toon het hoofdmenu (Productie Hub Keuze)
  return (
    <div className="h-full w-full bg-slate-50 flex flex-col p-6 animate-in fade-in overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center py-10">
        <div className="text-center mb-12 animate-in slide-in-from-top-4 duration-500">
          <div className="inline-flex p-3 bg-blue-600/10 rounded-2xl mb-4">
            <Activity className="text-blue-600" size={24} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter leading-none">
            Productie <span className="text-blue-600">Hub</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            Industrial Operations Center
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEPARTMENTS.map((dept, idx) => (
            <button
              key={dept.id}
              onClick={() => setActiveDept(dept.id)}
              className="group relative p-8 rounded-[40px] border-2 border-slate-100 bg-white hover:border-blue-500 hover:shadow-2xl hover:-translate-y-2 text-left transition-all duration-300 overflow-hidden animate-in zoom-in-95"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transition-transform group-hover:scale-110 duration-300 ${dept.color}`}
              >
                {dept.icon}
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 group-hover:text-blue-600 transition-colors italic">
                {dept.title}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-relaxed opacity-80">
                {dept.description}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-4">
          <button
            onClick={() => navigate("/portal")}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black uppercase text-[10px] tracking-[0.2em] transition-all bg-white px-6 py-3 rounded-xl border border-slate-100 shadow-sm"
          >
            <ArrowLeft size={14} /> Terug naar Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalPlanningHub;
