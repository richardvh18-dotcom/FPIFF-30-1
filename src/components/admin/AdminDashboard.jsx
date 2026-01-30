import React, { useState, Suspense } from "react";
import {
  Package,
  Database,
  Users,
  Settings,
  MessageSquare,
  Grid,
  Factory,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  Loader2,
  ArrowRightLeft,
  UserCheck,
  Layout,
  DatabaseZap,
} from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";

// --- LAZY LOAD IMPORTS (Alleen de actuele modules) ---
const AdminProductManager = React.lazy(() => import("./AdminProductManager"));
const FactoryStructureManager = React.lazy(() =>
  import("./FactoryStructureManager")
);
const ConversionManager = React.lazy(() => import("./ConversionManager"));
const PersonnelManager = React.lazy(() => import("./PersonnelManager"));
const AdminMatrixManager = React.lazy(() =>
  import("./matrixmanager/AdminMatrixManager")
);
const AdminUsersView = React.lazy(() => import("./AdminUsersView"));
const AdminMessagesView = React.lazy(() => import("./AdminMessagesView"));
const AdminDatabaseView = React.lazy(() => import("./AdminDatabaseView"));
const AdminLocationsView = React.lazy(() => import("./AdminLocationsView"));

/**
 * AdminDashboard V3.0 - Production Clean
 * - Verwijderd: AdminNewProductView, AdminRequestsView, AdminToleranceView (Overbodig).
 * - Gebruikt nu de nieuwe database paden via de onderliggende componenten.
 */
const AdminDashboard = () => {
  const { role } = useAdminAuth();
  const [activeScreen, setActiveScreen] = useState(null);

  const menuItems = [
    {
      id: "products",
      title: "Product Manager",
      desc: "Beheer de catalogus en mof-maten.",
      icon: <Package size={24} className="text-blue-600" />,
      color: "bg-blue-50 border-blue-100",
      roles: ["admin", "engineer"],
      component: AdminProductManager,
    },
    {
      id: "factory",
      title: "Fabrieksstructuur",
      desc: "Afdelingen, machines en ploegendiensten.",
      icon: <Layout size={24} className="text-emerald-600" />,
      color: "bg-emerald-50 border-emerald-100",
      roles: ["admin"],
      component: FactoryStructureManager,
    },
    {
      id: "personnel",
      title: "Personeel & Bezetting",
      desc: "Plan medewerkers op werkstations.",
      icon: <UserCheck size={24} className="text-indigo-600" />,
      color: "bg-indigo-50 border-indigo-100",
      roles: ["admin", "teamleader"],
      component: PersonnelManager,
    },
    {
      id: "conversions",
      title: "Conversie Matrix",
      desc: "Koppel ERP-codes aan tekeningen.",
      icon: <ArrowRightLeft size={24} className="text-teal-600" />,
      color: "bg-teal-50 border-teal-100",
      roles: ["admin", "engineer"],
      component: ConversionManager,
    },
    {
      id: "matrix",
      title: "Matrix Manager",
      desc: "Technische product-logica en ranges.",
      icon: <Grid size={24} className="text-purple-600" />,
      color: "bg-purple-50 border-purple-100",
      roles: ["admin", "engineer"],
      component: AdminMatrixManager,
    },
    {
      id: "users",
      title: "Gebruikers",
      desc: "Beheer accounts en systeemrollen.",
      icon: <Users size={24} className="text-slate-600" />,
      color: "bg-slate-50 border-slate-100",
      roles: ["admin"],
      component: AdminUsersView,
    },
    {
      id: "database",
      title: "Systeem Diagnostiek",
      desc: "Controleer database verbindingen.",
      icon: <DatabaseZap size={24} className="text-rose-600" />,
      color: "bg-rose-50 border-rose-100",
      roles: ["admin"],
      component: AdminDatabaseView,
    },
  ].filter((item) => item.roles.includes(role));

  if (activeScreen) {
    const activeItem = [...menuItems].find((i) => i.id === activeScreen);
    const ActiveComponent = activeItem?.component;

    return (
      <div className="flex flex-col h-full bg-slate-50 w-full animate-in fade-in text-left">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={() => setActiveScreen(null)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h2 className="text-xl font-black text-slate-800 uppercase italic flex items-center gap-3">
            {activeItem?.icon} {activeItem?.title}
          </h2>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" />
              </div>
            }
          >
            {ActiveComponent && <ActiveComponent />}
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 bg-slate-50 text-left">
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        <div className="text-left border-b border-slate-200 pb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
            Admin <span className="text-blue-600">Hub</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">
            Productie Configuratie & Beheer
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`group flex flex-col p-8 rounded-[40px] border-2 text-left transition-all duration-300 bg-white ${item.color} border-transparent shadow-sm hover:shadow-xl active:scale-95`}
            >
              <div className="p-4 bg-white rounded-2xl shadow-md mb-8 w-fit group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-3 leading-relaxed opacity-70">
                {item.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
