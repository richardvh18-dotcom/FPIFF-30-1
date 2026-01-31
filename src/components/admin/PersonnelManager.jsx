import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Trash2,
  Search,
  Loader2,
  Monitor,
  Cpu,
  ShieldCheck,
  X,
  Plus,
  Layers,
  Clock,
  Settings,
  Edit3,
  ArrowRight,
  RotateCcw,
  UserCircle,
  ChevronUp,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
  Info,
  Globe,
  ChevronDown,
  Calculator,
  UserCheck,
  BarChart3,
  CalendarDays,
  TrendingUp,
  Database,
  Copy,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { db, auth } from "../../config/firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import {
  getISOWeek,
  format,
  parse,
  startOfISOWeek,
  endOfISOWeek,
  isWithinInterval,
  isToday,
  addDays,
  subDays,
} from "date-fns";
import { nl } from "date-fns/locale";
import { normalizeMachine } from "../../utils/hubHelpers";
import { PATHS, isValidPath } from "../../config/dbPaths";

/**
 * PersonnelManager V26.5 - Root Integrated Edition
 * Beheert de personeelsdatabase en de dagelijkse bezetting op de stations.
 * Locaties:
 * - /future-factory/Users/Personnel (Stamdata)
 * - /future-factory/production/machine_occupancy (Bezetting)
 */
