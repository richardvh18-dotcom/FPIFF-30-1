/**
 * dbPaths.js - V33.0 (Audit Log Path Fix)
 * Gecorrigeerd: Paden voor collecties moeten een oneven aantal segmenten hebben.
 */

const BASE = "future-factory";

export const PATHS = {
  // --- PRODUCTIE ---
  PRODUCTS: [BASE, "production", "products"],
  PLANNING: [BASE, "production", "digital_planning"],
  TRACKING: [BASE, "production", "tracked_products"],
  MESSAGES: [BASE, "production", "messages"],
  OCCUPANCY: [BASE, "production", "machine_occupancy"],
  INVENTORY: [BASE, "production", "inventory", "records"],

  // --- TECHNISCHE SPECS ---
  BORE_DIMENSIONS: [BASE, "production", "dimensions", "bore", "records"],
  CB_DIMENSIONS: [BASE, "production", "dimensions", "cb", "records"],
  TB_DIMENSIONS: [BASE, "production", "dimensions", "tb", "records"],
  FITTING_SPECS: [BASE, "production", "dimensions", "fitting", "records"],
  SOCKET_SPECS: [BASE, "production", "dimensions", "socket", "records"],

  // --- GEBRUIKERS ---
  USERS: [BASE, "Users", "Accounts"],
  PERSONNEL: [BASE, "Users", "Personnel"],

  // --- INSTELLINGEN & CONFIG ---
  FACTORY_CONFIG: [BASE, "settings", "factory_configs", "main"],
  GENERAL_SETTINGS: [BASE, "settings", "general_configs", "main"],
  MATRIX_CONFIG: [BASE, "settings", "matrix_configs", "main"],
  BLUEPRINTS: [BASE, "settings", "blueprint_configs", "main"],
  LABEL_TEMPLATES: [BASE, "settings", "label_templates", "records"],

  // --- LOGGING & AUDIT (FIXED: 3 segmenten voor collectie) ---
  ACTIVITY_LOGS: [BASE, "production", "activity_logs"],

  CONVERSION_MATRIX: [BASE, "settings", "conversions", "mapping", "records"],
  IMAGE_LIBRARY: [BASE, "settings", "media", "images", "records"],
  DRAWING_LIBRARY: [BASE, "settings", "media", "drawings", "records"],
  AI_KNOWLEDGE_BASE: [BASE, "settings", "ai_knowledge_base", "records"],
};

export const isValidPath = (key) => !!(PATHS[key] && Array.isArray(PATHS[key]));
