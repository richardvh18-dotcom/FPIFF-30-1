import React, { useState, useEffect } from "react";
import {
  Inbox,
  Send,
  Trash2,
  UserPlus,
  AlertTriangle,
  Info,
  ArrowRight,
  Loader2,
  MailOpen,
  ShieldCheck,
  Clock,
} from "lucide-react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { PATHS } from "../../config/dbPaths";
import ComposeModal from "../messaging/ComposeModal";

/**
 * AdminMessagesView V5.0 - Root Path Sync
 * Beheert de centrale inbox in /future-factory/production/messages/
 */
const AdminMessagesView = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // 1. Live Sync met de Root Messages collectie
  useEffect(() => {
    const messagesRef = collection(db, ...PATHS.MESSAGES);
    const q = query(messagesRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        console.error("Fout bij laden berichten uit root:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const unreadCount = messages.filter((m) => !m.read).length;

  // 2. Markeren als gelezen op het nieuwe pad
  const handleMarkAsRead = async (id) => {
    try {
      const docRef = doc(db, ...PATHS.MESSAGES, id);
      await updateDoc(docRef, {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Kon status niet updaten:", err);
    }
  };

  // 3. Verwijderen uit de root
  const handleDelete = async (id) => {
    if (!window.confirm("Dit bericht definitief verwijderen uit de database?"))
      return;
    try {
      const docRef = doc(db, ...PATHS.MESSAGES, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Kon bericht niet verwijderen:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Berichten synchroniseren...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 text-left animate-in fade-in duration-500 overflow-hidden">
      {/* Header Unit */}
      <div className="bg-white border-b border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center shrink-0 shadow-sm gap-6">
        <div className="flex items-center gap-6 text-left">
          <div className="p-4 bg-slate-900 text-white rounded-[20px] shadow-lg">
            <Inbox size={28} />
          </div>
          <div className="text-left">
            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Messages <span className="text-blue-600">Hub</span>
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100 italic uppercase">
                {unreadCount} Ongelezen
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" /> Root: /
                {PATHS.MESSAGES.join("/")}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsComposeOpen(true)}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center gap-3"
        >
          <Send size={18} /> Nieuw Bericht
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
        <div className="max-w-5xl mx-auto space-y-4 pb-20">
          {messages.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[50px] border-2 border-dashed border-slate-200 opacity-40">
              <MailOpen size={64} className="mx-auto mb-4 text-slate-300" />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 italic">
                De inbox is momenteel leeg
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => !msg.read && handleMarkAsRead(msg.id)}
                className={`bg-white p-6 rounded-[35px] border-2 transition-all cursor-pointer group relative overflow-hidden ${
                  msg.read
                    ? "border-slate-100 opacity-70 grayscale-[0.5]"
                    : "border-blue-200 shadow-xl shadow-blue-900/5 ring-1 ring-blue-50"
                }`}
              >
                {!msg.read && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                )}

                <div className="flex items-start gap-6">
                  {/* Priority/Type Icon */}
                  <div
                    className={`p-4 rounded-2xl shrink-0 shadow-sm ${
                      msg.priority === "urgent"
                        ? "bg-rose-50 text-rose-600"
                        : msg.type === "system_alert"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    {msg.priority === "urgent" ? (
                      <AlertTriangle size={24} />
                    ) : msg.type === "access_request" ? (
                      <UserPlus size={24} />
                    ) : (
                      <Info size={24} />
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-left">
                        <h4
                          className={`text-lg italic tracking-tight uppercase ${
                            msg.read
                              ? "font-bold text-slate-600"
                              : "font-black text-slate-900"
                          }`}
                        >
                          {msg.subject || "Geen onderwerp"}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          <span className="text-blue-500">
                            Van: {msg.senderName || "Systeem"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {msg.timestamp?.toDate
                              ? msg.timestamp.toDate().toLocaleString("nl-NL")
                              : "Zojuist"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!msg.read && (
                          <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">
                            Nieuw
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(msg.id);
                          }}
                          className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    <p
                      className={`text-sm leading-relaxed mt-4 ${
                        msg.read
                          ? "text-slate-500"
                          : "text-slate-700 font-medium"
                      }`}
                    >
                      {msg.content}
                    </p>

                    {msg.actionLink && (
                      <div className="mt-6 pt-4 border-t border-slate-50">
                        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-lg">
                          Actie Uitvoeren <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compose Modal Integration */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        user={user}
      />
    </div>
  );
};

export default AdminMessagesView;
