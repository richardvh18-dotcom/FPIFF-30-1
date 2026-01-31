import React from "react";
import {
  Mail,
  MailOpen,
  Trash2,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Send,
  Inbox,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

/**
 * InboxView V4.0 - Future Factory Edition
 * Toont binnengekomen en verzonden berichten uit de root: /future-factory/production/messages/
 */
const InboxView = ({ messages = [], userEmail, onMarkRead, onDelete }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100 animate-in fade-in">
        <div className="p-6 bg-slate-50 rounded-full mb-6">
          <Inbox size={48} className="text-slate-200" />
        </div>
        <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest italic">
          Geen berichten gevonden
        </h3>
        <p className="text-xs text-slate-300 mt-2 font-bold uppercase tracking-tighter">
          Je inbox is momenteel helemaal bijgewerkt
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between px-4 mb-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 italic">
          <Clock size={14} className="text-blue-500" /> Recente Communicatie
        </h3>
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
          {messages.length} Berichten
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {messages.map((msg) => {
          // Bepaal status en rollen
          const isFromMe = msg.senderId === userEmail || msg.from === userEmail;
          const isRead = msg.read === true || isFromMe; // Eigen berichten tellen we als gelezen
          const isUrgent = msg.priority === "urgent";
          const isBroadcast = msg.to === "all" || msg.to === "admin";

          return (
            <div
              key={msg.id}
              onClick={() =>
                !isRead && onMarkRead ? onMarkRead(msg.id) : null
              }
              className={`
                group relative bg-white border-2 rounded-[30px] p-6 transition-all cursor-pointer shadow-sm
                hover:shadow-xl hover:-translate-y-0.5 hover:border-blue-200
                ${
                  !isRead
                    ? "border-blue-500 ring-4 ring-blue-500/5 bg-blue-50/20"
                    : "border-slate-50"
                }
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4 text-left">
                  {/* Icoon / Avatar Slot */}
                  <div
                    className={`p-3 rounded-2xl shadow-inner transition-colors ${
                      !isRead
                        ? "bg-blue-600 text-white shadow-blue-200"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isFromMe ? (
                      <Send size={20} />
                    ) : isRead ? (
                      <MailOpen size={20} />
                    ) : (
                      <Mail size={20} />
                    )}
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`text-base tracking-tighter uppercase italic leading-none ${
                          !isRead
                            ? "font-black text-slate-900"
                            : "font-bold text-slate-600"
                        }`}
                      >
                        {msg.subject || "Geen onderwerp"}
                      </h4>
                      {isUrgent && (
                        <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 border border-rose-200 animate-pulse">
                          <AlertCircle size={8} /> Spoed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <User size={12} className="text-blue-500" />
                        {isFromMe
                          ? `Aan: ${
                              isBroadcast ? "Afdeling " + msg.to : msg.to
                            }`
                          : `Van: ${
                              msg.senderName ||
                              msg.fromName ||
                              "Onbekende afzender"
                            }`}
                      </span>
                      <span className="opacity-30">•</span>
                      <span className="flex items-center gap-1.5 italic">
                        <Clock size={12} />
                        {msg.timestamp?.toDate
                          ? format(msg.timestamp.toDate(), "dd MMM HH:mm", {
                              locale: nl,
                            })
                          : "Zojuist"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actie Knoppen */}
                <div className="flex items-center gap-2">
                  {!isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"></div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Bericht permanent verwijderen?")) {
                        onDelete(msg.id);
                      }
                    }}
                    className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Verwijderen"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight
                    size={18}
                    className="text-slate-100 group-hover:text-blue-400 transition-colors"
                  />
                </div>
              </div>

              {/* Berichtinhoud */}
              <div className="pl-14 text-left">
                <p
                  className={`text-sm leading-relaxed line-clamp-3 italic ${
                    !isRead
                      ? "text-slate-700 font-bold"
                      : "text-slate-500 font-medium"
                  }`}
                >
                  "{msg.content || msg.body || "Leeg bericht..."}"
                </p>

                {/* Status Voetnoot */}
                {isFromMe && (
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                      <CheckCircle2 size={12} /> Verzonden naar Hub
                    </div>
                    <span className="text-[8px] font-mono text-slate-300 uppercase tracking-tighter">
                      ID: {msg.id.substring(0, 8)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Systeem Footer */}
      <div className="pt-10 flex items-center justify-center gap-6 opacity-20 grayscale select-none">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">
            End-to-End Encryption
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Database size={14} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">
            Root Sync Active
          </span>
        </div>
      </div>
    </div>
  );
};

export default InboxView;