const PersonnelManager = () => {
  const [personnel, setPersonnel] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [structure, setStructure] = useState({ departments: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assignment");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepts, setExpandedDepts] = useState({});
  const [viewDate, setViewDate] = useState(new Date());
  const [timeMode, setTimeMode] = useState("DAY");

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [status, setStatus] = useState(null);

  const currentWeek = getISOWeek(viewDate);
  const selectedDateStr = format(viewDate, "yyyy-MM-dd");

  const [personForm, setPersonForm] = useState({
    name: "",
    employeeNumber: "",
    departmentId: "",
    rotationType: "STATIC",
    shiftId: "DAG",
    isActive: true,
  });

  // 1. DATA SYNC MET DE ROOT
  useEffect(() => {
    if (!isValidPath("PERSONNEL") || !isValidPath("OCCUPANCY")) return;

    const unsubPersonnel = onSnapshot(
      query(collection(db, ...PATHS.PERSONNEL), orderBy("name")),
      (snap) =>
        setPersonnel(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    const unsubOccupancy = onSnapshot(
      collection(db, ...PATHS.OCCUPANCY),
      (snap) =>
        setOccupancy(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    const unsubStructure = onSnapshot(
      doc(db, ...PATHS.FACTORY_CONFIG),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStructure(data);
          // Automatisch afdelingen openklappen bij eerste load
          const initialExpanded = {};
          (data.departments || []).forEach((d) => {
            initialExpanded[d.id] = true;
          });
          setExpandedDepts(initialExpanded);
        }
        setLoading(false);
      }
    );

    return () => {
      unsubPersonnel();
      unsubOccupancy();
      unsubStructure();
    };
  }, []);

  // --- HELPERS ---
  const getShiftsForDept = (deptId) => {
    const dept = (structure.departments || []).find((d) => d.id === deptId);
    return dept && dept.shifts && dept.shifts.length > 0
      ? dept.shifts
      : [{ id: "DAG", label: "Dagdienst", start: "07:15", end: "16:00" }];
  };

  const getShiftHours = (person, deptId) => {
    const shifts = getShiftsForDept(deptId);
    const activeShift =
      shifts.find((s) => s.id === person.shiftId) || shifts[0];

    try {
      const start = parse(activeShift.start, "HH:mm", new Date());
      const end = parse(activeShift.end, "HH:mm", new Date());
      let diff = (end - start) / (1000 * 60 * 60);
      if (diff < 0) diff += 24;
      const deduction = 0.75; // Pauze correctie
      return {
        label: activeShift.label,
        total: Math.max(0, diff - deduction),
        times: `${activeShift.start}-${activeShift.end}`,
      };
    } catch (e) {
      return { label: "Dagdienst", total: 8.0, times: "07:15-16:00" };
    }
  };

  const kpiData = useMemo(() => {
    const startWeek = startOfISOWeek(viewDate);
    const endWeek = endOfISOWeek(viewDate);
    const stats = { global: { hours: 0, count: 0 }, byDept: {} };

    (structure.departments || []).forEach((d) => {
      stats.byDept[d.id] = {
        name: d.name,
        hours: 0,
        count: 0,
        operators: new Set(),
      };
    });

    const globalOperators = new Set();

    occupancy.forEach((occ) => {
      let match =
        timeMode === "DAY"
          ? occ.date === selectedDateStr
          : isWithinInterval(parse(occ.date, "yyyy-MM-dd", new Date()), {
              start: startWeek,
              end: endWeek,
            });
      if (match) {
        const netHours = parseFloat(occ.hoursWorked || 0);
        stats.global.hours += netHours;
        globalOperators.add(occ.operatorNumber);
        if (stats.byDept[occ.departmentId]) {
          stats.byDept[occ.departmentId].hours += netHours;
          stats.byDept[occ.departmentId].operators.add(occ.operatorNumber);
        }
      }
    });
    stats.global.count = globalOperators.size;
    Object.keys(stats.byDept).forEach((id) => {
      stats.byDept[id].count = stats.byDept[id].operators.size;
    });
    return stats;
  }, [occupancy, timeMode, selectedDateStr, viewDate, structure.departments]);

  const countriesData = useMemo(() => {
    const groups = {};
    (structure.departments || []).forEach((dept) => {
      const country = dept.country || "Nederland";
      if (!groups[country]) groups[country] = [];
      groups[country].push(dept);
    });
    return groups;
  }, [structure.departments]);

  // --- HANDLERS ---
  const handleAssign = async (machineId, operatorNumber, deptId) => {
    try {
      const colPath = PATHS.OCCUPANCY;
      if (!operatorNumber || operatorNumber === "") {
        const toDelete = occupancy.filter(
          (o) =>
            normalizeMachine(o.machineId) === normalizeMachine(machineId) &&
            o.date === selectedDateStr &&
            o.departmentId === deptId
        );
        for (const docToDel of toDelete)
          await deleteDoc(doc(db, ...colPath, docToDel.id));
        return;
      }
      const person = personnel.find((p) => p.employeeNumber === operatorNumber);
      if (!person) return;

      const assignmentId =
        `${selectedDateStr}_${deptId}_${machineId}_${person.employeeNumber}`.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        );
      const shiftInfo = getShiftHours(person, deptId);

      await setDoc(
        doc(db, ...colPath, assignmentId),
        {
          id: assignmentId,
          machineId,
          operatorNumber: person.employeeNumber,
          operatorName: person.name,
          departmentId: deptId,
          date: selectedDateStr,
          hoursWorked: shiftInfo.total,
          shift: shiftInfo.label,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyYesterday = async () => {
    const yesterdayStr = format(subDays(viewDate, 1), "yyyy-MM-dd");
    const yesterdayData = occupancy.filter(
      (o) => o.date === yesterdayStr && o.operatorNumber
    );
    if (yesterdayData.length === 0)
      return alert("Geen bezetting van gisteren gevonden.");

    setIsCopying(true);
    try {
      const batch = writeBatch(db);
      yesterdayData.forEach((old) => {
        const newId =
          `${selectedDateStr}_${old.departmentId}_${old.machineId}_${old.operatorNumber}`.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          );
        batch.set(
          doc(db, ...PATHS.OCCUPANCY, newId),
          {
            ...old,
            id: newId,
            date: selectedDateStr,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
      await batch.commit();
      setStatus({
        type: "success",
        msg: `${yesterdayData.length} lopers overgezet!`,
      });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCopying(false);
    }
  };

  const handleSavePerson = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docId = editingId || `P_${personForm.employeeNumber}`;
      await setDoc(
        doc(db, ...PATHS.PERSONNEL, docId),
        {
          ...personForm,
          lastUpdated: serverTimestamp(),
          updatedBy: auth.currentUser?.email || "Admin",
        },
        { merge: true }
      );

      setIsPersonModalOpen(false);
      setEditingId(null);
      setStatus({ type: "success", msg: "Medewerker opgeslagen" });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      alert("Fout: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditPerson = (person) => {
    setPersonForm(person);
    setEditingId(person.id);
    setIsPersonModalOpen(true);
  };

  if (loading)
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Identiteiten synchroniseren...
        </p>
      </div>
    );

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden text-left animate-in fade-in">
      {/* HEADER & NAV */}
      <div className="p-8 bg-white border-b border-slate-200 flex flex-col gap-8 shrink-0 z-20 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-slate-900 text-white rounded-[22px] shadow-xl">
              <Users size={28} />
            </div>
            <div className="text-left text-left">
              <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                Resource <span className="text-blue-600">Control</span>
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 uppercase italic">
                  <ShieldCheck size={10} /> Root Authorized
                </span>
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                  Node: /{PATHS.PERSONNEL.join("/")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setTimeMode("DAY")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeMode === "DAY"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                <CalendarDays size={14} /> Dag
              </button>
              <button
                onClick={() => setTimeMode("WEEK")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeMode === "WEEK"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                <TrendingUp size={14} /> Week
              </button>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setActiveTab("assignment")}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "assignment"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                Bezetting
              </button>
              <button
                onClick={() => setActiveTab("personnel")}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "personnel"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                Database
              </button>
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setPersonForm({
                  name: "",
                  employeeNumber: "",
                  departmentId: structure.departments[0]?.id || "",
                  rotationType: "STATIC",
                  shiftId: "DAG",
                  isActive: true,
                });
                setIsPersonModalOpen(true);
              }}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={18} /> Nieuw
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 border-t border-slate-50 pt-6">
          <div className="flex items-center gap-4 bg-slate-900 text-white p-2 rounded-[25px] shadow-2xl">
            <button
              onClick={() => setViewDate((prev) => subDays(prev, 1))}
              className="p-3 hover:bg-white/10 rounded-2xl transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center px-8 min-w-[220px]">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                {isToday(viewDate)
                  ? "Vandaag"
                  : format(viewDate, "eeee", { locale: nl })}
              </span>
              <span className="text-lg font-black uppercase italic tracking-tight">
                {format(viewDate, "dd MMMM yyyy", { locale: nl })}
              </span>
            </div>
            <button
              onClick={() => setViewDate((prev) => addDays(prev, 1))}
              className="p-3 hover:bg-white/10 rounded-2xl transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <button
            onClick={handleCopyYesterday}
            disabled={isCopying}
            className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {isCopying ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Copy size={18} />
            )}{" "}
            Herhaal Gisteren
          </button>

          {status && (
            <div className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100 text-[10px] font-black uppercase animate-in zoom-in">
              {status.msg}
            </div>
          )}

          {activeTab === "assignment" && (
            <div className="flex-1 flex items-center gap-4 overflow-x-auto no-scrollbar py-2 justify-end">
              <div className="bg-slate-900 px-6 py-4 rounded-3xl flex items-center gap-6 border border-white/5 shadow-xl shrink-0">
                <div className="text-left">
                  <span className="text-[9px] font-black text-blue-400 uppercase block mb-1">
                    Totaal Volume
                  </span>
                  <div className="flex items-baseline gap-1.5 text-white">
                    <span className="text-2xl font-black italic">
                      {kpiData.global.hours.toFixed(1)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">
                      u
                    </span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="flex items-center gap-3 text-emerald-400">
                  <UserCheck size={20} />
                  <span className="text-xl font-black italic">
                    {kpiData.global.count}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
        <div className="max-w-7xl mx-auto pb-40">
          {/* TAB 1: BEZETTING PER STATION */}
          {activeTab === "assignment" && (
            <div className="space-y-16">
              {Object.entries(countriesData)
                .sort()
                .map(([country, depts]) => (
                  <div key={country} className="space-y-8 animate-in fade-in">
                    <div className="flex items-center gap-4 border-b-2 border-slate-200 pb-4 ml-2">
                      <Globe size={24} className="text-slate-400" />
                      <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                        {country}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {depts.map((dept) => {
                        const isOpen = expandedDepts[dept.id] === true;
                        const sortedStations = [...(dept.stations || [])].sort(
                          (a, b) =>
                            (a.name || "").toLowerCase().includes("teamleader")
                              ? -1
                              : 1
                        );
                        return (
                          <div key={dept.id} className="space-y-4">
                            <button
                              onClick={() =>
                                setExpandedDepts((prev) => ({
                                  ...prev,
                                  [dept.id]: !prev[dept.id],
                                }))
                              }
                              className={`w-full flex items-center justify-between p-6 rounded-[35px] transition-all border-2 ${
                                isOpen
                                  ? "bg-white border-blue-500 shadow-xl"
                                  : "bg-white border-slate-100 hover:border-blue-200 shadow-sm"
                              }`}
                            >
                              <div className="flex items-center gap-6 flex-1 text-left">
                                <div
                                  className={`p-3 rounded-2xl transition-all ${
                                    isOpen
                                      ? "bg-blue-600 text-white scale-110"
                                      : "bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  <Layers size={24} />
                                </div>
                                <div className="text-left">
                                  <h4
                                    className={`text-lg font-black uppercase italic tracking-tighter ${
                                      isOpen
                                        ? "text-slate-900"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    {dept.name}
                                  </h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                                    {sortedStations.length} Actieve Stations
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-8 mr-10 hidden lg:flex">
                                <div className="text-right px-6 border-r border-slate-100">
                                  <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">
                                    Capaciteit
                                  </span>
                                  <span
                                    className={`text-xl font-black italic ${
                                      kpiData.byDept[dept.id]?.hours > 0
                                        ? "text-blue-600"
                                        : "text-slate-200"
                                    }`}
                                  >
                                    {kpiData.byDept[dept.id]?.hours.toFixed(1)}u
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">
                                    Inzet
                                  </span>
                                  <span
                                    className={`text-xl font-black italic ${
                                      kpiData.byDept[dept.id]?.count > 0
                                        ? "text-slate-800"
                                        : "text-slate-200"
                                    }`}
                                  >
                                    {kpiData.byDept[dept.id]?.count}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`p-2.5 rounded-xl transition-transform duration-500 ${
                                  isOpen
                                    ? "rotate-0 bg-blue-100 text-blue-600"
                                    : "rotate-180 bg-slate-50 text-slate-300"
                                }`}
                              >
                                <ChevronUp size={24} />
                              </div>
                            </button>

                            {isOpen && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in zoom-in-95 p-2">
                                {sortedStations.map((station) => {
                                  const mId = station.name;
                                  const isTL = mId
                                    .toLowerCase()
                                    .includes("teamleader");
                                  const occList = occupancy.filter(
                                    (o) =>
                                      normalizeMachine(o.machineId) ===
                                        normalizeMachine(mId) &&
                                      o.date === selectedDateStr &&
                                      o.departmentId === dept.id
                                  );
                                  const isBusy = occList.some(
                                    (o) => o.operatorNumber
                                  );

                                  return (
                                    <div
                                      key={station.id}
                                      className={`p-6 rounded-[40px] border-2 transition-all relative flex flex-col shadow-sm text-left ${
                                        isTL
                                          ? isBusy
                                            ? "bg-slate-900 border-amber-400 ring-8 ring-amber-400/10"
                                            : "bg-slate-900 border-slate-800 opacity-60"
                                          : isBusy
                                          ? "bg-white border-blue-500 ring-8 ring-blue-50/50"
                                          : "bg-white border-slate-100 hover:border-blue-400"
                                      }`}
                                    >
                                      <div className="flex justify-between items-start mb-6">
                                        <div className="text-left">
                                          <span
                                            className={`text-[8px] font-black uppercase tracking-widest block mb-1.5 ${
                                              isTL
                                                ? "text-amber-500 italic"
                                                : "text-slate-400 opacity-60"
                                            }`}
                                          >
                                            {isTL
                                              ? "Operational Lead"
                                              : "Workstation"}
                                          </span>
                                          <h4
                                            className={`text-xl font-black italic tracking-tighter uppercase truncate leading-none ${
                                              isTL
                                                ? "text-white"
                                                : "text-slate-900"
                                            }`}
                                          >
                                            {mId}
                                          </h4>
                                        </div>
                                        {isTL ? (
                                          <ShieldCheck
                                            size={24}
                                            className={
                                              isBusy
                                                ? "text-amber-400"
                                                : "text-slate-700"
                                            }
                                          />
                                        ) : (
                                          <Cpu
                                            size={24}
                                            className={
                                              isBusy
                                                ? "text-blue-600"
                                                : "text-slate-200"
                                            }
                                          />
                                        )}
                                      </div>

                                      <div className="space-y-3 mb-6 flex-1 text-left">
                                        {occList
                                          .filter((o) => o.operatorNumber)
                                          .map((occ) => (
                                            <div
                                              key={occ.id}
                                              className={`p-4 rounded-[22px] border transition-all flex items-center justify-between ${
                                                isTL
                                                  ? "bg-white/5 border-white/10 text-white"
                                                  : "bg-slate-50 border-slate-100"
                                              }`}
                                            >
                                              <div className="text-left overflow-hidden">
                                                <h5
                                                  className={`text-base font-black uppercase italic truncate mb-1 ${
                                                    isTL
                                                      ? "text-amber-400"
                                                      : "text-slate-950"
                                                  }`}
                                                >
                                                  {occ.operatorName}
                                                </h5>
                                                <div className="flex items-center gap-2 opacity-70">
                                                  <Clock
                                                    size={12}
                                                    className="text-blue-500"
                                                  />
                                                  <span className="text-[10px] font-black">
                                                    {occ.hoursWorked?.toFixed(
                                                      1
                                                    ) || 0}
                                                    u
                                                  </span>
                                                </div>
                                              </div>
                                              <button
                                                onClick={() =>
                                                  deleteDoc(
                                                    doc(
                                                      db,
                                                      ...PATHS.OCCUPANCY,
                                                      occ.id
                                                    )
                                                  )
                                                }
                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                              >
                                                <X size={18} />
                                              </button>
                                            </div>
                                          ))}
                                        {!isBusy && (
                                          <div
                                            className={`py-6 border-2 border-dashed rounded-[25px] flex flex-col items-center justify-center opacity-30 ${
                                              isTL
                                                ? "border-white/10"
                                                : "border-slate-200"
                                            }`}
                                          >
                                            <span
                                              className={`text-[8px] font-black uppercase tracking-widest ${
                                                isTL
                                                  ? "text-slate-600"
                                                  : "text-slate-400"
                                              }`}
                                            >
                                              Onbemand
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      <select
                                        className={`w-full p-3 rounded-2xl font-black text-[10px] uppercase outline-none transition-all appearance-none cursor-pointer border-2 ${
                                          isTL
                                            ? "bg-white/5 border-white/10 text-slate-400 hover:border-amber-400 focus:border-amber-400 shadow-inner"
                                            : "bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-400 focus:border-blue-500"
                                        }`}
                                        value=""
                                        onChange={(e) =>
                                          handleAssign(
                                            mId,
                                            e.target.value,
                                            dept.id
                                          )
                                        }
                                      >
                                        <option value="">
                                          + Operator Toevoegen
                                        </option>
                                        {personnel
                                          .filter(
                                            (p) =>
                                              p.departmentId === dept.id &&
                                              p.isActive !== false &&
                                              !occList.some(
                                                (o) =>
                                                  o.operatorNumber ===
                                                  p.employeeNumber
                                              )
                                          )
                                          .map((p) => (
                                            <option
                                              key={p.id}
                                              value={p.employeeNumber}
                                            >
                                              {p.name}
                                            </option>
                                          ))}
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 2: PERSONEELSLIJST (DATABASE) */}
          {activeTab === "personnel" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-[35px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="relative flex-1 w-full group">
                  <Search
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Zoek op naam of personeelsnummer..."
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {personnel
                  .filter(
                    (p) =>
                      !searchTerm ||
                      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.employeeNumber.includes(searchTerm)
                  )
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-6 rounded-[40px] border-2 border-slate-100 hover:border-blue-400 transition-all group shadow-sm flex flex-col relative overflow-hidden text-left"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                        <UserCircle size={100} />
                      </div>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
                          <UserCircle size={24} />
                        </div>
                        <div className="text-left overflow-hidden">
                          <h4 className="font-black text-slate-950 text-base uppercase italic truncate leading-none mb-1.5">
                            {p.name}
                          </h4>
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest italic">
                            {p.employeeNumber}
                          </span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => openEditPerson(p)}
                          className="p-3 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={async () =>
                            window.confirm("Verwijderen?") &&
                            (await deleteDoc(doc(db, ...PATHS.PERSONNEL, p.id)))
                          }
                          className="p-3 text-slate-300 hover:text-rose-500 bg-slate-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: PERSOON TOEVOEGEN/BEWERKEN */}
      {isPersonModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[45px] shadow-2xl overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                  <UserPlus size={24} />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                    {editingId ? "Edit" : "New"}{" "}
                    <span className="text-blue-600">Resource</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                    Master Personnel Database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPersonModalOpen(false)}
                className="p-3 hover:bg-slate-200 text-slate-300 rounded-2xl transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <form
              onSubmit={handleSavePerson}
              className="p-10 space-y-8 text-left"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 block">
                    Naam Medewerker
                  </label>
                  <input
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:border-blue-500 transition-all text-sm"
                    value={personForm.name}
                    onChange={(e) =>
                      setPersonForm({
                        ...personForm,
                        name: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 block">
                    Personeelsnummer
                  </label>
                  <input
                    required
                    disabled={!!editingId}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:border-blue-500 transition-all text-sm disabled:opacity-50"
                    value={personForm.employeeNumber}
                    onChange={(e) =>
                      setPersonForm({
                        ...personForm,
                        employeeNumber: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 block">
                  Standaard Afdeling
                </label>
                <select
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 text-sm cursor-pointer"
                  value={personForm.departmentId}
                  onChange={(e) =>
                    setPersonForm({
                      ...personForm,
                      departmentId: e.target.value,
                    })
                  }
                >
                  <option value="">Kies afdeling...</option>
                  {structure.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 block italic">
                    Vaste Ploeg
                  </label>
                  <select
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 text-sm cursor-pointer"
                    value={personForm.shiftId}
                    onChange={(e) =>
                      setPersonForm({ ...personForm, shiftId: e.target.value })
                    }
                  >
                    <option value="DAG">Dagdienst</option>
                    {personForm.departmentId &&
                      getShiftsForDept(personForm.departmentId).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={personForm.isActive}
                      onChange={(e) =>
                        setPersonForm({
                          ...personForm,
                          isActive: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-black uppercase text-slate-700">
                      Account Actief
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-6 bg-slate-900 text-white rounded-[30px] font-black uppercase text-sm tracking-[0.3em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save size={24} />
                )}{" "}
                Gegevens Vastleggen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="p-4 bg-slate-950 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-10 shrink-0">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-emerald-500/50">
            <ShieldCheck size={14} /> Forensic Audit Node
          </span>
          <span className="flex items-center gap-2">
            <Database size={14} /> Central Resource Vault
          </span>
        </div>
        <span className="opacity-30 italic">Future Factory MES v6.11</span>
      </div>
    </div>
  );
};

export default PersonnelManager;
