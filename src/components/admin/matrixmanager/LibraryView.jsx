import React, { useMemo } from "react";
import {
  Layers,
  Hash,
  Ruler,
  Type,
  Target,
  Zap,
  Database,
  Info,
  Settings2,
  Activity,
} from "lucide-react";
import LibrarySection from "./LibrarySection";

/**
 * LibraryView V4.0 - Root-Ready
 * Beheert de configuratie-arrays die worden opgeslagen in GENERAL_SETTINGS.
 * Deze component koppelt de UI (LibrarySection) aan de centrale state.
 */
const LibraryView = ({ libraryData, setLibraryData, setHasUnsavedChanges }) => {
  // Helper om een item toe te voegen aan een specifieke lijst in de state
  const addItem = (key, val) => {
    setLibraryData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      if (list.includes(val)) return prev; // Voorkom dubbele

      const updated = {
        ...prev,
        [key]: [...list, val].sort((a, b) => {
          // Slim sorteren: nummers numeriek, tekst alfabetisch
          if (!isNaN(a) && !isNaN(b)) return Number(a) - Number(b);
          return String(a).localeCompare(String(b));
        }),
      };
      return updated;
    });
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  // Helper om een item te verwijderen
  const removeItem = (key, val) => {
    setLibraryData((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((i) => i !== val),
    }));
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  // Configuraties voor de verschillende bibliotheek-secties
  const SECTIONS = [
    {
      id: "connections",
      title: "Mof Verbindingen",
      icon: <Layers size={18} />,
      placeholder: "Bijv. CB/CB...",
      key: "connections",
    },
    {
      id: "diameters",
      title: "Diameters (ID)",
      icon: <Hash size={18} />,
      placeholder: "Bijv. 350...",
      key: "diameters",
    },
    {
      id: "pns",
      title: "Drukklassen (PN)",
      icon: <Activity size={18} />,
      placeholder: "Bijv. 16...",
      key: "pns",
    },
    {
      id: "product_names",
      title: "Product Types",
      icon: <Type size={18} />,
      placeholder: "Bijv. Elbow...",
      key: "product_names",
    },
    {
      id: "borings",
      title: "Boring Types",
      icon: <Target size={18} />,
      placeholder: "Bijv. DIN 10...",
      key: "borings",
    },
    {
      id: "codes",
      title: "Extra Codes",
      icon: <Zap size={18} />,
      placeholder: "Bijv. A1S1...",
      key: "codes",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* Introductie Paneel */}
      <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl shadow-blue-200 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <Database size={150} />
        </div>
        <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 shrink-0">
          <Settings2 size={40} className="text-white" />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
            Master Bibliotheek
          </h2>
          <p className="text-sm font-bold text-blue-100/80 leading-relaxed max-w-2xl">
            Beheer hier de kern-parameters van de fabriek. Deze waarden vormen
            de basis voor de Matrix, de Product Configurator en de Werkstation
            Terminals.
          </p>
        </div>
      </div>

      {/* Grid van Secties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SECTIONS.map((sec) => (
          <LibrarySection
            key={sec.id}
            title={sec.title}
            icon={sec.icon}
            placeholder={sec.placeholder}
            items={libraryData[sec.key] || []}
            onAdd={(val) => addItem(sec.key, val)}
            onRemove={(val) => removeItem(sec.key, val)}
          />
        ))}
      </div>

      {/* Informatieve Footer */}
      <div className="p-8 bg-slate-900 rounded-[40px] border border-white/5 flex items-start gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Info size={80} />
        </div>
        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shrink-0">
          <Info size={20} />
        </div>
        <div className="text-left space-y-2 relative z-10">
          <h4 className="text-xs font-black uppercase text-blue-400 tracking-widest italic leading-none">
            Instructies
          </h4>
          <p className="text-[11px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider opacity-80">
            Wijzigingen in de bibliotheek zijn direct merkbaar in de filters van
            de andere tabs. Vergeet niet bovenaan op <strong>"Opslaan"</strong>{" "}
            te klikken om de wijzigingen definitief te maken in de root
            database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LibraryView;
