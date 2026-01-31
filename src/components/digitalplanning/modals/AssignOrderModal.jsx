import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Link,
  Package,
  Database,
} from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { PATHS } from "../../../config/dbPaths";

/**
 * AssignOrderModal V6.0 - Forensic Assignment Tool
 * Koppel wees-producten (orphans) handmatig aan een ordernummer in de root.
 * Pad: /future-factory/production/tracked_products/
 */
const AssignOrderModal = ({ orphans = [], onClose }) => {
  const [targetOrderId, setTargetOrderId] = useState("");
  const [selectedOrphans, setSelectedOrphans] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const toggleSelect = (id) => {
    setSelectedOrphans((p) => ({ ...p, [id]: !p[id] }));
  };

  const handleAssign = async () => {
    if (!targetOrderId.trim()) return alert("Voer een geldig ordernummer in.");

    const idsToUpdate = Object.keys(selectedOrphans).filter(
      (id) => selectedOrphans[id]
    );

    if (idsToUpdate.length === 0)
      return alert("Selecteer minstens één product uit de lijst.");

    setIsSaving(true);
    try {
      const promises = idsToUpdate.map((id) => {
        // Gebruik het gevalideerde pad uit dbPaths.js
        const docRef = doc(db, ...PATHS.TRACKING, id);

        return updateDoc(docRef, {
          orderId: targetOrderId.trim().toUpperCase(),
          isOverproduction: false,
          status: "In Production", // Zet terug naar actieve status
          lastManualAssignment: serverTimestamp(),
          note: `Handmatig gekoppeld aan order ${targetOrderId} via Admin Hub`,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(promises);

      // Korte pauze voor UX
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (e) {
      console.error("Koppelen mislukt:", e);
      alert(
        "Fout bij schrijven naar de root database. Controleer uw permissies."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = Object.values(selectedOrphans).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-slate-950/40 z-[120] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[85vh] animate-in zoom-in-95 duration-300">
        {/* Header Section */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-rose-50/50">
          <div className="text-left">
            <h3 className="text-2xl font-black text-rose-600 uppercase italic tracking-tighter leading-none">
              Onbekende <span className="text-slate-900">Items</span>
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <Database size={10} className="text-rose-400" /> Root Recovery
              Module
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-rose-500 shadow-sm border border-transparent hover:border-rose-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Input area */}
        <div className="p-8 bg-slate-50/50 border-b border-slate-100 shrink-0">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Doel Ordernummer (Infor-LN)
            </label>
            <div className="relative group">
              <Link
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                autoFocus
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm uppercase placeholder:text-slate-300"
                placeholder="Bijv. 10023456..."
                value={targetOrderId}
                onChange={(e) => setTargetOrderId(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-3 bg-white">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Gedetecteerde Wees-producten ({orphans.length})
            </span>
            {selectedCount > 0 && (
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                {selectedCount} geselecteerd
              </span>
            )}
          </div>

          {orphans.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <Package size={48} className="mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-xs italic">
                Geen items zonder order gevonden
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {orphans.map((item) => {
                const isSel = selectedOrphans[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`
                        p-5 border-2 rounded-[25px] flex justify-between items-center cursor-pointer transition-all
                        ${
                          isSel
                            ? "bg-blue-50 border-blue-500 shadow-md ring-4 ring-blue-500/5 translate-x-1"
                            : "bg-white border-slate-100 hover:border-blue-200"
                        }
                    `}
                  >
                    <div className="text-left overflow-hidden">
                      <h4
                        className={`text-base font-black italic tracking-tight leading-none mb-1.5 ${
                          isSel ? "text-blue-700" : "text-slate-800"
                        }`}
                      >
                        {item.lotNumber}
                      </h4>
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[200px]">
                          {item.item || "Onbekend Model"}
                        </p>
                        {item.isOverproduction && (
                          <span className="text-[8px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-black uppercase border border-rose-200">
                            Extra
                          </span>
                        )}
                        <span className="text-[8px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase font-bold italic">
                          {item.originMachine || item.machine}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`
                        w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all
                        ${
                          isSel
                            ? "bg-blue-600 border-blue-600 shadow-lg text-white"
                            : "border-slate-100 text-transparent bg-slate-50"
                        }
                    `}
                    >
                      <CheckCircle2 size={24} strokeWidth={3} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 opacity-40">
            <AlertCircle size={14} className="text-slate-400" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
              Actie overschrijft bestaande metadata
            </span>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all text-[10px] uppercase tracking-widest"
            >
              Annuleren
            </button>
            <button
              onClick={handleAssign}
              disabled={isSaving || !targetOrderId || selectedCount === 0}
              className={`
                    px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all flex items-center gap-3 active:scale-95 disabled:opacity-30
                    ${
                      isSaving
                        ? "bg-slate-400"
                        : "bg-slate-900 text-white hover:bg-blue-600 shadow-blue-900/20"
                    }
                `}
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {isSaving ? "Koppelen..." : "Koppel Selectie"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignOrderModal;
