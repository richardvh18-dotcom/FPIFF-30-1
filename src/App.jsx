import React, { useState, Suspense, lazy, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./config/firebase";

// Basis Componenten
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LoginView from "./components/LoginView";
import PortalView from "./components/PortalView";
import ProfileView from "./components/ProfileView";
import ProductSearchView from "./components/products/ProductSearchView";

// Hooks
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useProductsData } from "./hooks/useProductsData";
import { useSettingsData } from "./hooks/useSettingsData";
import { useMessages } from "./hooks/useMessages";

// Lazy Loading Modules (Modules die crashes kunnen veroorzaken pakken we apart in)
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const DigitalPlanningHub = lazy(() =>
  import("./components/digitalplanning/DigitalPlanningHub")
);
const MobileScanner = lazy(() =>
  import("./components/digitalplanning/MobileScanner")
);
const CalculatorView = lazy(() => import("./components/CalculatorView"));
const AiAssistantView = lazy(() => import("./components/AiAssistantView"));

/**
 * App.jsx V14.0 - White Screen Recovery
 * Herstelt de basis-routing en zorgt dat de LoginView altijd laadt bij gebrek aan sessie.
 */
const App = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [loginError, setLoginError] = useState(null);

  // Data fetching via Hooks
  const { user, isAdmin, role, loading: authLoading } = useAdminAuth();
  const { products = [] } = useProductsData();
  const { generalConfig } = useSettingsData(user);
  const { messages = [] } = useMessages(user);

  const unreadCount = messages
    ? messages.filter((m) => !m.read && !m.archived).length
    : 0;

  const handleLogin = async (email, password) => {
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      console.error("Login Error:", err.code);
      setLoginError("E-mail of wachtwoord onjuist.");
    }
  };

  // 1. LAADSCHERM (Voorkomt wit scherm tijdens check)
  if (authLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-blue-400" size={48} />
        <p className="text-white font-black uppercase tracking-[0.3em] text-[10px] mt-4 italic">
          FPi Identity Guard...
        </p>
      </div>
    );
  }

  // 2. LOGIN SCHERM (Als er geen gebruiker is of als het een guest is)
  if (!user || role === "guest") {
    return <LoginView onLogin={handleLogin} error={loginError} />;
  }

  // 3. DE WERKELIJKE APP (Na succesvol inloggen)
  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden text-left relative">
      <Header
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        logoUrl={generalConfig?.logoUrl}
        appName={generalConfig?.appName}
        unreadCount={unreadCount}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          user={user}
          isAdmin={isAdmin}
          onLogout={() => {
            signOut(auth);
            navigate("/login");
          }}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-blue-500" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<PortalView />} />
              <Route path="/portal" element={<PortalView />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route
                path="/products"
                element={<ProductSearchView products={products} />}
              />
              <Route path="/planning/*" element={<DigitalPlanningHub />} />
              <Route path="/scanner" element={<MobileScanner />} />
              <Route path="/calculator" element={<CalculatorView />} />
              <Route path="/assistant" element={<AiAssistantView />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;
