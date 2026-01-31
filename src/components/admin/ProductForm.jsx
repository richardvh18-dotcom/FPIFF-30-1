import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  Loader2,
  Settings,
  Database,
  ArrowLeft,
  Zap,
  Ruler,
  Layers,
  Image as ImageIcon,
  BookOpen,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Box,
} from "lucide-react";
import { db } from "../../config/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { PATHS } from "../../config/dbPaths";
import { useSettingsData } from "../../hooks/useSettingsData";
import {
  ALL_PRODUCT_TYPES,
  PRODUCT_LABELS,
  CONNECTION_TYPES,
  TYPES_WITH_SECOND_DIAMETER,
  BELL_KEYS,
  VERIFICATION_STATUS,
} from "../../data/constants";
import { getSpecKeysForType } from "../../utils/specLogic";

/**
 * ProductForm V8.0 - Master Configurator
 * Bevat de volledige technische logica voor FPi GRE producten.
 * Slaat op in: /future-factory/production/products/
 */
const ProductForm = ({ initialData, onSubmit, onCancel, user }) => {
  const {
    loading: settingsLoading,
    productRange,
    generalConfig,
  } = useSettingsData(user);
  const [saving, setSaving] = useState(false);

  // State voor het formulier
  const [formData, setFormData] = useState({
    name: "",
    displayId: "",
    type: "Elbow",
    label: "Wavistrong Standard",
    connection: "CB/CB",
    dn: "",
    dn2: "",
    pn: "",
    articleCode: "",
    extraCode: "",
    specs: {},
    bellSpecs: {},
    imageUrl: "",
    sourcePdfs: [],
    verificationStatus: VERIFICATION_STATUS.PENDING,
  });

  // 1. Initialisatie bij bewerken
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        specs: initialData.specs || {},
        bellSpecs: initialData.bellSpecs || {},
        sourcePdfs: initialData.sourcePdfs || [],
      });
    }
  }, [initialData]);

  // 2. Automatische Naamgeneratie (Technische Logica)
  useEffect(() => {
    const type = formData.type;
    const dn = formData.dn ? `DN${formData.dn}` : "";
    const dn2 = formData.dn2 ? `x${formData.dn2}` : "";
    const pn = formData.pn ? `PN${formData.pn}` : "";
    const angle = formData.specs?.alpha || formData.specs?.angle || "";
    const angleStr = angle ? `${angle}°` : "";

    const generatedName = `${type} ${angleStr} ${dn}${dn2} ${pn}`
      .replace(/\s+/g, " ")
      .trim();

    setFormData((prev) => ({
      ...prev,
      name: generatedName,
      displayId: prev.displayId || generatedName, // Alleen invullen als handmatige ID leeg is
    }));
  }, [formData.type, formData.dn, formData.dn2, formData.pn, formData.specs]);

  // 3. Matrix Validatie: Beschikbare PN's ophalen o.b.v. Verbinding
  const availablePNs = useMemo(() => {
    const connKey = formData.connection?.split("/")[0] || "CB";
    const matrix = productRange?.[connKey];
    if (!matrix) return [];
    return Object.keys(matrix)
      .map(Number)
      .sort((a, b) => a - b);
  }, [productRange, formData.connection]);

  // 4. Matrix Validatie: Beschikbare DN's ophalen o.b.v. Gekozen PN
  const availableDNs = useMemo(() => {
    const connKey = formData.connection?.split("/")[0] || "CB";
    const pnKey = String(formData.pn);
    const typeKey = formData.type;

    const matrix = productRange?.[connKey]?.[pnKey];
    if (!matrix) return [];

    // Check of er specifieke ID's zijn voor dit type, anders algemeen
    return (matrix[typeKey] || matrix["Algemeen"] || []).sort((a, b) => a - b);
  }, [productRange, formData.connection, formData.pn, formData.type]);

  // 5. Opslaan naar Root
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.dn || !formData.pn) {
      alert("Vul tenminste Naam, DN en PN in.");
      return;
    }

    setSaving(true);
    try {
      const productId =
        initialData?.id ||
        `${formData.type}_ID${formData.dn}_${Date.now()}`.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        );
      const productRef = doc(db, ...PATHS.PRODUCTS, productId);

      // Bepaal verificatie status (Admins kunnen direct valideren)
      const isSystemAdmin = user?.role === "admin";
      const finalStatus = isSystemAdmin
        ? VERIFICATION_STATUS.VERIFIED
        : VERIFICATION_STATUS.PENDING;

      await setDoc(
        productRef,
        {
          ...formData,
          id: productId,
          lastUpdated: serverTimestamp(),
          lastModifiedBy: user?.uid || "system",
          verificationStatus: initialData
            ? VERIFICATION_STATUS.PENDING
            : finalStatus,
          active: true,
        },
        { merge: true }
      );

      if (onSubmit) onSubmit();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Fout bij opslaan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading)
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Configurator initialiseren...
        </p>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-slate-50 text-left overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-8 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-100">
            <Settings size={28} />
          </div>
          <div className="text-left">
            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Product <span className="text-blue-600">Architect</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <Database size={12} className="text-emerald-500" /> Root Sync: /
              {PATHS.PRODUCTS.join("/")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-slate-400 hover:text-slate-600 font-black uppercase text-[10px] tracking-widest transition-all"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            Publiceren naar Hub
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 pb-32">
          {/* LINKER KOLOM: BASIS CONFIGURATIE */}
          <div className="lg:col-span-7 space-y-10">
            {/* Sectie: Identiteit */}
            <div className="bg-white p-10 rounded-[45px] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3 italic">
                <BookOpen size={16} className="text-blue-500" /> Basis
                Identificatie
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                    Gegenereerde Systeemnaam
                  </label>
                  <input
                    readOnly
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[22px] font-black text-xl text-slate-900 italic tracking-tighter shadow-inner"
                    value={formData.name}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                      Product Type
                    </label>
                    <select
                      className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                    >
                      {ALL_PRODUCT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                      Artikelgroep / Label
                    </label>
                    <select
                      className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                      value={formData.label}
                      onChange={(e) =>
                        setFormData({ ...formData, label: e.target.value })
                      }
                    >
                      {PRODUCT_LABELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Sectie: Matrix Validatie (DN/PN) */}
            <div className="bg-white p-10 rounded-[45px] border border-slate-200 shadow-sm space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
                <Zap size={120} />
              </div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3 italic relative z-10">
                <Ruler size={16} className="text-blue-500" /> Technische Matrix
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                      Drukklasse (PN)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {availablePNs.map((pn) => (
                        <button
                          key={pn}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, pn: pn, dn: "" })
                          }
                          className={`py-3 rounded-xl text-[10px] font-black border-2 transition-all ${
                            formData.pn === pn
                              ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-100"
                              : "bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-200"
                          }`}
                        >
                          PN{pn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                      Binnendiameter (ID)
                    </label>
                    <select
                      className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black italic outline-none focus:border-blue-500 transition-all text-blue-600"
                      value={formData.dn}
                      onChange={(e) =>
                        setFormData({ ...formData, dn: e.target.value })
                      }
                      disabled={!formData.pn}
                    >
                      <option value="">- Kies ID -</option>
                      {availableDNs.map((dn) => (
                        <option key={dn} value={dn}>
                          ID {dn} mm
                        </option>
                      ))}
                    </select>
                    {!formData.pn && (
                      <p className="text-[9px] text-amber-500 font-bold uppercase tracking-tighter mt-2 ml-1">
                        Selecteer eerst een PN klasse
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100 flex flex-col justify-center gap-4 shadow-inner">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      Matrix Validation Active
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                    De beschikbare diameters zijn beperkt tot de waarden die
                    zijn geactiveerd in de Master Matrix voor de gekozen
                    drukklasse.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RECHTER KOLOM: SPECIFICATIES & MEDIA */}
          <div className="lg:col-span-5 space-y-10">
            {/* Sectie: Artikelcodes */}
            <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white space-y-6">
              <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] flex items-center gap-3 italic">
                <Hash size={16} /> Systeem Koppeling
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-black text-slate-500 uppercase ml-2">
                    Infor-LN Artikelcode
                  </label>
                  <input
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-mono text-xs font-bold text-white focus:border-blue-500 outline-none transition-all"
                    value={formData.articleCode}
                    onChange={(e) =>
                      setFormData({ ...formData, articleCode: e.target.value })
                    }
                    placeholder="Bijv: 10023456"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-black text-slate-500 uppercase ml-2">
                    Productie Extra Code
                  </label>
                  <input
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-mono text-xs font-bold text-white focus:border-blue-500 outline-none transition-all"
                    value={formData.extraCode}
                    onChange={(e) =>
                      setFormData({ ...formData, extraCode: e.target.value })
                    }
                    placeholder="Bijv: A1S1"
                  />
                </div>
              </div>
            </div>

            {/* Sectie: Dynamic Technical Specs */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3 italic">
                <Layers size={16} className="text-blue-500" /> Afmetingen
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {getSpecKeysForType(formData.type).map((key) => (
                  <div key={key} className="space-y-1 text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                      {key}
                    </label>
                    <input
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm text-slate-800 focus:border-blue-500 outline-none transition-all text-center"
                      value={formData.specs?.[key] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specs: { ...formData.specs, [key]: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Informatieve Voetnoot */}
            <div className="p-8 bg-blue-50 rounded-[35px] border border-blue-100 flex items-start gap-4">
              <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-blue-700/70 leading-relaxed uppercase tracking-wider italic">
                Nieuwe of gewijzigde producten krijgen automatisch de status{" "}
                <span className="text-orange-600 font-black">'PENDING'</span>.
                Ze moeten door een tweede geautoriseerde gebruiker worden
                geverifieerd voordat ze definitief worden vrijgegeven voor
                productie.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
