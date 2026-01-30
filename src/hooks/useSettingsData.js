import { useState, useEffect } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { PATHS, getPath } from "../config/dbPaths";

/**
 * useSettingsData V4.0 - Crash Resistant
 * Oplossing voor 'pathArray is not iterable'.
 */
export const useSettingsData = (user) => {
  const [settings, setSettings] = useState({
    productRange: {},
    generalConfig: {},
    boreDimensions: [],
    cbDimensions: [],
    tbDimensions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const listeners = [];

    // Hulpfunctie met extra check op paden
    const subscribeToDoc = (pathKey, stateKey) => {
      const pathArray = PATHS[pathKey];
      if (!pathArray || !Array.isArray(pathArray)) {
        console.warn(
          `⚠️ Overslaan van Doc sync: ${pathKey} is geen geldig pad.`
        );
        return;
      }

      const docRef = doc(db, ...pathArray);
      const unsub = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            setSettings((prev) => ({ ...prev, [stateKey]: snap.data() }));
          }
        },
        (err) => console.error(`Fout bij laden ${stateKey}:`, err.code)
      );
      listeners.push(unsub);
    };

    const subscribeToCollection = (pathKey, stateKey) => {
      const pathArray = PATHS[pathKey];
      if (!pathArray || !Array.isArray(pathArray)) {
        console.warn(
          `⚠️ Overslaan van Collectie sync: ${pathKey} is geen geldig pad.`
        );
        return;
      }

      const colRef = collection(db, ...pathArray);
      const unsub = onSnapshot(
        colRef,
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setSettings((prev) => ({ ...prev, [stateKey]: items }));
        },
        (err) => console.error(`Fout bij laden ${stateKey}:`, err.code)
      );
      listeners.push(unsub);
    };

    // Voer de subscriptions uit via de veilige keys
    try {
      subscribeToDoc("GENERAL_SETTINGS", "generalConfig");
      subscribeToDoc("MATRIX_CONFIG", "productRange");
      subscribeToCollection("BORE_DIMENSIONS", "boreDimensions");
      subscribeToCollection("CB_DIMENSIONS", "cbDimensions");
      subscribeToCollection("TB_DIMENSIONS", "tbDimensions");
    } catch (e) {
      console.error("Kritieke fout in useSettingsData:", e);
    }

    const timeout = setTimeout(() => {
      setSettings((p) => ({ ...p, loading: false }));
    }, 2000);

    return () => {
      listeners.forEach((u) => u());
      clearTimeout(timeout);
    };
  }, [user]);

  return settings;
};
