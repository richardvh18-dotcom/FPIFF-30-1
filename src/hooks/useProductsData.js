import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../config/firebase";
import { PATHS, isValidPath } from "../config/dbPaths";

/**
 * useProductsData V5.0 - Permission Guarded
 */
export const useProductsData = (user) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stop als er geen gebruiker is (voorkomt permission-denied in console)
    if (!user || !isValidPath("PRODUCTS")) {
      setLoading(false);
      return;
    }

    const colRef = collection(db, ...PATHS.PRODUCTS);
    const q = query(colRef, orderBy("lastUpdated", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(data);
        setLoading(false);
      },
      (err) => {
        console.error("Fout bij ophalen producten:", err.code);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { products, loading };
};
