import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Palette,
  Download,
  Save,
  RotateCcw,
  Layers,
  Brush,
  Eraser,
  Minus,
  Plus,
  Trash2,
  ZoomOut,
  Loader2,
  GripVertical,
  RotateCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BatikBackground } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { BatikItem } from "../../types/database";
import { toast } from "sonner";
import { Skeleton } from "../components/ui/skeleton";
import { fabric } from "fabric";

type Tool = "select" | "brush" | "eraser";

interface CustomLayer {
  id: string;
  type: "pattern" | "drawing";
  name: string;
  visible: boolean;
  locked: boolean;
  fabricObject?: fabric.Object;
  brushColor?: string;
  brushSize?: number;
}

export function CustomBatikPage() {
  const [patterns, setPatterns] = useState<BatikItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState<CustomLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [brushSize, setBrushSize] = useState([16]);
  const [brushColor, setBrushColor] = useState("#8B6F47");
  const [brushOpacity, setBrushOpacity] = useState([80]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyLength, setHistoryLength] = useState(0);
  const [hasOffscreenContent, setHasOffscreenContent] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isRestoringRef = useRef(false);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const initialOffscreenImageDataRef = useRef<ImageData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const activeToolRef = useRef<Tool>("select");
  const brushSizeRef = useRef(16);
  const brushColorRef = useRef("#8B6F47");
  const brushOpacityRef = useRef(80);
  const offscreenHistoryRef = useRef<ImageData[]>([]);
  const offscreenHistoryIndexRef = useRef<number>(-1);

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { brushSizeRef.current = brushSize[0]; }, [brushSize]);
  useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
  useEffect(() => { brushOpacityRef.current = brushOpacity[0]; }, [brushOpacity]);

  // ─── Init offscreen canvas (sekali saja) ──────────────────────────────────
  useEffect(() => {
    const offscreen = document.createElement("canvas");
    offscreen.width = 800;
    offscreen.height = 600;
    offscreenRef.current = offscreen;
    // Save initial empty ImageData
    const ctx = offscreen.getContext("2d")!;
    initialOffscreenImageDataRef.current = ctx.getImageData(0, 0, 800, 600);
  }, []);

  // Helper to check if two ImageData are the same
  const isImageDataEqual = (img1: ImageData, img2: ImageData) => {
    if (img1.width !== img2.width || img1.height !== img2.height) return false;
    for (let i = 0; i < img1.data.length; i++) {
      if (img1.data[i] !== img2.data[i]) return false;
    }
    return true;
  };

  // Helper to check if offscreen has content
  const checkOffscreenHasContent = () => {
    const offscreen = offscreenRef.current;
    const initial = initialOffscreenImageDataRef.current;
    if (!offscreen || !initial) return false;
    const ctx = offscreen.getContext("2d")!;
    const current = ctx.getImageData(0, 0, 800, 600);
    return !isImageDataEqual(initial, current);
  };

  // ─── Sync offscreen → display (dipanggil setiap stroke) ───────────────────
  const syncDisplay = useCallback(() => {
    const display = displayCanvasRef.current;
    const offscreen = offscreenRef.current;
    if (!display || !offscreen) return;
    const ctx = display.getContext("2d")!;
    ctx.clearRect(0, 0, 800, 600);
    ctx.drawImage(offscreen, 0, 0);
  }, []);

  // ─── Simpan snapshot ke history Fabric (untuk pattern) ────────────────────
  const saveSnapshot = useCallback(() => {
    const fc = fabricCanvasRef.current;
    if (!fc || isRestoringRef.current) return;

    const json = JSON.stringify(fc.toJSON(["data"]));

    // Buang history setelah index saat ini (kalau habis undo lalu aksi baru)
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;

    // Batasi max 50 snapshot supaya tidak makan memory
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
  }, []);

  // ─── Simpan snapshot offscreen (untuk brush/eraser) ───────────────────────
  const saveOffscreenSnapshot = useCallback(() => {
    const offscreen = offscreenRef.current;
    if (!offscreen) return;
    const ctx = offscreen.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, 800, 600);
    
    // Buang redo history
    offscreenHistoryRef.current = offscreenHistoryRef.current.slice(
      0, offscreenHistoryIndexRef.current + 1
    );
    offscreenHistoryRef.current.push(imageData);
    offscreenHistoryIndexRef.current = offscreenHistoryRef.current.length - 1;

    if (offscreenHistoryRef.current.length > 50) {
      offscreenHistoryRef.current.shift();
      offscreenHistoryIndexRef.current--;
    }

    // Force re-render supaya tombol undo/redo update (gunakan max index untuk display)
    const maxIndex = Math.max(
      offscreenHistoryIndexRef.current,
      historyIndexRef.current
    );
    const maxLength = Math.max(
      offscreenHistoryRef.current.length,
      historyRef.current.length
    );
    setHistoryIndex(maxIndex);
    setHistoryLength(maxLength);
  }, []);

  // ─── Undo/redo offscreen (brush/eraser) ───────────────────────────────────
  const undoOffscreen = useCallback(() => {
    if (offscreenHistoryIndexRef.current <= 0) return;
    offscreenHistoryIndexRef.current--;
    
    const offscreen = offscreenRef.current!;
    const ctx = offscreen.getContext("2d")!;
    ctx.clearRect(0, 0, 800, 600);
    ctx.putImageData(
      offscreenHistoryRef.current[offscreenHistoryIndexRef.current], 0, 0
    );
    syncDisplay();
    setHasOffscreenContent(checkOffscreenHasContent());
  }, [syncDisplay]);

  const redoOffscreen = useCallback(() => {
    if (offscreenHistoryIndexRef.current >= offscreenHistoryRef.current.length - 1) return;
    offscreenHistoryIndexRef.current++;
    
    const offscreen = offscreenRef.current!;
    const ctx = offscreen.getContext("2d")!;
    ctx.clearRect(0, 0, 800, 600);
    ctx.putImageData(
      offscreenHistoryRef.current[offscreenHistoryIndexRef.current], 0, 0
    );
    syncDisplay();
    setHasOffscreenContent(checkOffscreenHasContent());
  }, [syncDisplay]);

  // ─── Restore Fabric snapshot (untuk pattern) ──────────────────────────────
  const restoreSnapshot = useCallback((index: number) => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    isRestoringRef.current = true;
    const json = historyRef.current[index];

    fc.loadFromJSON(JSON.parse(json), () => {
      fc.renderAll();
      isRestoringRef.current = false;

      // Sync layers dari objects yang ada di canvas
      const objects = fc.getObjects();
      const restoredLayers: CustomLayer[] = objects.map((obj) => ({
        id: (obj as any).data?.layerId ?? Date.now().toString(),
        type: ((obj as any).data?.patternId ? "pattern" : "drawing") as "pattern" | "drawing",
        name: (obj as any).data?.layerName ?? "Layer",
        visible: obj.visible ?? true,
        locked: !obj.selectable,
        fabricObject: obj,
      }));

      setLayers(restoredLayers);
      setSelectedLayerId(null);
    });
  }, []);

  // ─── Undo & Redo (gabungkan offscreen + Fabric) ───────────────────────────
  const undo = useCallback(() => {
    // Undo offscreen
    undoOffscreen();
    // Undo Fabric
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      restoreSnapshot(historyIndexRef.current);
    }
    // Update UI state
    const maxIndex = Math.max(
      offscreenHistoryIndexRef.current,
      historyIndexRef.current
    );
    setHistoryIndex(maxIndex);
  }, [undoOffscreen, restoreSnapshot]);

  const redo = useCallback(() => {
    // Redo offscreen
    redoOffscreen();
    // Redo Fabric
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      restoreSnapshot(historyIndexRef.current);
    }
    // Update UI state
    const maxIndex = Math.max(
      offscreenHistoryIndexRef.current,
      historyIndexRef.current
    );
    setHistoryIndex(maxIndex);
  }, [redoOffscreen, restoreSnapshot]);

  // ─── Helper koordinat (scale-aware) ───────────────────────────────────────
  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    const clientX = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // ─── Stroke ke offscreen (brush ATAU eraser, logika sama) ─────────────────
  const continueStroke = useCallback(
    (
      from: { x: number; y: number },
      to: { x: number; y: number },
      tool: "brush" | "eraser"
    ) => {
      const offscreen = offscreenRef.current;
      if (!offscreen) return;
      const ctx = offscreen.getContext("2d")!;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSizeRef.current;

      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        const r = parseInt(brushColorRef.current.slice(1, 3), 16);
        const g = parseInt(brushColorRef.current.slice(3, 5), 16);
        const b = parseInt(brushColorRef.current.slice(5, 7), 16);
        ctx.strokeStyle = `rgba(${r},${g},${b},${brushOpacityRef.current / 100})`;
      }

      // Titik tengah antara from dan to
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      // Kurva ke titik tengah, dengan `to` sebagai control point
      // Ini yang bikin transisi antar segment jadi smooth
      ctx.quadraticCurveTo(to.x, to.y, midX, midY);
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  // Helper untuk titik awal (klik tanpa drag)
  const startStroke = useCallback(
    (pos: { x: number; y: number }, tool: "brush" | "eraser") => {
      const offscreen = offscreenRef.current;
      if (!offscreen) return;
      const ctx = offscreen.getContext("2d")!;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSizeRef.current;

      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        const r = parseInt(brushColorRef.current.slice(1, 3), 16);
        const g = parseInt(brushColorRef.current.slice(3, 5), 16);
        const b = parseInt(brushColorRef.current.slice(5, 7), 16);
        ctx.strokeStyle = `rgba(${r},${g},${b},${brushOpacityRef.current / 100})`;
      }

      // Titik bulat di ujung agar tidak ada gap saat klik tanpa drag
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSizeRef.current / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    []
  );

  const colorPresets = [
    { name: "Klasik Sogan", colors: { primary: "#8B6F47", secondary: "#D4B88B", accent: "#E8E1DA", background: "transparent" } },
    { name: "Emas Kerajaan", colors: { primary: "#6B3A1F", secondary: "#D4B88B", accent: "#E8DCC8", background: "transparent" } },
    { name: "Biru Nusantara", colors: { primary: "#2A4B7C", secondary: "#5A8AC6", accent: "#B8D4F0", background: "transparent" } },
    { name: "Merah Meriah", colors: { primary: "#8B2A2A", secondary: "#C64F4F", accent: "#F0B8B8", background: "transparent" } },
    { name: "Hijau Alam", colors: { primary: "#2D5A2D", secondary: "#5A9C5A", accent: "#B8E0B8", background: "transparent" } },
    { name: "Ungu Mewah", colors: { primary: "#5A2D7C", secondary: "#8B5AB8", accent: "#D4B8E0", background: "transparent" } },
  ];

  // Fetch patterns
  useEffect(() => {
    async function fetchPatterns() {
      try {
        const { data, error } = await supabase
          .from("batik_items")
          .select("*")
          .order("id", { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) setPatterns(data);
      } catch (err: any) {
        handleSupabaseError(err, "CustomBatikPage.fetchPatterns");
      } finally {
        setLoading(false);
      }
    }
    fetchPatterns();
  }, []);



  // ─── Initialize Fabric Canvas ─────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
    });
    fabricCanvasRef.current = canvas;

    // Custom delete control
    fabric.Object.prototype.controls.deleteControl = new fabric.Control({
      x: 0.5,
      y: -0.5,
      offsetY: -16,
      cursorStyle: "pointer",
      mouseUpHandler: () => {
        const active = canvas.getActiveObjects();
        if (active.length > 0) {
          active.forEach((obj) => {
            if ((obj as any).data?.layerId) {
              canvas.remove(obj);
              setLayers((prev) => prev.filter((l) => l.id !== (obj as any).data.layerId));
            }
          });
          canvas.discardActiveObject();
          setSelectedLayerId(null);
        }
        return true;
      },
      render: (ctx, left, top, _style, fabricObject) => {
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0));
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, 2 * Math.PI);
        ctx.fillStyle = "#ef4444";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5, -5); ctx.lineTo(5, 5);
        ctx.moveTo(5, -5); ctx.lineTo(-5, 5);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
      },
      cornerSize: 24,
    });

    canvas.on("object:selected", (e) => {
      if ((e as any).target?.data?.layerId) setSelectedLayerId((e as any).target.data.layerId);
    });
    canvas.on("selection:cleared", () => setSelectedLayerId(null));

    // Save both Fabric and offscreen when objects change
    const onChange = () => {
      saveSnapshot();
      saveOffscreenSnapshot();
    };
    canvas.on("object:modified", onChange);
    canvas.on("object:removed", onChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        const active = canvas.getActiveObjects();
        if (active.length > 0) {
          active.forEach((obj) => {
            if ((obj as any).data?.layerId) {
              canvas.remove(obj);
              setLayers((prev) => prev.filter((l) => l.id !== (obj as any).data.layerId));
            }
          });
          canvas.discardActiveObject();
          setSelectedLayerId(null);
          // onChange will be called via object:removed listener
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Save initial snapshots for both
    saveSnapshot();
    saveOffscreenSnapshot();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      canvas.dispose();
    };
  }, [saveSnapshot, undo, redo, saveOffscreenSnapshot]);

  // ─── Event listeners di display canvas ────────────────────────────────────
  useEffect(() => {
    const display = displayCanvasRef.current;
    if (!display) return;

    const onStart = (e: MouseEvent | TouchEvent) => {
      const tool = activeToolRef.current;
      if (tool !== "brush" && tool !== "eraser") return;
      if (e instanceof TouchEvent) e.preventDefault();

      isDrawingRef.current = true;
      const pos = getPos(e, display);
      lastPosRef.current = pos;

      // Titik awal (klik tanpa drag)
      startStroke(pos, tool);
      syncDisplay();
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      const tool = activeToolRef.current;
      if (tool !== "brush" && tool !== "eraser") return;
      if (e instanceof TouchEvent) e.preventDefault();

      const pos = getPos(e, display);
      const last = lastPosRef.current ?? pos;

      continueStroke(last, pos, tool);
      syncDisplay();

      // Simpan midpoint sebagai anchor berikutnya, bukan pos langsung
      lastPosRef.current = {
        x: (last.x + pos.x) / 2,
        y: (last.y + pos.y) / 2,
      };
    };

    const onEnd = () => {
      if (isDrawingRef.current) {
        // Save snapshot for undo after stroke is complete
        saveOffscreenSnapshot();
        // Check if offscreen has content now
        setHasOffscreenContent(checkOffscreenHasContent());
      }
      isDrawingRef.current = false;
      lastPosRef.current = null;
    };

    display.addEventListener("mousedown", onStart);
    display.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    display.addEventListener("touchstart", onStart, { passive: false });
    display.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);

    return () => {
      display.removeEventListener("mousedown", onStart);
      display.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      display.removeEventListener("touchstart", onStart);
      display.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [continueStroke, startStroke, syncDisplay, saveOffscreenSnapshot]);



  // ─── Switch tool ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    const display = displayCanvasRef.current;
    if (!canvas || !display) return;

    if (activeTool === "select") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.renderAll();
      display.style.pointerEvents = "none"; // Fabric aktif
      display.style.cursor = "default";
    } else {
      // brush atau eraser: display canvas yang menerima input
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.renderAll();
      display.style.pointerEvents = "auto";

      const size = brushSize[0];
      const cursorSvg =
        activeTool === "eraser"
          ? `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 1}' fill='none' stroke='%23333' stroke-width='1.5'/></svg>`
          : `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 1}' fill='${brushColor.replace("#", "%23")}' opacity='0.7'/></svg>`;
      display.style.cursor = `url("data:image/svg+xml,${cursorSvg}") ${size / 2} ${size / 2}, crosshair`;
    }
  }, [activeTool, brushSize, brushColor]);

  // ─── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const display = displayCanvasRef.current;
      const fc = fabricCanvasRef.current;
      if (!container || !fc || !display) return;

      const { width } = container.getBoundingClientRect();
      fc.setWidth(width);
      fc.setHeight(width * 0.75);
      fc.setZoom(width / 800);

      // Pixel size tetap 800x600, hanya tampilan CSS yang scale
      display.style.width = `${width}px`;
      display.style.height = `${width * 0.75}px`;
    };
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // ─── Add pattern to canvas ────────────────────────────────────────────────
  const addItemToCanvas = useCallback((pattern: BatikItem) => {
    if (!fabricCanvasRef.current) return;
    const svg = renderPatternSVGString(pattern);
    fabric.loadSVGFromString(svg, (objects, options) => {
      const group = fabric.util.groupSVGElements(objects, options);
      group.set({ left: 100, top: 75, scaleX: 1, scaleY: 1, selectable: true });
      const newLayerId = Date.now().toString();
      (group as any).data = { layerId: newLayerId, patternId: pattern.id, layerName: pattern.name || "Motif" };
      fabricCanvasRef.current?.add(group);
      fabricCanvasRef.current?.setActiveObject(group);
      setLayers((prev) => [
        ...prev,
        { id: newLayerId, type: "pattern", name: pattern.name || "Motif", visible: true, locked: false, fabricObject: group },
      ]);
      setSelectedLayerId(newLayerId);
      // Save both snapshots
      saveSnapshot();
      saveOffscreenSnapshot();
    });
  }, [saveSnapshot, saveOffscreenSnapshot]);

  const renderPatternSVGString = (pattern: BatikItem) => {
    const id = `pattern-${pattern.id}`;
    const colors = { primary: "#8B6F47", secondary: "#D4B88B", background: "transparent" };
    let patternContent = "";
    if (pattern.style_type === "parang" || pattern.style_type === "traditional" || pattern.style_type === "diagonal-lines") {
      patternContent = `<rect fill="${colors.background}" width="100" height="100" /><path d="M0,50 Q25,25 50,50 Q75,75 100,50" stroke="${colors.primary}" stroke-width="6" fill="none" /><path d="M0,80 Q25,55 50,80 Q75,105 100,80" stroke="${colors.secondary}" stroke-width="3" fill="none" /><path d="M0,20 Q25,-5 50,20 Q75,45 100,20" stroke="${colors.secondary}" stroke-width="3" fill="none" />`;
    } else if (pattern.style_type === "kawung" || pattern.style_type === "circles") {
      patternContent = `<rect fill="${colors.background}" width="80" height="80" /><ellipse cx="40" cy="22" rx="10" ry="18" fill="none" stroke="${colors.primary}" stroke-width="2.5" /><ellipse cx="40" cy="58" rx="10" ry="18" fill="none" stroke="${colors.primary}" stroke-width="2.5" /><ellipse cx="22" cy="40" rx="18" ry="10" fill="none" stroke="${colors.primary}" stroke-width="2.5" /><ellipse cx="58" cy="40" rx="18" ry="10" fill="none" stroke="${colors.primary}" stroke-width="2.5" /><circle cx="40" cy="40" r="5" fill="${colors.secondary}" />`;
    } else if (pattern.style_type === "mega" || pattern.style_type === "clouds" || pattern.style_type === "regional") {
      patternContent = `<rect fill="${colors.background}" width="120" height="60" /><path d="M0,30 Q15,10 30,30 Q45,50 60,30 Q75,10 90,30 Q105,50 120,30" stroke="${colors.primary}" stroke-width="5" fill="none" />`;
    } else if (pattern.style_type === "truntum" || pattern.style_type === "stars") {
      patternContent = `<rect fill="${colors.background}" width="60" height="60" /><polygon points="30,10 34,22 46,22 36,30 40,42 30,34 20,42 24,30 14,22 26,22" fill="${colors.primary}" stroke="${colors.secondary}" stroke-width="1" /><circle cx="30" cy="30" r="4" fill="${colors.secondary}" />`;
    } else if (pattern.style_type === "sekar" || pattern.style_type === "flowers") {
      patternContent = `<rect fill="${colors.background}" width="80" height="80" /><circle cx="40" cy="40" r="7" fill="${colors.secondary}" /><circle cx="40" cy="20" r="10" fill="${colors.primary}" opacity="0.8" /><circle cx="60" cy="40" r="10" fill="${colors.primary}" opacity="0.8" /><circle cx="40" cy="60" r="10" fill="${colors.primary}" opacity="0.8" /><circle cx="20" cy="40" r="10" fill="${colors.primary}" opacity="0.8" />`;
    } else {
      patternContent = `<rect fill="${colors.background}" width="50" height="50" /><rect x="10" y="10" width="30" height="30" fill="none" stroke="${colors.primary}" stroke-width="2" />`;
    }
    return `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="${id}" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">${patternContent}</pattern></defs><rect width="200" height="200" fill="url(#${id})" /></svg>`;
  };

  const renderMiniPattern = (pattern: BatikItem) => {
    const id = `mini-${pattern.id}`;
    return (
      <svg width="100%" height="100%">
        <defs>
          <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect fill="#FAF8F5" width="20" height="20" />
            {(pattern.style_type === "parang" || pattern.style_type === "traditional" || pattern.style_type === "diagonal-lines") && (
              <path d="M0,10 Q5,5 10,10 Q15,15 20,10" stroke="#8B6F47" strokeWidth="1.5" fill="none" />
            )}
            {(pattern.style_type === "kawung" || pattern.style_type === "circles") && (
              <><circle cx="10" cy="6" r="4" fill="none" stroke="#8B6F47" strokeWidth="1" /><circle cx="10" cy="14" r="4" fill="none" stroke="#8B6F47" strokeWidth="1" /></>
            )}
            {(pattern.style_type === "mega" || pattern.style_type === "clouds" || pattern.style_type === "regional") && (
              <path d="M0,10 Q5,4 10,10 Q15,16 20,10" stroke="#8B6F47" strokeWidth="2" fill="none" />
            )}
            {(pattern.style_type === "truntum" || pattern.style_type === "stars") && (
              <polygon points="10,3 12,8 17,8 13,11 15,16 10,13 5,16 7,11 3,8 8,8" fill="#8B6F47" />
            )}
            {(pattern.style_type === "sekar" || pattern.style_type === "flowers") && (
              <><circle cx="10" cy="10" r="2.5" fill="#D4B88B" /><circle cx="10" cy="4" r="3" fill="#8B6F47" opacity="0.8" /><circle cx="16" cy="10" r="3" fill="#8B6F47" opacity="0.8" /><circle cx="10" cy="16" r="3" fill="#8B6F47" opacity="0.8" /><circle cx="4" cy="10" r="3" fill="#8B6F47" opacity="0.8" /></>
            )}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    );
  };

  // ─── Layer actions ────────────────────────────────────────────────────────
  const deleteSelectedLayer = useCallback(() => {
    if (!selectedLayerId || !fabricCanvasRef.current) return;
    const layer = layers.find((l) => l.id === selectedLayerId);
    if (layer?.fabricObject) fabricCanvasRef.current.remove(layer.fabricObject);
    setLayers((prev) => prev.filter((l) => l.id !== selectedLayerId));
    setSelectedLayerId(null);
  }, [selectedLayerId, layers]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers((prev) => prev.map((layer) => {
      if (layer.id === layerId && layer.fabricObject) {
        layer.fabricObject.set("visible", !layer.visible);
        fabricCanvasRef.current?.renderAll();
        return { ...layer, visible: !layer.visible };
      }
      return layer;
    }));
  }, []);

  const toggleLayerLock = useCallback((layerId: string) => {
    setLayers((prev) => prev.map((layer) => {
      if (layer.id === layerId && layer.fabricObject) {
        layer.fabricObject.set("selectable", layer.locked);
        layer.fabricObject.set("evented", layer.locked);
        fabricCanvasRef.current?.renderAll();
        return { ...layer, locked: !layer.locked };
      }
      return layer;
    }));
  }, []);

  const moveLayerUp = useCallback((layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (layer?.fabricObject) fabricCanvasRef.current?.bringForward(layer.fabricObject);
  }, [layers]);

  const duplicateLayer = useCallback((layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer?.fabricObject || !fabricCanvasRef.current) return;
    layer.fabricObject.clone((clonedObj: fabric.Object) => {
      clonedObj.set({ left: (clonedObj.left || 0) + 20, top: (clonedObj.top || 0) + 20 });
      const newLayerId = Date.now().toString();
      (clonedObj as any).data = { layerId: newLayerId };
      fabricCanvasRef.current?.add(clonedObj);
      setLayers((prev) => [...prev, {
        id: newLayerId, type: layer.type, name: `${layer.name} (Copy)`,
        visible: true, locked: false, fabricObject: clonedObj,
      }]);
    });
  }, [layers]);

  // ─── Download ──────────────────────────────────────────────────────────────
  const downloadDesign = async () => {
    const fc = fabricCanvasRef.current;
    const offscreen = offscreenRef.current;
    if (!fc || !offscreen) return;
    try {
      setIsDownloading(true);
      toast.info("Mempersiapkan unduhan...");

      const final = document.createElement("canvas");
      final.width = 800;
      final.height = 600;
      const ctx = final.getContext("2d")!;

      // 1. Background putih
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 800, 600);

      // 2. Fabric (motif pattern)
      const fabricImg = new Image();
      await new Promise<void>((res) => {
        fabricImg.onload = () => { ctx.drawImage(fabricImg, 0, 0); res(); };
        fabricImg.src = fc.toDataURL({ format: "png", multiplier: 1 });
      });

      // 3. Drawing layer — lubang eraser sudah ada di offscreen
      ctx.drawImage(offscreen, 0, 0);

      const link = document.createElement("a");
      link.download = `desain-batik-${Date.now()}.png`;
      link.href = final.toDataURL("image/png");
      link.click();
      toast.success("Desain berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh desain");
    } finally {
      setIsDownloading(false);
    }
  };

  // ─── Clear ─────────────────────────────────────────────────────────────────
  const clearAll = () => {
    const fc = fabricCanvasRef.current;
    if (fc) {
      // Remove all objects one by one instead of using clear()
      const objects = fc.getObjects();
      objects.forEach(obj => fc.remove(obj));
      fc.discardActiveObject();
      fc.renderAll();
    }
    if (offscreenRef.current) {
      const ctx = offscreenRef.current.getContext("2d")!;
      ctx.clearRect(0, 0, 800, 600);
      syncDisplay();
    }
    // Reset both histories
    historyRef.current = [];
    historyIndexRef.current = -1;
    offscreenHistoryRef.current = [];
    offscreenHistoryIndexRef.current = -1;
    // Save new initial snapshots
    saveSnapshot();
    saveOffscreenSnapshot();
    // Reset state
    setLayers([]);
    setSelectedLayerId(null);
    setHasOffscreenContent(false);
  };

  const saveDesign = async () => {
    if (!fabricCanvasRef.current) return;
    setIsSaving(true);
    try {
      const json = fabricCanvasRef.current.toJSON();
      const { error } = await supabase.from("custom_designs").insert([{ design_data: json, created_at: new Date().toISOString() }]);
      if (error) throw error;
      toast.success("Desain berhasil disimpan!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan desain");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="kawung" />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-4 pointer-events-none" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-4 pointer-events-none" style={{ background: "radial-gradient(circle, #8B6F47 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      <div className="container mx-auto px-4 py-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-5" style={{ background: "linear-gradient(135deg, rgba(212,184,139,0.18), rgba(139,111,71,0.08))", color: "#8B6F47", border: "1px solid rgba(212,184,139,0.3)" }}>
            <Palette className="w-4 h-4" />
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.2em", fontWeight: 600 }}>STUDIO KREATIF</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: "0.75rem" }}>
            Wujudkan <span style={{ color: "#8B6F47" }}>Karya Batik</span> Impian Anda
          </h1>
          <p style={{ color: "#7A6B5E", fontSize: "1rem", maxWidth: "600px", lineHeight: 1.7 }}>
            Klik motif untuk menambahkannya ke kanvas, kemudian atur posisi, ukuran, dan warnanya sesuai selera.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-3xl shadow-xl" style={{ border: "1px solid rgba(232, 225, 218, 0.8)", background: "#FFFFFF" }}>
              {/* Toolbar */}
              <div className="px-3 py-2 flex items-center justify-between gap-2" style={{ background: "#FFFFFF", borderBottom: "1px solid #E8E1DA" }}>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-0.5 p-1 rounded-lg" style={{ background: "#FAF8F5" }}>
                    {([
                      { tool: "select" as Tool, icon: ZoomOut, label: "Pilih" },
                      { tool: "brush" as Tool, icon: Brush, label: "Kuas" },
                      { tool: "eraser" as Tool, icon: Eraser, label: "Hapus" },
                    ] as const).map(({ tool, icon: Icon, label }) => (
                      <motion.button key={tool} whileHover={{ scale: activeTool === tool ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTool(tool)}
                        className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-md transition-all duration-200"
                        style={{ background: activeTool === tool ? "#FFFFFF" : "transparent", color: activeTool === tool ? "#8B6F47" : "#7A6B5E", boxShadow: activeTool === tool ? "0 1px 3px rgba(61,43,31,0.1)" : "none" }}
                        title={label}
                      >
                        <Icon className="w-4 h-4" />
                      </motion.button>
                    ))}
                  </div>

                  {activeTool !== "select" && (
                    <>
                      <div className="w-px h-7" style={{ background: "#E8E1DA" }} />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {activeTool === "brush" && (
                          <div className="flex items-center gap-1.5">
                            <motion.div whileHover={{ scale: 1.05 }} style={{ padding: "1.5px", background: "linear-gradient(135deg, #8B6F47, #D4B88B)", borderRadius: "8px" }}>
                              <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-7 h-7 rounded-md cursor-pointer border-0" />
                            </motion.div>
                            <div className="flex gap-0.5">
                              {["#8B6F47", "#D4B88B", "#3D2B1F", "#6B3A1F", "#2A4B7C", "#2D5A2D"].map((c, idx) => (
                                <motion.button key={idx} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setBrushColor(c)}
                                  className="w-5 h-5 rounded-md border-2 transition-all"
                                  style={{ background: c, borderColor: brushColor === c ? "#8B6F47" : "transparent" }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Minus className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#7A6B5E" }} />
                          <input type="range" min="2" max="80" step="2" value={brushSize[0]} onChange={(e) => setBrushSize([Number(e.target.value)])} className="w-20 h-1 rounded-md appearance-none cursor-pointer flex-shrink-0" style={{ background: "rgba(139,111,71,0.2)" }} />
                          <Plus className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#7A6B5E" }} />
                          <span className="text-[10px] font-medium w-6 flex-shrink-0" style={{ color: "#3D2B1F" }}>{brushSize[0]}px</span>
                        </div>
                        {activeTool === "brush" && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs flex-shrink-0" style={{ color: "#7A6B5E" }}>Op:</span>
                            <input type="range" min="5" max="100" step="5" value={brushOpacity[0]} onChange={(e) => setBrushOpacity([Number(e.target.value)])} className="w-16 h-1 rounded-md appearance-none cursor-pointer flex-shrink-0" style={{ background: "rgba(139,111,71,0.2)" }} />
                            <span className="text-xs font-medium flex-shrink-0" style={{ color: "#3D2B1F" }}>{brushOpacity[0]}%</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={undo} disabled={historyIndex <= 0} className="w-8 h-8 rounded-md flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0" style={{ background: "#FAF8F5", color: "#8B6F47", border: "1px solid #E8E1DA" }} title="Undo (Ctrl+Z)"><RotateCcw className="w-3.5 h-3.5" /></button>
                  <button onClick={redo} disabled={historyIndex >= historyLength - 1} className="w-8 h-8 rounded-md flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0" style={{ background: "#FAF8F5", color: "#8B6F47", border: "1px solid #E8E1DA" }} title="Redo (Ctrl+Y)"><RotateCw className="w-3.5 h-3.5" /></button>
                  <button
                  onClick={clearAll}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-all flex-shrink-0"
                  style={{ background: "#FAF8F5", color: "#dc2626", border: "1px solid #E8E1DA" }} title="Clear Canvas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                  {activeTool === "select" && (
                    <>
                      <div className="w-px h-7" style={{ background: "#E8E1DA" }} />
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveDesign} disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-md transition-all text-xs disabled:opacity-50 font-medium flex-shrink-0"
                        style={{ background: "#FAF8F5", color: "#8B6F47", border: "1px solid #E8E1DA" }}>
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Simpan
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={downloadDesign}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-md transition-all text-xs font-semibold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "#FFFFFF" }}>
                        {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        Unduh
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              {/* Canvas area */}
              <div ref={containerRef} className="aspect-[4/3] relative overflow-hidden select-none" style={{ background: "#f3f4f6" }}>
                {/* Layer 1: Fabric — motif pattern */}
                <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }} />

                {/* Layer 2: Display — mirror offscreen, transparan di area yang dihapus */}
                <canvas
                  ref={displayCanvasRef}
                  width={800}
                  height={600}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none", // diaktifkan JS saat brush/eraser
                  }}
                />

                {layers.length === 0 && !hasOffscreenContent && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ color: "#A89B8F" }}>
                    <Layers className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Kanvas Kosong</p>
                    <p className="text-sm opacity-70">Klik motif di sidebar untuk memulai</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="rounded-3xl shadow-xl overflow-hidden" style={{ border: "1px solid #E8E1DA", background: "#FFFFFF" }}>
              <Tabs defaultValue="pattern">
                <div className="p-5 pb-0" style={{ background: "#FFFFFF" }}>
                  <TabsList className="grid w-full grid-cols-3 p-1 rounded-2xl" style={{ background: "rgba(139,111,71,0.08)" }}>
                    <TabsTrigger value="pattern" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Tambah Motif</TabsTrigger>
                    <TabsTrigger value="color" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Preset</TabsTrigger>
                    <TabsTrigger value="layer" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Layer</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="pattern" className="p-5 m-0" style={{ background: "#FFFFFF" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-4 h-4" style={{ color: "#8B6F47" }} />
                    <p style={{ color: "#7A6B5E", fontSize: "0.8rem" }}>Klik untuk menambah motif ke kanvas</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
                    {loading ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />) : patterns.map((pattern) => (
                      <motion.button key={pattern.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => addItemToCanvas(pattern)}
                        className="p-3 rounded-2xl border-2 transition-all text-left"
                        style={{ borderColor: "rgba(139,111,71,0.15)", background: "rgba(250,248,245,0.8)" }}>
                        <div className="w-full h-12 rounded-xl mb-3 overflow-hidden" style={{ background: "#FAF8F5", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)" }}>
                          {renderMiniPattern(pattern)}
                        </div>
                        <div style={{ color: "#3D2B1F", fontSize: "0.85rem", fontWeight: 600, marginBottom: "2px" }}>{pattern.name}</div>
                        <div style={{ color: "#A89B8F", fontSize: "0.75rem" }}>{pattern.description}</div>
                        <div className="mt-2 text-xs font-medium" style={{ color: "#8B6F47" }}>+ Tambah ke kanvas</div>
                      </motion.button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="color" className="p-5 m-0" style={{ background: "#FFFFFF" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-4 h-4" style={{ color: "#8B6F47" }} />
                    <p style={{ color: "#7A6B5E", fontSize: "0.8rem" }}>Preset palet warna batik</p>
                  </div>
                  <div className="space-y-3">
                    {colorPresets.map((preset, i) => (
                      <button key={i} className="w-full p-3 rounded-2xl border text-left" style={{ border: "1px solid rgba(139,111,71,0.15)", background: "rgba(250,248,245,0.6)" }}>
                        <div className="flex gap-1 mb-2">
                          {Object.values(preset.colors).map((c, ci) => (
                            <div key={ci} className="w-8 h-8 rounded-xl" style={{ background: c, border: "1px solid rgba(0,0,0,0.05)" }} />
                          ))}
                        </div>
                        <div style={{ color: "#3D2B1F", fontSize: "0.85rem", fontWeight: 600 }}>{preset.name}</div>
                        <div style={{ color: "#A89B8F", fontSize: "0.75rem" }}>Pilih layer terlebih dahulu untuk menerapkan</div>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="layer" className="p-5 m-0" style={{ background: "#FFFFFF" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-4 h-4" style={{ color: "#8B6F47" }} />
                    <p style={{ color: "#7A6B5E", fontSize: "0.8rem" }}>Kelola urutan layer</p>
                  </div>
                  {layers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 rounded-2xl" style={{ background: "rgba(250,248,245,0.8)" }}>
                      <Layers className="w-10 h-10 mb-3 opacity-30" style={{ color: "#8B6F47" }} />
                      <p className="text-sm" style={{ color: "#A89B8F" }}>Belum ada layer</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                      {layers.slice().reverse().map((layer) => (
                        <motion.div key={layer.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.01 }}
                          onClick={() => {
                            if (layer.fabricObject && fabricCanvasRef.current) {
                              fabricCanvasRef.current.setActiveObject(layer.fabricObject);
                              setSelectedLayerId(layer.id);
                            }
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer ${selectedLayerId === layer.id ? "border-[#8B6F47] bg-[rgba(139,111,71,0.08)]" : "border-[rgba(139,111,71,0.15)] bg-[rgba(250,248,245,0.6)]"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#FAF8F5" }}>
                              {layer.type === "pattern" ? renderMiniPattern(patterns.find((p) => p.id === (layer.fabricObject as any)?.data?.patternId) || patterns[0]) : (
                                <div className="flex items-center justify-center w-full h-full">
                                  <Brush className="w-6 h-6 opacity-50" style={{ color: layer.brushColor || "#8B6F47" }} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: "#3D2B1F" }}>{layer.name}</p>
                              <p className="text-xs opacity-70" style={{ color: "#7A6B5E" }}>{layer.type === "pattern" ? "Motif" : "Gambar"}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[
                                { onClick: () => toggleLayerVisibility(layer.id), icon: layer.visible ? <Eye className="w-4 h-4" style={{ color: "#8B6F47" }} /> : <EyeOff className="w-4 h-4" style={{ color: "#8B6F47" }} />, bg: "rgba(139,111,71,0.1)" },
                                { onClick: () => toggleLayerLock(layer.id), icon: layer.locked ? <Lock className="w-4 h-4" style={{ color: "#8B6F47" }} /> : <Unlock className="w-4 h-4" style={{ color: "#8B6F47" }} />, bg: "rgba(139,111,71,0.1)" },
                                { onClick: () => duplicateLayer(layer.id), icon: <Copy className="w-4 h-4" style={{ color: "#8B6F47" }} />, bg: "rgba(139,111,71,0.1)" },
                                { onClick: () => moveLayerUp(layer.id), icon: <div style={{ transform: "rotate(-90deg)", color: "#8B6F47" }}><GripVertical className="w-4 h-4" /></div>, bg: "rgba(139,111,71,0.1)" },
                                { onClick: () => { setSelectedLayerId(layer.id); deleteSelectedLayer(); }, icon: <Trash2 className="w-4 h-4" style={{ color: "#dc2626" }} />, bg: "rgba(220,38,38,0.1)" },
                              ].map((btn, bi) => (
                                <motion.button key={bi} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                  onClick={(e) => { e.stopPropagation(); btn.onClick(); }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                                  style={{ background: btn.bg }}>
                                  {btn.icon}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
