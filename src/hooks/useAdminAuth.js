import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { PATHS } from "../config/dbPaths";

/**
 * useAdminAuth V16.0 - Master Identity Guard
 * Bevat de hardcoded bypass voor Richard en uitgebreide console logging.
 */
export const useAdminAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  // JOUW UNIEKE UID VOOR GOD MODE
  const MASTER_ADMIN_UID = "pzxPfiwQhnQdEQJcXU77ZgT2Jo32";

  useEffect(() => {
    let isMounted = true;
    let unsubscribeRole = () => {};

    console.log("🔐 Auth Guard: Monitoring gestart...");

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        const currentUid = firebaseUser.uid.trim();
        console.log("🔑 Gebruiker ingelogd bij Firebase Auth:", currentUid);

        // 1. MASTER BYPASS (Richard)
        if (currentUid === MASTER_ADMIN_UID) {
          console.log("🛡️ GOD MODE GEACTIVEERD voor UID:", currentUid);
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

        // 2. DATABASE SYNC VOOR OVERIGE GEBRUIKERS
        try {
          const userRef = doc(db, ...PATHS.USERS, currentUid);
          console.log(
            "📂 Zoeken naar profiel op pad:",
            PATHS.USERS.join("/") + "/" + currentUid
          );

          unsubscribeRole = onSnapshot(
            userRef,
            (snap) => {
              if (!isMounted) return;

              if (snap.exists()) {
                const data = snap.data();
                console.log("✅ Database profiel gevonden:", data.role);
                setUser({
                  uid: currentUid,
                  email: firebaseUser.email,
                  ...data,
                });
                const userRole = (data.role || "user").toLowerCase();
                setRole(userRole);
                setIsAdmin(userRole === "admin");
              } else {
                console.warn(
                  "⚠️ Geen profiel gevonden in database, status: guest"
                );
                setUser({
                  uid: currentUid,
                  email: firebaseUser.email,
                  role: "guest",
                });
                setRole("guest");
                setIsAdmin(false);
              }
              setLoading(false);
            },
            (err) => {
              console.error("❌ Firestore Fout (Check je Rules!):", err.code);
              setRole("guest");
              setLoading(false);
            }
          );
        } catch (err) {
          console.error("❌ Fout bij ophalen profiel:", err);
          setLoading(false);
        }
      } else {
        console.log("👤 Geen actieve sessie gevonden.");
        setUser(null);
        setRole(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      unsubscribeRole();
    };
  }, []);

  return { user, role, isAdmin, loading, error };
};
