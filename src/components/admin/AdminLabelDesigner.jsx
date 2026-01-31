import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Save,
  Printer,
  Type,
  ScanBarcode,
  QrCode,
  Trash2,
  Settings,
  Grid,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  BoxSelect,
  FileEdit,
  Plus,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  LayoutTemplate,
  RefreshCcw,
  Database,
  X,
  Loader2,
  Minus,
  Square,
  BringToFront,
  SendToBack,
  ArrowUp,
  ArrowDown,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
  query,
  limit,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { PATHS } from "../../config/dbPaths";

// Importeer de logica en constanten uit het hulpbestand
import {
  LABEL_SIZES,
  processLabelData,
  resolveLabelContent,
} from "../../utils/labelHelpers";

const PIXELS_PER_MM = 3.78;
const SNAP_THRESHOLD_MM = 1.5;

/**
 * AdminLabelDesigner V4.2 - Standalone Admin Edition
 * Beheert labelontwerpen in de root: /future-factory/settings/label_templates/records/
 * Verplaatst van matrixmanager naar hoofd admin map.
 */
const AdminLabelDesigner = ({ onBack }) => {
  const [labelName, setLabelName] = useState("Nieuw Label");
  const [selectedSizeKey, setSelectedSizeKey] = useState("Standard");
  const [labelWidth, setLabelWidth] = useState(LABEL_SIZES.Standard.width);
  const [labelHeight, setLabelHeight] = useState(LABEL_SIZES.Standard.height);

  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [zoom, setZoom] = useState(1.2);
  const [showGrid, setShowGrid] = useState(true);
  const [guidelines, setGuidelines] = useState([]);

  const [previewData, setPreviewData] = useState(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [availableOrders, setAvailableOrders] = useState([]);

  const [isDragging, setIsDragging] = useState(false);
  const [savedLabels, setSavedLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const canvasRef = useRef(null);

  // 1. Live Sync met de Root
  useEffect(() => {
    const colRef = collection(db, ...PATHS.LABEL_TEMPLATES);
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        setSavedLabels(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("Sync Error:", err)
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedSizeKey !== "Custom" && LABEL_SIZES[selectedSizeKey]) {
      setLabelWidth(LABEL_SIZES[selectedSizeKey].width);
      setLabelHeight(LABEL_SIZES[selectedSizeKey].height);
    }
  }, [selectedSizeKey]);

  // 2. Data Preview Handlers
  const fetchLiveOrders = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, ...PATHS.PLANNING), limit(15));
      const snapshot = await getDocs(q);
      setAvailableOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setShowDataModal(true);
    } catch (e) {
      console.error("Fout bij ophalen orders:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectOrderForPreview = (order) => {
    setPreviewData(processLabelData(order));
    setShowDataModal(false);
  };

  // 3. Designer Acties
  const addElement = (type) => {
    const newElement = {
      id: Date.now().toString(),
      type,
      x: 5,
      y: 5,
      width:
        type === "text" ? 40 : type === "line" ? 30 : type === "box" ? 30 : 20,
      height:
        type === "text" ? 10 : type === "line" ? 0.5 : type === "box" ? 20 : 20,
      thickness: type === "box" ? 0.5 : undefined,
      content:
        type === "text"
          ? "HANDMATIGE TEKST"
          : type === "barcode"
          ? "123456"
          : "QR_DATA",
      fontSize: 10,
      align: "left",
      fontFamily: "Arial",
      isBold: false,
      rotation: 0,
      variable: "",
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const updateElement = (id, updates) => {
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const removeElement = (id) => {
    setElements(elements.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const alignCenter = (axis) => {
    if (!selectedElementId) return;
    const el = elements.find((e) => e.id === selectedElementId);
    if (axis === "x")
      updateElement(el.id, { x: (labelWidth - (el.width || 0)) / 2 });
    else if (axis === "y")
      updateElement(el.id, { y: (labelHeight - (el.height || 0)) / 2 });
  };

  // 4. Drag Engine met Snapping
  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    setSelectedElementId(id);
    setIsDragging(true);
    const element = elements.find((el) => el.id === id);
    const labelCenterX = labelWidth / 2;
    const labelCenterY = labelHeight / 2;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom / PIXELS_PER_MM;
      const deltaY = (moveEvent.clientY - startY) / zoom / PIXELS_PER_MM;
      let newX = Math.max(0, element.x + deltaX);
      let newY = Math.max(0, element.y + deltaY);

      const activeGuidelines = [];
      const myWidth = element.width || 0;
      const myHeight = element.height || 0;
      const myCenterX = newX + myWidth / 2;
      const myCenterY = newY + myHeight / 2;

      if (Math.abs(myCenterX - labelCenterX) < SNAP_THRESHOLD_MM) {
        newX = labelCenterX - myWidth / 2;
        activeGuidelines.push({ type: "vertical", pos: labelCenterX });
      }
      if (Math.abs(myCenterY - labelCenterY) < SNAP_THRESHOLD_MM) {
        newY = labelCenterY - myHeight / 2;
        activeGuidelines.push({ type: "horizontal", pos: labelCenterY });
      }

      setGuidelines(activeGuidelines);
      updateElement(id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setGuidelines([]);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // 5. Opslaan
  const saveLabel = async () => {
    if (!labelName.trim()) return alert("Geef het label een naam.");
    setIsLoading(true);
    try {
      const labelId = labelName.replace(/\s+/g, "_").toLowerCase();
      const docRef = doc(db, ...PATHS.LABEL_TEMPLATES, labelId);

      await setDoc(docRef, {
        name: labelName,
        sizeKey: selectedSizeKey,
        width: labelWidth,
        height: labelHeight,
        elements: elements,
        lastUpdated: serverTimestamp(),
        updatedBy: "Admin Designer",
      });
      alert("Label template opgeslagen!");
    } catch (e) {
      alert("Fout bij opslaan.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 overflow-hidden text-left animate-in fade-in">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center shadow-sm z-20 shrink-0 h-20">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all flex items-center gap-2 group"
          >
            <X
              size={18}
              className="group-hover:rotate-90 transition-transform"
            />
          </button>
          <div className="text-left">
            <h1 className="font-black text-slate-900 text-lg uppercase italic tracking-tighter leading-none">
              Label <span className="text-blue-600">Architect</span>
            </h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <ShieldCheck size={10} className="text-emerald-500" /> Root Sync:
              /{PATHS.LABEL_TEMPLATES.join("/")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLiveOrders}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
              previewData
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
            }`}
          >
            <Database size={14} />
            {previewData ? "Live Data Gekoppeld" : "Koppel Live Order"}
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-100 rounded-2xl p-1">
            <select
              value={selectedSizeKey}
              onChange={(e) => setSelectedSizeKey(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase outline-none px-4 py-2 cursor-pointer"
            >
              {Object.keys(LABEL_SIZES).map((s) => (
                <option key={s} value={s}>
                  {LABEL_SIZES[s].name}
                </option>
              ))}
              <option value="Custom">Custom Size</option>
            </select>
          </div>

          <button
            onClick={saveLabel}
            disabled={isLoading}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center gap-3"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}{" "}
            Opslaan
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT BAR: TOOLS */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col z-10 shrink-0">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-5 tracking-widest">
              Componenten
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: "text", label: "Tekst", icon: Type },
                { type: "line", label: "Lijn", icon: Minus },
                { type: "box", label: "Kader", icon: Square },
                { type: "barcode", label: "Barcode", icon: ScanBarcode },
                { type: "qr", label: "QR Code", icon: QrCode },
              ].map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => addElement(tool.type)}
                  className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border-2 border-transparent hover:border-blue-100 rounded-[25px] transition-all group active:scale-90"
                >
                  <tool.icon
                    size={22}
                    className="mb-2 text-slate-400 group-hover:text-blue-500"
                  />
                  <span className="text-[9px] font-black uppercase tracking-tighter">
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-left">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Mijn Templates
            </h3>
            <div className="space-y-2">
              {savedLabels.map((l) => (
                <div
                  key={l.id}
                  onClick={() =>
                    window.confirm("Huidig ontwerp overschrijven?") &&
                    (setLabelName(l.name),
                    setLabelWidth(l.width),
                    setLabelHeight(l.height),
                    setElements(l.elements || []),
                    setSelectedElementId(null))
                  }
                  className="group p-4 bg-slate-50 hover:bg-white rounded-[20px] cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all relative shadow-sm"
                >
                  <p className="font-black text-[11px] text-slate-800 uppercase italic tracking-tight">
                    {l.name}
                  </p>
                  <p className="text-[9px] font-mono font-bold text-slate-400 mt-1">
                    {l.width}x{l.height}mm
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CANVAS AREA */}
        <div className="flex-1 bg-slate-200 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-6 bg-white/90 backdrop-blur rounded-full px-6 py-3 shadow-2xl border border-slate-200 flex items-center gap-6 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-xs font-black text-slate-800 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            <div className="w-px h-5 bg-slate-200"></div>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-xl transition-all ${
                showGrid ? "bg-blue-100 text-blue-600" : "text-slate-400"
              }`}
            >
              <Grid size={18} />
            </button>
          </div>

          <div
            className="w-full h-full flex items-center justify-center p-20 overflow-auto"
            onClick={() => setSelectedElementId(null)}
          >
            <div
              ref={canvasRef}
              className="bg-white shadow-2xl relative transition-all duration-75 overflow-hidden border border-slate-300"
              style={{
                width: `${labelWidth * PIXELS_PER_MM * zoom}px`,
                height: `${labelHeight * PIXELS_PER_MM * zoom}px`,
                backgroundImage: showGrid
                  ? "radial-gradient(#cbd5e1 1px, transparent 1px)"
                  : "none",
                backgroundSize: `${10 * PIXELS_PER_MM * zoom}px ${
                  10 * PIXELS_PER_MM * zoom
                }px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* GUIDELINES */}
              {guidelines.map((g, i) => (
                <div
                  key={i}
                  className="absolute bg-blue-500/50 z-30 pointer-events-none"
                  style={{
                    left:
                      g.type === "vertical"
                        ? `${g.pos * PIXELS_PER_MM * zoom}px`
                        : 0,
                    top:
                      g.type === "horizontal"
                        ? `${g.pos * PIXELS_PER_MM * zoom}px`
                        : 0,
                    width: g.type === "vertical" ? "1px" : "100%",
                    height: g.type === "horizontal" ? "1px" : "100%",
                  }}
                />
              ))}

              {elements.map((el) => (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                  className="absolute cursor-move group select-none"
                  style={{
                    left: `${el.x * PIXELS_PER_MM * zoom}px`,
                    top: `${el.y * PIXELS_PER_MM * zoom}px`,
                    transform: `rotate(${el.rotation || 0}deg)`,
                    transformOrigin: "top left",
                  }}
                >
                  <div
                    className={`transition-all ${
                      selectedElementId === el.id
                        ? "ring-2 ring-blue-500 ring-offset-4 bg-blue-50/20"
                        : "hover:ring-1 hover:ring-blue-300"
                    } p-0.5`}
                  >
                    {el.type === "text" && (
                      <div
                        className="leading-tight"
                        style={{
                          fontSize: `${el.fontSize * zoom}px`,
                          fontWeight: el.isBold ? "900" : "normal",
                          fontFamily: el.fontFamily,
                          width: `${el.width * PIXELS_PER_MM * zoom}px`,
                          height: el.height
                            ? `${el.height * PIXELS_PER_MM * zoom}px`
                            : "auto",
                          textAlign: el.align || "left",
                          overflow: "hidden",
                        }}
                      >
                        {resolveLabelContent(el, previewData).content}
                      </div>
                    )}
                    {el.type === "line" && (
                      <div
                        style={{
                          width: `${el.width * PIXELS_PER_MM * zoom}px`,
                          height: `${el.height * PIXELS_PER_MM * zoom}px`,
                          backgroundColor: "black",
                        }}
                      />
                    )}
                    {el.type === "box" && (
                      <div
                        style={{
                          width: `${el.width * PIXELS_PER_MM * zoom}px`,
                          height: `${el.height * PIXELS_PER_MM * zoom}px`,
                          border: `${
                            (el.thickness || 1) * PIXELS_PER_MM * zoom
                          }px solid black`,
                          boxSizing: "border-box",
                        }}
                      />
                    )}
                    {(el.type === "barcode" || el.type === "qr") && (
                      <div
                        className="bg-slate-50 border border-slate-300 flex items-center justify-center"
                        style={{
                          width: `${(el.width || 30) * PIXELS_PER_MM * zoom}px`,
                          height: `${
                            (el.height || 30) * PIXELS_PER_MM * zoom
                          }px`,
                        }}
                      >
                        <ScanBarcode
                          size={24 * zoom}
                          className="text-slate-400"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: PROPERTIES */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col z-10 shrink-0 shadow-2xl">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-2">
              <Settings size={14} /> Inspector
            </h3>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-left">
            {!selectedElement ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 py-20">
                <BoxSelect size={64} className="animate-pulse" />
                <p className="text-[9px] font-black uppercase tracking-widest mt-4">
                  Element selecteren
                </p>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-right-2">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block ml-1">
                    Inhoud & Variabele
                  </label>
                  <select
                    value={selectedElement.variable}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        variable: e.target.value,
                        content: e.target.value
                          ? `{${e.target.value}}`
                          : "Handmatige Tekst",
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-xs font-bold"
                  >
                    <option value="">Statische Tekst</option>
                    <option value="lotNumber">Lotnummer</option>
                    <option value="orderId">Ordernummer</option>
                    <option value="itemCode">Artikelcode</option>
                    <option value="productType">Product Type</option>
                    <option value="diameter">Diameter (DN)</option>
                    <option value="pressure">Drukklasse (PN)</option>
                    <option value="date">Productiedatum</option>
                  </select>
                  {!selectedElement.variable && (
                    <input
                      type="text"
                      value={selectedElement.content}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          content: e.target.value,
                        })
                      }
                      className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500"
                      placeholder="Vrije tekst..."
                    />
                  )}
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block ml-1">
                    Layout & Uitlijning
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => alignCenter("x")}
                      className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase transition-all"
                    >
                      <AlignHorizontalJustifyCenter size={14} /> Center X
                    </button>
                    <button
                      onClick={() => alignCenter("y")}
                      className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase transition-all"
                    >
                      <AlignVerticalJustifyCenter size={14} /> Center Y
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">
                      W (mm)
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.width)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          width: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-xs font-bold text-center"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">
                      H (mm)
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.height || 0)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          height: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-xs font-bold text-center"
                    />
                  </div>
                </div>

                <button
                  onClick={() => removeElement(selectedElement.id)}
                  className="w-full py-4 mt-8 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2 border border-rose-100 active:scale-95"
                >
                  <Trash2 size={16} /> Verwijder Element
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLabelDesigner;
