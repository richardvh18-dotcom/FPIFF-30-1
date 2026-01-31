import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Loader2,
  ShieldCheck,
  Trash2,
  Mail,
  Edit3,
  X,
  Save,
  UserCircle,
  ShieldAlert,
  ChevronRight,
  Database,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { db, auth } from "../../config/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { PATHS, isValidPath } from "../../config/dbPaths";

/**
 * AdminUsersView V5.0 - Identity Management Root Sync
 * Beheert alle toegangsrechten en profielen in de root-omgeving.
 * Pad: /future-factory/Users/Accounts/
 */
const AdminUsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const USER_ROLES = [
    { id: "admin", label: "Master Admin", color: "bg-blue-600" },
    { id: "engineer", label: "Process Engineer", color: "bg-purple-600" },
    { id: "teamleader", label: "Teamleider", color: "bg-emerald-600" },
    { id: "operator", label: "Machine Operator", color: "bg-orange-600" },
    { id: "guest", label: "Geen Toegang (Guest)", color: "bg-slate-400" },
  ];

  // 1. Live Sync met de Root Accounts collectie
  useEffect(() => {
    if (!isValidPath("USERS")) return;

    setLoading(true);
    const usersRef = collection(db, ...PATHS.USERS);
    const q = query(usersRef, orderBy("name", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Identity Error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Client-side Filtering
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // 3. Handlers
  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setIsEditing(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || saving) return;
    setSaving(true);
    try {
      const userRef = doc(db, ...PATHS.USERS, selectedUser.id);
      await updateDoc(userRef, {
        name: selectedUser.name,
        role: selectedUser.role,
        lastAdminUpdate: serverTimestamp(),
        updatedBy: auth.currentUser?.email || "Master Admin",
      });

      setStatus({ type: "success", msg: "Gebruikersprofiel bijgewerkt" });
      setTimeout(() => setStatus(null), 3000);
      setIsEditing(false);
    } catch (err) {
      alert("Update mislukt: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (
      !window.confirm(
        "Account permanent verwijderen uit de root? Dit blokkeert direct alle toegang."
      )
    )
      return;
    try {
      const userRef = doc(db, ...PATHS.USERS, userId);
      await deleteDoc(userRef);
      setStatus({ type: "success", msg: "Gebruiker verwijderd" });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading)
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Identiteiten synchroniseren...
        </p>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-slate-50 text-left animate-in fade-in overflow-hidden">
      {/* HEADER UNIT */}
      <div className="p-8 bg-white border-b border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-slate-900 text-white rounded-[20px] shadow-xl">
            <Users size={28} />
          </div>
          <div className="text-left">
            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Access <span className="text-blue-600">Controller</span>
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase italic">
                <ShieldCheck size={10} /> Root Protected
              </span>
              <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                Node: /{PATHS.USERS.join("/")}
              </p>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            placeholder="Zoek op naam, mail of rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
        <div className="max-w-7xl mx-auto space-y-6">
          {filteredUsers.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-[45px] border-2 border-dashed border-slate-200 opacity-50 flex flex-col items-center">
              <Users size={64} className="text-slate-200 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                Geen geautoriseerde accounts gevonden
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-white p-7 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all group flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 group-hover:opacity-10 transition-opacity">
                    <Database size={100} />
                  </div>

                  <div>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Fingerprint size={28} />
                      </div>
                      <div className="text-left overflow-hidden">
                        <h4 className="font-black text-slate-900 uppercase italic truncate text-lg leading-none mb-1.5">
                          {u.name || "Identiteit Onbekend"}
                        </h4>
                        <span
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${
                            USER_ROLES.find((r) => r.id === u.role)?.color ||
                            "bg-slate-400"
                          }`}
                        >
                          {USER_ROLES.find((r) => r.id === u.role)?.label ||
                            u.role}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-slate-50 pt-6">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <Mail size={14} className="text-blue-500" /> {u.email}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[8px] font-mono text-slate-300 uppercase bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          UID: {u.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleEdit(u)}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Bewerken"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="p-3 bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Account Verwijderen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL OVERLAY */}
      {isEditing && selectedUser && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[50px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl">
                  <ShieldAlert size={28} />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                    Rechten <span className="text-blue-600">Beheren</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 italic">
                    Identity Sync: {selectedUser.id.substring(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-3 hover:bg-slate-200 text-slate-300 rounded-2xl transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-10 space-y-8 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Volledige Naam
                </label>
                <div className="relative group">
                  <UserCircle
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500"
                    size={20}
                  />
                  <input
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[25px] font-black text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                    value={selectedUser.name || ""}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Systeem Rol & Toegang
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {USER_ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() =>
                        setSelectedUser({ ...selectedUser, role: role.id })
                      }
                      className={`p-5 rounded-[25px] border-2 transition-all flex items-center justify-between group ${
                        selectedUser.role === role.id
                          ? "bg-blue-50 border-blue-500 shadow-md ring-4 ring-blue-500/5"
                          : "bg-white border-slate-100 hover:border-blue-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-3 h-3 rounded-full ${role.color} ${
                            selectedUser.role === role.id
                              ? "animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                              : "opacity-40"
                          }`}
                        ></div>
                        <span
                          className={`font-black uppercase tracking-widest text-[11px] ${
                            selectedUser.role === role.id
                              ? "text-blue-700"
                              : "text-slate-400"
                          }`}
                        >
                          {role.label}
                        </span>
                      </div>
                      {selectedUser.role === role.id && (
                        <CheckCircle2 size={18} className="text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleUpdateUser}
                disabled={saving}
                className="w-full py-7 bg-slate-900 text-white rounded-[30px] font-black uppercase text-sm tracking-[0.3em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 mt-6"
              >
                {saving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save size={24} />
                )}
                Publiceren naar Root Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="p-4 bg-slate-950 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-10 shrink-0">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-emerald-500/50">
            <ShieldCheck size={14} /> Forensic Audit Active
          </span>
          <span className="flex items-center gap-2">
            <Database size={14} /> Central Identity Vault
          </span>
        </div>
        <span className="opacity-30 italic">User Management v6.11</span>
      </div>
    </div>
  );
};

export default AdminUsersView;
