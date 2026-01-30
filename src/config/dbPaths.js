/**
 * dbPaths.js - V19.0 (Ultra Stable Edition)
 * Bevat extra checks om te voorkomen dat 'pathArray is not iterable' fouten ontstaan.
 */

// Haal appId op uit de omgeving of gebruik de nieuwe productie-root
export const appId =
  typeof __app_id !== "undefined" ? __app_id : "future-factory-377ef";

const OPS_BASE = ["future-factory", "production"];
const ADMIN_BASE = ["future-factory", "settings"];
const USERS_ROOT = ["future-factory", "Users"];

export const PATHS = {
  // --- PRODUCTION ---
  PRODUCTS: [...OPS_BASE, "products"],
  PLANNING: [...OPS_BASE, "digital_planning"],
  TRACKING: [...OPS_BASE, "tracked_products"],
  MESSAGES: [...OPS_BASE, "messages"],
  OCCUPANCY: [...OPS_BASE, "machine_occupancy"],

  // --- DIMENSIONS (6-staps) ---
  BORE_DIMENSIONS: [...OPS_BASE, "dimensions", "bore", "records"],
  CB_DIMENSIONS: [...OPS_BASE, "dimensions", "cb", "records"],
  TB_DIMENSIONS: [...OPS_BASE, "dimensions", "tb", "records"],

  // --- USERS ---
  USERS: [...USERS_ROOT, "Accounts"],
  PERSONNEL: [...USERS_ROOT, "Personnel"],

  // --- SETTINGS ---
  FACTORY_CONFIG: [...ADMIN_BASE, "factory", "config"],
  GENERAL_SETTINGS: [...ADMIN_BASE, "general", "app_config"],
  MATRIX_CONFIG: [...ADMIN_BASE, "matrix", "product_logic"],
  CONVERSION_MATRIX: [...ADMIN_BASE, "conversions", "mapping", "records"],
};

/**
 * getPath - Veilige helper om een pad op te vragen met foutcontrole.
 */
export const getPath = (key) => {
  if (!PATHS[key]) {
    console.error(
      `❌ DATABASE PAD FOUT: Sleutel '${key}' niet gevonden in dbPaths.js`
    );
    return ["future-factory", "production", "error_fallback"];
  }
  return PATHS[key];
};

export const getPathString = (pathArray) =>
  Array.isArray(pathArray) ? pathArray.join("/") : "";
