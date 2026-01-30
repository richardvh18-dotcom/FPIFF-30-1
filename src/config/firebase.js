import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

/**
 * Firebase Configuratie - Project: future-factory-377ef
 * Toegevoegd: logActivity export voor de Locations module.
 */
const firebaseConfig = {
  apiKey: "AIzaSyA0rOtnlrgPWwhPGj3GkoDqyG_S8n7re-s",
  authDomain: "future-factory-377ef.firebaseapp.com",
  projectId: "future-factory-377ef",
  storageBucket: "future-factory-377ef.firebasestorage.app",
  messagingSenderId: "180452063401",
  appId: "1:180452063401:web:66b4c30bf97080072cd1b8"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const appId = "future-factory-377ef";

/**
 * logActivity - Registreert wijzigingen in de database voor auditing.
 */
export const logActivity = async (userId, action, details) => {
  try {
    const logsRef = collection(db, "future-factory", "production", "activity_logs");
    await addDoc(logsRef, {
      userId,
      action,
      details,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error("Logging failed:", e);
  }
};

export default app;