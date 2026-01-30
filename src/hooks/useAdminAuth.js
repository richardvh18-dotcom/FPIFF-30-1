import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { PATHS } from "../config/dbPaths";

/**
 * useAdminAuth V14.0 - Unified Identity Guard
 * Beheert de authenticatie en haalt de gebruikersrol op uit de nieuwe
 * /future-factory/Users/Accounts structuur.
 */
export const useAdminAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  // Jouw unieke Master UID voor directe God Mode toegang
  const MASTER_ADMIN_UID = "pFlmcq8IgRNOBxwwV8tS5f8P5BI2";

  useEffect(() => {
    let isMounted = true;
    let unsubscribeRole = () => {};

    // Monitor de Firebase Auth status
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        const currentUid = firebaseUser.uid.trim();

        // 1. MASTER BYPASS (Altijd volledige rechten voor Richard)
        if (currentUid === MASTER_ADMIN_UID) {
          const adminProfile = {
            uid: currentUid,
            email: firebaseUser.email,
            name: "Richard (Master Admin)",
            role: "admin",
            isGodMode: true,
          };
          setUser(adminProfile);
          setRole("admin");
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // 2. DATABASE SYNC VOOR ANDERE GEBRUIKERS
        try {
          // Gebruik het pad uit dbPaths.js: future-factory/Users/Accounts/[UID]
          const userRef = doc(db, ...PATHS.USERS, currentUid);

          unsubscribeRole = onSnapshot(
            userRef,
            (snap) => {
              if (!isMounted) return;

              if (snap.exists()) {
                const data = snap.data();
                setUser({
                  uid: currentUid,
                  email: firebaseUser.email,
                  ...data,
                });
                const userRole = (data.role || "user").toLowerCase();
                setRole(userRole);
                setIsAdmin(userRole === "admin");
              } else {
                // Geen record gevonden: gebruiker is een gast met beperkte rechten
                setUser({
                  uid: currentUid,
                  email: firebaseUser.email,
                  role: "guest",
                  name:
                    firebaseUser.displayName ||
                    firebaseUser.email.split("@")[0],
                });
                setRole("guest");
                setIsAdmin(false);
              }
              setLoading(false);
            },
            (err) => {
              console.error("🔐 Auth Guard Firestore Error:", err.code);
              // Bij een permissie-fout (Rules) vallen we terug op guest status
              setRole("guest");
              setLoading(false);
            }
          );
        } catch (err) {
          console.error("🔐 Auth Guard Process Error:", err);
          setLoading(false);
        }
      } else {
        // Geen actieve sessie
        setUser(null);
        setRole(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // Cleanup functie bij het unmounten van de component
    return () => {
      isMounted = false;
      unsubscribeAuth();
      unsubscribeRole();
    };
  }, []);

  return { user, role, isAdmin, loading, error };
};
