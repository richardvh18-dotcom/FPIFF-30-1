import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  Loader2,
  Settings,
  Database,
  ArrowLeft,
  Paperclip,
  CheckCircle2,
} from "lucide-react";
import { db } from "../../config/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { PATHS } from "../../config/dbPaths";
import { useSettingsData } from "../../hooks/useSettingsData";

/**
 * ProductForm V7.0 - New Path Edition
 * Gebruikt nu uitsluitend de PATHS configuratie.
 */
const ProductForm = ({ initialData, onSubmit, onCancel, user }) => {
  const { loading: settingsLoading, productRange } = useSettingsData(user);
  const [formData, setFormData] = useState({
    name: "",
    type: "-",
    diameter: "-",
    pressure: "-",
    specs: {},
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Bepaal ID (of gebruik bestaande)
      const productId =
        initialData?.id ||
        `${formData.type}_${formData.diameter}_${Date.now()}`.replace(
          /\s+/g,
          "_"
        );

      // Schrijf naar: /future-factory/production/products/[ID]
      const productRef = doc(db, ...PATHS.PRODUCTS, productId);

      await setDoc(
        productRef,
        {
          ...formData,
          lastUpdated: serverTimestamp(),
          lastModifiedBy: user?.uid || "system",
        },
        { merge: true }
      );

      onSubmit && onSubmit();
    } catch (err) {
      alert("Opslaan mislukt: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading)
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin inline mr-2" /> Laden...
      </div>
    );

  return (
    <div className="p-6 bg-white rounded-[35px] shadow-xl text-left animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">
          Product <span className="text-blue-600">Configurator</span>
        </h2>
        <button onClick={onCancel} className="p-2 bg-slate-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Formulier velden hier... (ingekort voor overzicht) */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">
            Database Doel
          </p>
          <code className="text-[10px] font-mono text-blue-600">
            /{PATHS.PRODUCTS.join("/")}
          </code>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Product Opslaan
        </button>
      </form>
    </div>
  );
};

export default ProductForm;
