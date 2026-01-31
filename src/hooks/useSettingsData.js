import { useState, useEffect } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { PATHS, isValidPath } from "../config/dbPaths";

/**
 * useSettingsData V6.0 - Build Stabilized
 * Gebruikt nu isValidPath (consistent met useProductsData) om crashes te voorkomen.
 */
export const useSettingsData = (user) => {
  const [settings, setSettings] = useState({
    productRange: {},
    generalConfig: {},
    boreDimensions: [],
    cbDimensions: [],
    tbDimensions: [],
    loading: true,
  });

  useEffect(() => {
    // Stop als er geen gebruiker is (voorkomt permission-denied in console)
    if (!user) {
      setSettings((s) => ({ ...s, loading: false }));
      return;
    }

    const listeners = [];

    const subscribeToDoc = (pathKey, stateKey) => {
      if (!isValidPath(pathKey)) return;

      const docRef = doc(db, ...PATHS[pathKey]);
      const unsub = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            setSettings((prev) => ({ ...prev, [stateKey]: snap.data() }));
          }
        },
        (err) => console.warn(`Doc Sync Error [${stateKey}]:`, err.code)
      );
      listeners.push(unsub);
    };

    const subscribeToCollection = (pathKey, stateKey) => {
      if (!isValidPath(pathKey)) return;

      const colRef = collection(db, ...PATHS[pathKey]);
      const unsub = onSnapshot(
        colRef,
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setSettings((prev) => ({ ...prev, [stateKey]: items }));
        },
        (err) => console.warn(`Coll Sync Error [${stateKey}]:`, err.code)
      );
      listeners.push(unsub);
    };

    try {
      subscribeToDoc("GENERAL_SETTINGS", "generalConfig");
      subscribeToDoc("MATRIX_CONFIG", "productRange");
      subscribeToCollection("BORE_DIMENSIONS", "boreDimensions");
      subscribeToCollection("CB_DIMENSIONS", "cbDimensions");
      subscribeToCollection("TB_DIMENSIONS", "tbDimensions");
    } catch (e) {
      console.error("Kritieke fout in settings subscriptions:", e);
    }

    // Zet loading op false na een korte buffer om UI-flikkering te voorkomen
    const timeout = setTimeout(() => {
      setSettings((prev) => ({ ...prev, loading: false }));
    }, 1500);

    return () => {
      listeners.forEach((u) => u());
      clearTimeout(timeout);
    };
  }, [user]);

  return settings;
};
