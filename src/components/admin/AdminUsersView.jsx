import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  AlertTriangle,
  Globe,
  ChevronRight,
  X,
  Trash2,
  Edit3,
  Save,
  UserCircle,
  DatabaseZap,
  ShieldAlert,
  Fingerprint,
  RefreshCw,
  Lock,
  SearchCode,
  Database,
  FileSearch,
  Map,
} from "lucide-react";
import { db, auth } from "../../config/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  collectionGroup,
} from "firebase/firestore";

/**
 * AdminUsersView V20 - Path Discovery Edition
 * Bevat tools om te achterhalen waar de data exact staat als het standaard pad leeg blijft.
 */
const AdminUsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Debug State
  const [debugInfo, setDebugInfo] = useState({
    lastRawCount: 0,
    authStatus: "checking",
    fullPath: "",
    errorCode: null,
    discoveryLog: [],
  });

  const appId = typeof __app_id !== "undefined" ? __app_id : "fittings-app-v1";
  const targetPath = `artifacts/${appId}/public/data/user_roles`;

  const addDiscoveryLog = (msg) => {
    setDebugInfo((prev) => ({
      ...prev,
      discoveryLog: [
        `[${new Date().toLocaleTimeString()}] ${msg}`,
        ...prev.discoveryLog,
      ].slice(0, 5),
    }));
  };

  // 1. STANDAARD DATA FETCH
  useEffect(() => {
    setLoading(true);
    setError(null);

    const currentUser = auth.currentUser;
    setDebugInfo((prev) => ({
      ...prev,
      authStatus: currentUser
        ? `Ingelogd (${currentUser.uid})`
        : "Niet ingelogd",
      fullPath: targetPath,
    }));

    const usersRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "user_roles"
    );
    const q = query(usersRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
        setDebugInfo((prev) => ({
          ...prev,
          lastRawCount: snapshot.size,
          errorCode: null,
        }));
        setLoading(false);
        if (snapshot.size > 0)
          addDiscoveryLog(`Succes! ${snapshot.size} users geladen.`);
      },
      (err) => {
        setError(`Database fout: ${err.code}. Check je Firestore Rules.`);
        setDebugInfo((prev) => ({ ...prev, errorCode: err.code }));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appId, targetPath]);

  // 2. DISCOVERY TOOL: Zoek waar de data wél staat
  const runPathDiscovery = async () => {
    addDiscoveryLog("Start pad-verkenning...");
    const variations = [
      {
        name: "Standaard",
        path: ["artifacts", appId, "public", "data", "user_roles"],
      },
      {
        name: "Zonder 'data'",
        path: ["artifacts", appId, "public", "user_roles"],
      },
      { name: "Direct onder AppID", path: ["artifacts", appId, "user_roles"] },
      { name: "Root level users", path: ["user_roles"] },
    ];

    for (const variant of variations) {
      try {
        addDiscoveryLog(`Checken: ${variant.name}...`);
        const ref = collection(db, ...variant.path);
        const snap = await getDocs(ref);
        if (snap.size > 0) {
          addDiscoveryLog(`🔥 GEVONDEN! ${snap.size} items in ${variant.name}`);
          const found = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setUsers(found);
          setDebugInfo((prev) => ({
            ...prev,
            lastRawCount: snap.size,
            fullPath: variant.path.join("/"),
          }));
          return;
        }
      } catch (e) {
        console.warn(`Pad ${variant.name} mislukt.`);
      }
    }
    addDiscoveryLog("Geen data gevonden in bekende variaties.");
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  if (loading)
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Verbinding maken met Firestore...
        </p>
      </div>
    );

  return (
    <div className="flex flex-col h-full animate-in fade-in text-left bg-slate-50 overflow-hidden relative">
      {/* TOOLBAR */}
      <div className="p-6 bg-white border-b border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none text-left">
            Systeem <span className="text-blue-600">Autorisatie</span>
          </h2>
          <div className="relative flex-1 sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
              size={16}
            />
            <input
              type="text"
              placeholder="Zoek op naam of mail..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 text-xs font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={runPathDiscovery}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
            title="Zoek data in andere mappen"
          >
            <FileSearch size={18} />
            <span className="text-[10px] font-black uppercase">
              Pad Verkenner
            </span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl border border-white/10 shadow-lg">
            <DatabaseZap
              size={14}
              className={
                users.length > 0 ? "text-emerald-400" : "text-amber-500"
              }
            />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {users.length} Database entries
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-4 text-red-600 animate-in shake">
          <AlertTriangle size={24} />
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-widest">
              Toegang Geweigerd
            </p>
            <p className="text-[10px] font-bold opacity-80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* CONTENT GRID */}
      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        {filteredUsers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
            <div className="p-10 bg-white rounded-[50px] border-2 border-dashed border-slate-200 text-center space-y-6">
              <Users size={64} className="mx-auto text-slate-200" />
              <div>
                <p className="text-sm font-black uppercase italic text-slate-800">
                  Geen data geladen
                </p>
                <p className="text-[10px] font-medium text-slate-400 mt-2 leading-relaxed">
                  De lijst is leeg. Klik op <b>'Pad Verkenner'</b> hierboven om
                  te scannen
                  <br />
                  of er data op een ander niveau in Firestore staat.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  setIsEditMode(true);
                }}
                className="bg-white p-6 rounded-[35px] border-2 border-slate-100 transition-all cursor-pointer hover:border-blue-400 hover:shadow-2xl group text-left"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-slate-900 text-white rounded-2xl group-hover:scale-110 transition-transform">
                    <UserCircle size={24} />
                  </div>
                  <div className="overflow-hidden text-left">
                    <h3 className="font-black text-slate-900 truncate text-sm uppercase italic leading-none">
                      {user.name || "Onbekend"}
                    </h3>
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">
                      {user.role || "Geen rol"}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 opacity-60 text-left">
                  <p className="text-[10px] font-bold text-slate-500 truncate">
                    {user.email}
                  </p>
                  <p className="text-[8px] font-mono text-slate-400 truncate uppercase">
                    UID: {user.id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- FLOATING DEBUG PANEL --- */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] w-full max-w-4xl px-4">
        <div className="bg-slate-900 text-white rounded-[32px] border border-white/10 shadow-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Identity & Path Explorer v20
              </span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    debugInfo.errorCode ? "bg-red-500" : "bg-emerald-500"
                  }`}
                ></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  Firestore
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Fingerprint size={10} className="text-slate-500" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  {debugInfo.authStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-3">
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Map size={10} /> Actief Target Pad:
                </p>
                <code className="text-[10px] font-mono text-blue-300 break-all bg-black/40 p-2 rounded-lg block border border-white/5">
                  {debugInfo.fullPath}
                </code>
              </div>
              <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-slate-500 uppercase">
                  Gevonden Documenten:
                </span>
                <span className="text-xs font-black text-emerald-400">
                  {debugInfo.lastRawCount}
                </span>
              </div>
            </div>

            <div className="md:border-l md:border-white/5 md:pl-6">
              <p className="text-[8px] font-black text-slate-500 uppercase mb-2 flex items-center gap-1">
                <SearchCode size={10} /> Discovery Log:
              </p>
              <div className="bg-black/40 rounded-xl p-3 h-24 overflow-y-auto custom-scrollbar space-y-1">
                {debugInfo.discoveryLog.length === 0 && (
                  <p className="text-[9px] text-slate-600 italic">
                    Geen logs...
                  </p>
                )}
                {debugInfo.discoveryLog.map((log, i) => (
                  <p
                    key={i}
                    className="text-[9px] font-mono text-blue-200/70 border-b border-white/5 pb-1 last:border-0"
                  >
                    {log}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersView;
