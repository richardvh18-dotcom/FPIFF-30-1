import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../config/firebase";
import { PATHS, isValidPath } from "../config/dbPaths";

/**
 * useProductsData V6.0 - Build Stabilized
 * Haalt de productcatalogus op uit /future-factory/production/products
 */
export const useProductsData = (user) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Veiligheidscheck: bestaat het pad en is de gebruiker bekend?
    if (!isValidPath("PRODUCTS")) {
      console.error(
        "❌ Kritieke fout: Pad 'PRODUCTS' niet gevonden in dbPaths.js"
      );
      setLoading(false);
      return;
    }

    // Alleen data ophalen als er een user-sessie is (voorkomt permission errors)
    if (!user) {
      setLoading(false);
      return;
    }

    const colRef = collection(db, ...PATHS.PRODUCTS);
    const q = query(colRef, orderBy("lastUpdated", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Zorg dat DN/PN altijd nummers zijn voor de filters
          dn: parseInt(doc.data().dn || doc.data().diameter) || 0,
          pn: parseFloat(doc.data().pn || doc.data().pressure) || 0,
        }));
        setProducts(data);
        setLoading(false);
      },
      (err) => {
        console.error("🔥 Firestore Error (Products):", err.code);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { products, loading, error };
};
