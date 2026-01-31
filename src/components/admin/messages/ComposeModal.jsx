import React, { useState } from "react";
import { X, Send, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { PATHS } from "../../config/dbPaths";

/**
 * ComposeModal V3.0 - Root Sync Edition
 * Verstuurt berichten naar de centrale productie-omgeving: /future-factory/production/messages/
 */
const ComposeModal = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    to: "admin",
    subject: "",
    content: "",
    priority: "normal",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.content) {
      setError("Vul alle verplichte velden in.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Gebruik het nieuwe centrale pad uit dbPaths.js
      const messagesRef = collection(db, ...PATHS.MESSAGES);

      await addDoc(messagesRef, {
        ...formData,
        senderId: user?.uid || "unknown",
        senderName: user?.displayName || "Systeem Gebruiker",
        timestamp: serverTimestamp(),
        read: false,
        type: "user_message",
        status: "sent",
      });

      // Reset formulier
      setFormData({
        to: "admin",
        subject: "",
        content: "",
        priority: "normal",
      });

      onClose();
    } catch (err) {
      console.error("Fout bij versturen bericht naar root:", err);
      setError(
        "Toegang geweigerd of netwerkfout. Controleer de root-permissies."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/40 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Unit */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="text-left">
            <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-xl leading-none">
              Nieuw <span className="text-blue-600">Bericht</span>
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <ShieldCheck size={10} className="text-emerald-500" /> Beveiligde
              Root Sync
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm group border border-transparent hover:border-slate-100"
          >
            <X
              size={20}
              className="text-slate-400 group-hover:text-slate-900"
            />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-black uppercase flex items-center gap-3 border border-rose-100 animate-in shake">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Onderwerp
              </label>
              <input
                type="text"
                required
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                placeholder="Bijv: Machine-onderhoud nodig..."
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Afdeling
                </label>
                <select
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all text-xs"
                  value={formData.to}
                  onChange={(e) =>
                    setFormData({ ...formData, to: e.target.value })
                  }
                >
                  <option value="admin">Administrators</option>
                  <option value="maintenance">Technische Dienst</option>
                  <option value="logistics">Logistiek</option>
                  <option value="quality">Kwaliteit (QC)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Prioriteit
                </label>
                <select
                  className={`w-full p-4 border-2 rounded-2xl font-black outline-none transition-all text-xs ${
                    formData.priority === "urgent"
                      ? "bg-rose-50 border-rose-100 text-rose-600"
                      : "bg-slate-50 border-slate-100 text-slate-700"
                  }`}
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <option value="normal">Normaal</option>
                  <option value="high">Hoog</option>
                  <option value="urgent">Directe Actie (Spoed)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Berichtinhoud
              </label>
              <textarea
                required
                rows={5}
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[30px] text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all resize-none shadow-inner"
                placeholder="Typ hier de details..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest"
              >
                Sluiten
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center gap-3 active:scale-95"
              >
                {sending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                Versturen naar Hub
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
