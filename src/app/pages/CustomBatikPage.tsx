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
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BatikBackground } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { BatikItem } from "../../types/database";
import { toast } from "sonner";
import { Skeleton } from "../components/ui/skeleton";
import { fabric } from "fabric";

// Import dummy SVG batik
import parangDummySvg from "../../assets/batik-svgs/parang-dummy.svg?raw";
import parangBatikSvg from "../../assets/batik-svgs/parang_batik.svg?raw";
import parangSimpleSvg from "../../assets/batik-svgs/parang_simple.svg?raw";
import kawungDummySvg from "../../assets/batik-svgs/kawung-dummy.svg?raw";
import megaMendungDummySvg from "../../assets/batik-svgs/mega-mendung-dummy.svg?raw";
import truntumDummySvg from "../../assets/batik-svgs/truntum-dummy.svg?raw";
import sekarDummySvg from "../../assets/batik-svgs/sekar-dummy.svg?raw";
import sidoMuktiDummySvg from "../../assets/batik-svgs/sido-mukti-dummy.svg?raw";

// Mapping style_type ke SVG
const batikSvgMap: Record<string, string> = {
  parang: parangBatikSvg,
  "traditional": parangBatikSvg,
  "diagonal-lines": parangBatikSvg,
  kawung: kawungDummySvg,
  circles: kawungDummySvg,
  mega: megaMendungDummySvg,
  clouds: megaMendungDummySvg,
  regional: megaMendungDummySvg,
  truntum: truntumDummySvg,
  stars: truntumDummySvg,
  sekar: sekarDummySvg,
  flowers: sekarDummySvg,
  "sido-mukti": sidoMuktiDummySvg,
};

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

// Update colorPresets dengan properti background, light, mid, dark
const colorPresets = [
  { 
    name: "Klasik Sogan", 
    colors: { primary: "#8B6F47", secondary: "#D4B88B", accent: "#E8E1DA", background: "transparent" },
    batik: { background: "#f3f3f3", light: "#D4B88B", mid: "#8B6F47", dark: "#6B3A1F" }
  },
  { 
    name: "Emas Kerajaan", 
    colors: { primary: "#6B3A1F", secondary: "#D4B88B", accent: "#E8DCC8", background: "transparent" },
    batik: { background: "#f3f3f3", light: "#D4B88B", mid: "#6B3A1F", dark: "#3D2B1F" }
  },
  { 
    name: "Biru Nusantara", 
    colors: { primary: "#2A4B7C", secondary: "#5A8AC6", accent: "#B8D4F0", background: "transparent" },
    batik: { background: "#f3f3f3", light: "#5A8AC6", mid: "#2A4B7C", dark: "#1A2F4C" }
  },
  { 
    name: "Merah Meriah", 
    colors: { primary: "#8B2A2A", secondary: "#C64F4F", accent: "#F0B8B8", background: "transparent" },
    batik: { background: "#f3f3f3", light: "#C64F4F", mid: "#8B2A2A", dark: "#5B1A1A" }
  },
  { 
    name: "Hijau Alam", 
    colors: { primary: "#2D5A2D", secondary: "#5A9C5A", accent: "#B8E0B8", background: "transparent" },
    batik: { background: "#f3f3f3", light: "#5A9C5A", mid: "#2D5A2D", dark: "#1D3A1D" }
  },
  { 
    name: "Ungu Mewah", 
    colors: { primary: "#5A2D7C", secondary: "#8B5AB8", accent: "#D4B8E0", background: "transparent" },
    batik: { background: "#f3f3f3", light: "#8B5AB8", mid: "#5A2D7C", dark: "#3A1D5C" }
  },
];

// Fungsi recolor SVG yang super sederhana dan aman
const recolorSVG = (svgString: string, preset: typeof colorPresets[0]) => {
  let result = svgString;

  // Untuk parang_batik yang pakai 4 warna khusus:
  result = result.replace(/#f3f3f3/gi, preset.batik.background); // Latar belakang
  result = result.replace(/#a1a0a0/gi, preset.batik.light);     // Warna terang
  result = result.replace(/#5e5c5c/gi, preset.batik.mid);       // Warna sedang
  result = result.replace(/#242020/gi, preset.batik.dark);      // Warna gelap

  // Untuk dummy SVGs yang pakai #8B6F47 dan #D4B88B:
  result = result.replace(/#8B6F47/gi, preset.colors.primary);
  result = result.replace(/#D4B88B/gi, preset.colors.secondary);

  return result;
};

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
  const [historyIndex, setHistoryIndex] = useState(-1); // For brush
  const [historyLength, setHistoryLength] = useState(0); // For brush
  const [patternHistoryIndex, setPatternHistoryIndex] = useState(-1); // For pattern
  const [patternHistoryLength, setPatternHistoryLength] = useState(0); // For pattern
  const [hasOffscreenContent, setHasOffscreenContent] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  // State untuk preset warna yang dipilih
  const [selectedPreset, setSelectedPreset] = useState(colorPresets[0]);
  // State untuk tab sidebar aktif
  const [activeTab, setActiveTab] = useState("pattern");
  // State untuk warna latar belakang kanvas
  const [canvasBackground, setCanvasBackground] = useState("#ffffff");
  // Warna yang sudah 'dikonfirmasi' (debounced) — hanya ini yang masuk history
  const [committedBg, setCommittedBg] = useState("#ffffff");
  const bgDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Refs for undo/redo functions to avoid stale closures
  const undoBrushRef = useRef<() => void>(() => {});
  const redoBrushRef = useRef<() => void>(() => {});
  const undoPatternRef = useRef<() => void>(() => {});
  const redoPatternRef = useRef<() => void>(() => {});

  // Unified action stack — track urutan aksi (pattern/brush/bgcolor) untuk undo/redo berurutan
  const actionStackRef = useRef<("pattern" | "brush" | "bgcolor")[]>([]);
  const redoStackRef = useRef<("pattern" | "brush" | "bgcolor")[]>([]);
  const bgColorHistoryRef = useRef<string[]>(["#ffffff"]);
  const bgColorHistoryIndexRef = useRef<number>(0);
  const isInitRef = useRef(true);          // mencegah tracking saat init
  const isRecoloringRef = useRef(false);   // mencegah tracking saat recolor
  const recoloringCountRef = useRef(0);    // counter recolor async
  const undoAllRef = useRef<() => void>(() => {});
  const redoAllRef = useRef<() => void>(() => {});
  // Refs untuk auto-scroll ke layer terpilih di sidebar
  const layerItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { brushSizeRef.current = brushSize[0]; }, [brushSize]);
  useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
  useEffect(() => { brushOpacityRef.current = brushOpacity[0]; }, [brushOpacity]);

  // ─── Sync canvas background color ke Fabric (langsung, no debounce) ──────
  const isApplyingBgUndoRef = useRef(false);
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    // Terapkan warna ke kanvas seketika untuk live preview
    fc.setBackgroundColor(canvasBackground, () => {
      fc.requestRenderAll();
    });

    // Jika sedang undo/redo, jangan schedule debounce — sudah ditangani di committedBg
    if (isApplyingBgUndoRef.current) {
      isApplyingBgUndoRef.current = false;
      return;
    }

    // Jangan jadwalkan debounce saat inisialisasi awal
    if (isInitRef.current) return;

    // Debounce: baru push ke history setelah 600ms user berhenti menggeser
    if (bgDebounceTimerRef.current) clearTimeout(bgDebounceTimerRef.current);
    bgDebounceTimerRef.current = setTimeout(() => {
      setCommittedBg(canvasBackground);
    }, 600);
  }, [canvasBackground]);

  // ─── Push committed background ke history (hanya saat nilai benar-benar settle) ─
  useEffect(() => {
    if (isInitRef.current) return;
    if (isApplyingBgUndoRef.current) return;

    // Hindari double-push jika nilai sama dengan entry terakhir
    const lastEntry = bgColorHistoryRef.current[bgColorHistoryIndexRef.current];
    if (lastEntry === committedBg) return;

    // Potong redo tail, lalu push
    bgColorHistoryRef.current = bgColorHistoryRef.current.slice(0, bgColorHistoryIndexRef.current + 1);
    bgColorHistoryRef.current.push(committedBg);
    bgColorHistoryIndexRef.current = bgColorHistoryRef.current.length - 1;

    // Push ke unified action stack
    actionStackRef.current.push("bgcolor");
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [committedBg]);

  // ─── Auto-scroll ke layer terpilih di sidebar ─────────────────────────────
  useEffect(() => {
    if (!selectedLayerId) return;
    // Beri waktu sebentar agar tab switch selesai sebelum scroll
    const timer = setTimeout(() => {
      const el = layerItemRefs.current[selectedLayerId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [selectedLayerId, activeTab]);

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
    // Skip saat restoring ATAU saat recoloring (recolor bukan aksi user)
    if (!fc || isRestoringRef.current || isRecoloringRef.current) return;

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

    setPatternHistoryIndex(historyIndexRef.current);
    setPatternHistoryLength(historyRef.current.length);

    // Update unified action stack (skip saat init)
    if (!isInitRef.current) {
      actionStackRef.current.push("pattern");
      redoStackRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
    }
  }, []);

  // ─── Simpan snapshot offscreen (untuk brush/eraser) ───────────────────────
  const saveOffscreenSnapshot = useCallback(() => {
    const offscreen = offscreenRef.current;
    if (!offscreen) return;
    const ctx = offscreen.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, 800, 600);

    offscreenHistoryRef.current = offscreenHistoryRef.current.slice(
      0,
      offscreenHistoryIndexRef.current + 1
    );
    offscreenHistoryRef.current.push(imageData);
    offscreenHistoryIndexRef.current = offscreenHistoryRef.current.length - 1;

    if (offscreenHistoryRef.current.length > 50) {
      offscreenHistoryRef.current.shift();
      offscreenHistoryIndexRef.current--;
    }

    // Hanya update historyIndex untuk offscreen — TIDAK campur dengan Fabric
    setHistoryIndex(offscreenHistoryIndexRef.current);
    setHistoryLength(offscreenHistoryRef.current.length);

    // Update unified action stack (skip saat init)
    if (!isInitRef.current) {
      actionStackRef.current.push("brush");
      redoStackRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
    }
  }, []);



  // ─── Restore Fabric snapshot (untuk pattern) ──────────────────────────────
  const restoreSnapshot = useCallback((index: number) => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    isRestoringRef.current = true;
    const json = historyRef.current[index];

    fc.loadFromJSON(JSON.parse(json), () => {
      fc.renderAll();
      isRestoringRef.current = false;

      // Sync React state dengan background color dari canvas yang diload
      const currentBg = fc.backgroundColor;
      if (typeof currentBg === "string" && currentBg !== canvasBackground) {
        isApplyingBgUndoRef.current = true;
        setCanvasBackground(currentBg);
      }

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
  }, [canvasBackground]);

  // ─── Undo/Redo untuk brush/eraser offscreen ───────────────────────────
  const undoBrush = useCallback(() => {
    if (offscreenHistoryIndexRef.current <= 0) return;
    offscreenHistoryIndexRef.current--;

    const offscreen = offscreenRef.current!;
    const ctx = offscreen.getContext("2d")!;
    ctx.clearRect(0, 0, 800, 600);
    ctx.putImageData(
      offscreenHistoryRef.current[offscreenHistoryIndexRef.current],
      0,
      0
    );
    syncDisplay();
    setHasOffscreenContent(checkOffscreenHasContent());
    setHistoryIndex(offscreenHistoryIndexRef.current);
  }, [syncDisplay]);

  const redoBrush = useCallback(() => {
    if (
      offscreenHistoryIndexRef.current >=
      offscreenHistoryRef.current.length - 1
    )
      return;
    offscreenHistoryIndexRef.current++;

    const offscreen = offscreenRef.current!;
    const ctx = offscreen.getContext("2d")!;
    ctx.clearRect(0, 0, 800, 600);
    ctx.putImageData(
      offscreenHistoryRef.current[offscreenHistoryIndexRef.current],
      0,
      0
    );
    syncDisplay();
    setHasOffscreenContent(checkOffscreenHasContent());
    setHistoryIndex(offscreenHistoryIndexRef.current);
  }, [syncDisplay]);

  // ─── Undo/Redo untuk pattern Fabric ───────────────────────────
  const undoPattern = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    restoreSnapshot(historyIndexRef.current);
    setPatternHistoryIndex(historyIndexRef.current);
  }, [restoreSnapshot]);

  const redoPattern = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    restoreSnapshot(historyIndexRef.current);
    setPatternHistoryIndex(historyIndexRef.current);
  }, [restoreSnapshot]);

  // ─── Unified undo/redo — memperhatikan urutan aksi yang sebenarnya ──────────
  const undoAll = useCallback(() => {
    if (actionStackRef.current.length === 0) return;
    const actionType = actionStackRef.current[actionStackRef.current.length - 1];
    // Cek apakah ada sesuatu yang bisa di-undo untuk tipe ini
    if (actionType === "pattern" && historyIndexRef.current <= 0) {
      actionStackRef.current.pop(); // buang entry stale
      return;
    }
    if (actionType === "brush" && offscreenHistoryIndexRef.current <= 0) {
      actionStackRef.current.pop();
      return;
    }
    if (actionType === "bgcolor" && bgColorHistoryIndexRef.current <= 0) {
      actionStackRef.current.pop();
      return;
    }
    actionStackRef.current.pop();
    redoStackRef.current.push(actionType);
    if (actionType === "pattern") {
      historyIndexRef.current--;
      restoreSnapshot(historyIndexRef.current);
      setPatternHistoryIndex(historyIndexRef.current);
    } else if (actionType === "bgcolor") {
      isApplyingBgUndoRef.current = true;
      bgColorHistoryIndexRef.current--;
      const prevColor = bgColorHistoryRef.current[bgColorHistoryIndexRef.current];
      // Update committed state dulu (skip push ke history lewat flag)
      setCommittedBg(prevColor);
      setCanvasBackground(prevColor);
    } else {
      offscreenHistoryIndexRef.current--;
      const offscreen = offscreenRef.current!;
      const ctx = offscreen.getContext("2d")!;
      ctx.clearRect(0, 0, 800, 600);
      ctx.putImageData(offscreenHistoryRef.current[offscreenHistoryIndexRef.current], 0, 0);
      syncDisplay();
      setHasOffscreenContent(checkOffscreenHasContent());
      setHistoryIndex(offscreenHistoryIndexRef.current);
    }
    setCanUndo(actionStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, [restoreSnapshot, syncDisplay]);

  const redoAll = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const actionType = redoStackRef.current.pop()!;
    actionStackRef.current.push(actionType);
    if (actionType === "pattern") {
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current++;
        restoreSnapshot(historyIndexRef.current);
        setPatternHistoryIndex(historyIndexRef.current);
      }
    } else if (actionType === "bgcolor") {
      if (bgColorHistoryIndexRef.current < bgColorHistoryRef.current.length - 1) {
        isApplyingBgUndoRef.current = true;
        bgColorHistoryIndexRef.current++;
        const nextColor = bgColorHistoryRef.current[bgColorHistoryIndexRef.current];
        setCommittedBg(nextColor);
        setCanvasBackground(nextColor);
      }
    } else {
      if (offscreenHistoryIndexRef.current < offscreenHistoryRef.current.length - 1) {
        offscreenHistoryIndexRef.current++;
        const offscreen = offscreenRef.current!;
        const ctx = offscreen.getContext("2d")!;
        ctx.clearRect(0, 0, 800, 600);
        ctx.putImageData(offscreenHistoryRef.current[offscreenHistoryIndexRef.current], 0, 0);
        syncDisplay();
        setHasOffscreenContent(checkOffscreenHasContent());
        setHistoryIndex(offscreenHistoryIndexRef.current);
      }
    }
    setCanUndo(actionStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, [restoreSnapshot, syncDisplay]);

  // Sync undo/redo refs to avoid stale closures
  useEffect(() => { undoBrushRef.current = undoBrush; }, [undoBrush]);
  useEffect(() => { redoBrushRef.current = redoBrush; }, [redoBrush]);
  useEffect(() => { undoPatternRef.current = undoPattern; }, [undoPattern]);
  useEffect(() => { redoPatternRef.current = redoPattern; }, [redoPattern]);
  useEffect(() => { undoAllRef.current = undoAll; }, [undoAll]);
  useEffect(() => { redoAllRef.current = redoAll; }, [redoAll]);

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
      targetFindTolerance: 10,
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
    });

    canvas.on("object:selected", (e) => {
      const target = (e as any).target;
      if (target?.data?.layerId) {
        setSelectedLayerId(target.data.layerId);
        // Auto-switch ke tab Layer dan scroll ke layer tersebut
        setActiveTab("layer");
        
        // Auto-sync selection color preset to sidebar
        if (target.data.colorPresetName) {
          const foundPreset = colorPresets.find((p) => p.name === target.data.colorPresetName);
          if (foundPreset) {
            setSelectedPreset(foundPreset);
          }
        }
      }
    });
    // selection:updated terjadi ketika user pindah klik dari satu objek ke objek lain
    canvas.on("selection:updated", (e) => {
      const target = (e as any).target;
      if (target?.data?.layerId) {
        setSelectedLayerId(target.data.layerId);
        setActiveTab("layer");
        if (target.data.colorPresetName) {
          const foundPreset = colorPresets.find((p) => p.name === target.data.colorPresetName);
          if (foundPreset) {
            setSelectedPreset(foundPreset);
          }
        }
      }
    });
    canvas.on("selection:cleared", () => {
      setSelectedLayerId(null);
    });

    canvas.on("object:modified", () => saveSnapshot());
    canvas.on("object:removed", () => saveSnapshot());

    // Keyboard handler pakai REF — tidak pernah stale
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoAllRef.current(); // unified undo — menghormati urutan aksi
      }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redoAllRef.current(); // unified redo
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
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    saveSnapshot();
    saveOffscreenSnapshot();
    
    // Set initial size & zoom
    if (containerRef.current && displayCanvasRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      canvas.setWidth(containerWidth);
      canvas.setHeight(containerWidth * 0.75);
      canvas.setZoom(containerWidth / 800);
      
      displayCanvasRef.current.style.width = `${containerWidth}px`;
      displayCanvasRef.current.style.height = `${containerWidth * 0.75}px`;
    }

    // Aktifkan action tracking setelah init selesai
    isInitRef.current = false;

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      canvas.dispose();
    };
  }, [saveSnapshot, saveOffscreenSnapshot]);

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
    const fabricEl = canvas?.getElement()?.parentElement; // wrapper div Fabric
    if (!canvas || !display) return;

    if (activeTool === "select") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.evented = true;
      });
      canvas.renderAll();

      // Display canvas di atas Fabric dengan pointer-events: none agar tetap terlihat tetapi click-through
      display.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none !important;
        z-index: 2;
      `;

      // Pastikan Fabric canvas wrapper di atas
      if (fabricEl) {
        (fabricEl as HTMLElement).style.zIndex = "1";
        (fabricEl as HTMLElement).style.position = "absolute";
        (fabricEl as HTMLElement).style.top = "0";
        (fabricEl as HTMLElement).style.left = "0";
      }
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.forEachObject((obj) => {
        obj.evented = false;
      });
      canvas.renderAll();

      // Display canvas di ATAS untuk brush/eraser
      display.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: auto !important;
        z-index: 2;
      `;

      if (fabricEl) {
        (fabricEl as HTMLElement).style.zIndex = "1";
        (fabricEl as HTMLElement).style.position = "absolute";
        (fabricEl as HTMLElement).style.top = "0";
        (fabricEl as HTMLElement).style.left = "0";
      }

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

  const renderPatternSVGString = useCallback((pattern: BatikItem) => {
    // Prioritaskan SVG asli jika ada di mapping dan recolor sesuai preset
    if (pattern.style_type && batikSvgMap[pattern.style_type]) {
      return recolorSVG(batikSvgMap[pattern.style_type], selectedPreset);
    }

    // Fallback ke template lama jika tidak ada SVG asli
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
  }, [selectedPreset]);

  const renderMiniPattern = useCallback((pattern: BatikItem, presetName?: string) => {
    const preset = presetName ? colorPresets.find(p => p.name === presetName) || selectedPreset : selectedPreset;

    // Jika ada SVG asli, gunakan sebagai preview dengan scale down dan recolor
    if (pattern.style_type && batikSvgMap[pattern.style_type]) {
      const svgString = recolorSVG(batikSvgMap[pattern.style_type], preset);
      return (
        <div 
          className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
          dangerouslySetInnerHTML={{ __html: svgString }} 
        />
      );
    }

    // Fallback ke template lama
    const id = `mini-${pattern.id}`;
    return (
      <div className="w-full h-full">
        <svg width="100%" height="100%" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#FAF8F5" width="20" height="20" />
          {(pattern.style_type === "parang" || pattern.style_type === "traditional" || pattern.style_type === "diagonal-lines") && (
            <path d="M0,10 Q5,5 10,10 Q15,15 20,10" stroke={preset.colors.primary} strokeWidth="1.5" fill="none" />
          )}
          {(pattern.style_type === "kawung" || pattern.style_type === "circles") && (
            <g fill="none" stroke={preset.colors.primary} strokeWidth="1">
              <circle cx="10" cy="6" r="4" />
              <circle cx="10" cy="14" r="4" />
            </g>
          )}
          {(pattern.style_type === "mega" || pattern.style_type === "clouds" || pattern.style_type === "regional") && (
            <path d="M0,10 Q5,4 10,10 Q15,16 20,10" stroke={preset.colors.primary} strokeWidth="2" fill="none" />
          )}
          {(pattern.style_type === "truntum" || pattern.style_type === "stars") && (
            <polygon points="10,3 12,8 17,8 13,11 15,16 10,13 5,16 7,11 3,8 8,8" fill={preset.colors.primary} />
          )}
          {(pattern.style_type === "sekar" || pattern.style_type === "flowers") && (
            <g>
              <circle cx="10" cy="10" r="2.5" fill={preset.colors.secondary} />
              <circle cx="10" cy="4" r="3" fill={preset.colors.primary} opacity="0.8" />
              <circle cx="16" cy="10" r="3" fill={preset.colors.primary} opacity="0.8" />
              <circle cx="10" cy="16" r="3" fill={preset.colors.primary} opacity="0.8" />
              <circle cx="4" cy="10" r="3" fill={preset.colors.primary} opacity="0.8" />
            </g>
          )}
        </svg>
      </div>
    );
  }, [selectedPreset]);

  // ─── Add pattern to canvas ───────────────────────────────────────────────────
  const addItemToCanvas = useCallback((pattern: BatikItem) => {
    if (!fabricCanvasRef.current) return;
    const svg = renderPatternSVGString(pattern);
    const fc = fabricCanvasRef.current;

    // ── SVG → Blob URL → HTML canvas → PNG → fabric.Image ──
    // data: URL tidak cocok untuk SVG besar (35KB+) karena browser gagal render.
    // Blob URL + canvas pre-render menghasilkan PNG bersih yang selalu bisa di-klik.
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const htmlImg = new Image();

    htmlImg.onload = () => {
      // Gunakan naturalWidth/Height dari SVG, fallback ke 554 (parang_batik default)
      const svgW = htmlImg.naturalWidth || 554;
      const svgH = htmlImg.naturalHeight || 554;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = svgW;
      tempCanvas.height = svgH;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(htmlImg, 0, 0, svgW, svgH);
      URL.revokeObjectURL(blobUrl);

      const pngUrl = tempCanvas.toDataURL('image/png');

      fabric.Image.fromURL(pngUrl, (img) => {
        const rawW = img.width ?? svgW;
        const rawH = img.height ?? svgH;
        const maxSize = 280;
        const scale = rawW > 0 && rawH > 0
          ? Math.min(maxSize / rawW, maxSize / rawH, 1)
          : 1;

        img.set({
          left: 80,
          top: 60,
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          perPixelTargetFind: false,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false,
          lockUniScaling: false,
          objectCaching: false,
        });
        img.setCoords();

        const newLayerId = Date.now().toString();
        (img as any).data = {
          layerId: newLayerId,
          patternId: pattern.id,
          layerName: pattern.name || 'Motif',
          styleType: pattern.style_type,
          colorPresetName: selectedPreset.name,
          originalSvg:
            pattern.style_type && batikSvgMap[pattern.style_type]
              ? batikSvgMap[pattern.style_type]
              : null,
        };

        fc.add(img);
        img.setCoords();
        fc.setActiveObject(img);
        fc.requestRenderAll();

        setLayers((prev) => [
          ...prev,
          {
            id: newLayerId,
            type: 'pattern',
            name: pattern.name || 'Motif',
            visible: true,
            locked: false,
            fabricObject: img,
          },
        ]);
        setSelectedLayerId(newLayerId);
        // Auto-switch ke tab Layer agar user bisa lihat layer baru
        setActiveTab("layer");
        saveSnapshot();
      });
    };

    htmlImg.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      toast.error('Gagal memuat motif SVG');
    };

    htmlImg.src = blobUrl;
  }, [saveSnapshot, renderPatternSVGString]);

  // ─── Recolor active pattern ketika preset berubah ───────────────────────────
  const recolorActiveObject = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (!activeObj) return;

    const data = (activeObj as any).data;
    // Skip update jika presetnya sudah sama agar tidak render berulang
    if (data.colorPresetName === selectedPreset.name) return;

    let recoloredSvg = "";
    if (data.originalSvg) {
      recoloredSvg = recolorSVG(data.originalSvg, selectedPreset);
    } else {
      const pattern = patterns.find(p => p.id === data.patternId);
      if (!pattern) return;
      recoloredSvg = renderPatternSVGString(pattern);
    }

    // Blob URL → canvas → PNG untuk recolor (sama seperti addItemToCanvas)
    const blob = new Blob([recoloredSvg], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const htmlImg = new Image();

    htmlImg.onload = () => {
      const svgW = htmlImg.naturalWidth || 554;
      const svgH = htmlImg.naturalHeight || 554;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = svgW;
      tempCanvas.height = svgH;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(htmlImg, 0, 0, svgW, svgH);
      URL.revokeObjectURL(blobUrl);

      const pngUrl = tempCanvas.toDataURL('image/png');

      // Update image source in-place
      (activeObj as fabric.Image).setSrc(pngUrl, () => {
        data.colorPresetName = selectedPreset.name;
        activeObj.setCoords();
        fabricCanvasRef.current?.requestRenderAll();
        // Update layers list to reflect the new color in the sidebar
        setLayers((prev) => [...prev]);
        saveSnapshot();
      });
    };

    htmlImg.onerror = () => {
      URL.revokeObjectURL(blobUrl);
    };

    htmlImg.src = blobUrl;
  }, [selectedPreset, saveSnapshot, renderPatternSVGString, patterns]);

  // Jalankan recolor ketika preset berubah
  useEffect(() => {
    recolorActiveObject();
  }, [selectedPreset, recolorActiveObject]);

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

  const moveLayer = useCallback((layerId: string, direction: "up" | "down") => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const index = layers.findIndex((l) => l.id === layerId);
    if (index === -1) return;

    const layer = layers[index];
    if (!layer.fabricObject) return;

    if (direction === "up") {
      fc.bringForward(layer.fabricObject);
      if (index === layers.length - 1) {
        fc.renderAll();
        return;
      }
      const newLayers = [...layers];
      const temp = newLayers[index];
      newLayers[index] = newLayers[index + 1];
      newLayers[index + 1] = temp;
      setLayers(newLayers);
    } else {
      fc.sendBackwards(layer.fabricObject);
      if (index === 0) {
        fc.renderAll();
        return;
      }
      const newLayers = [...layers];
      const temp = newLayers[index];
      newLayers[index] = newLayers[index - 1];
      newLayers[index - 1] = temp;
      setLayers(newLayers);
    }
    fc.renderAll();
    saveSnapshot();
  }, [layers, saveSnapshot]);

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
    // Tandai sebagai init agar remove tidak push ke action stack
    isInitRef.current = true;
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
    // Reset unified action stacks juga
    actionStackRef.current = [];
    redoStackRef.current = [];
    // Reset background color state & history
    if (bgDebounceTimerRef.current) clearTimeout(bgDebounceTimerRef.current);
    isApplyingBgUndoRef.current = true;
    setCanvasBackground("#ffffff");
    setCommittedBg("#ffffff");
    bgColorHistoryRef.current = ["#ffffff"];
    bgColorHistoryIndexRef.current = 0;
    // Save new initial snapshots (isInitRef masih true, tidak masuk action stack)
    saveSnapshot();
    saveOffscreenSnapshot();
    isInitRef.current = false;
    // Reset state
    setLayers([]);
    setSelectedLayerId(null);
    setHasOffscreenContent(false);
    setCanUndo(false);
    setCanRedo(false);
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
              <div className="px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between" style={{ background: "linear-gradient(to bottom, #FDFCFB, #F9F6F2)", borderBottom: "1px solid rgba(139,111,71,0.1)" }}>
                {/* Top Row on Mobile / Single Row on Desktop */}
                <div className="flex items-center justify-between gap-3 w-full md:w-auto">
                  {/* Left: Tool switcher */}
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(139,111,71,0.07)", border: "1px solid rgba(139,111,71,0.1)" }}>
                    {([
                      { tool: "select" as Tool, icon: ZoomOut, label: "Pilih" },
                      { tool: "brush" as Tool, icon: Brush, label: "Kuas" },
                      { tool: "eraser" as Tool, icon: Eraser, label: "Hapus" },
                    ] as const).map(({ tool, icon: Icon, label }) => (
                      <button key={tool}
                        onClick={() => setActiveTool(tool)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-xs font-semibold"
                        style={{
                          background: activeTool === tool ? "#FFFFFF" : "transparent",
                          color: activeTool === tool ? "#8B6F47" : "#9E8E82",
                          boxShadow: activeTool === tool ? "0 1px 4px rgba(61,43,31,0.12)" : "none",
                        }}
                        title={label}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Actions for mobile (hidden on desktop) */}
                  <div className="flex items-center gap-1.5 md:hidden">
                    {/* Canvas background color picker */}
                    <div className="relative flex-shrink-0" title="Warna latar belakang kanvas">
                      <div style={{ padding: "3px", background: "#FFFFFF", border: "1px solid rgba(139,111,71,0.15)", borderRadius: "8px", flexShrink: 0 }}>
                        <input
                          type="color"
                          value={canvasBackground}
                          onChange={(e) => setCanvasBackground(e.target.value)}
                          className="w-5 h-5 rounded-md cursor-pointer border-0 p-0 bg-transparent block [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md"
                          title="Ubah warna latar kanvas"
                        />
                      </div>
                    </div>

                    <div className="w-px h-5 flex-shrink-0" style={{ background: "rgba(139,111,71,0.12)" }} />

                    {/* Undo / Redo */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/50 border" style={{ borderColor: "rgba(139,111,71,0.1)" }}>
                      <button
                        onClick={undoAll}
                        disabled={!canUndo}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white"
                        style={{ color: "#8B6F47" }}
                        title="Undo (Ctrl+Z)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={redoAll}
                        disabled={!canRedo}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white"
                        style={{ color: "#8B6F47" }}
                        title="Redo (Ctrl+Y)"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Clear */}
                    <button
                      onClick={clearAll}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50"
                      style={{ color: "#dc2626", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.1)" }}
                      title="Bersihkan kanvas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Save / Download on mobile */}
                    {activeTool === "select" && (
                      <>
                        <div className="w-px h-5 flex-shrink-0" style={{ background: "rgba(139,111,71,0.12)" }} />
                        <button onClick={saveDesign} disabled={isSaving}
                          className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors disabled:opacity-50 hover:bg-[#F5F0EB]"
                          style={{ color: "#8B6F47", background: "rgba(139,111,71,0.06)", border: "1px solid rgba(139,111,71,0.12)" }}
                          title="Simpan"
                        >
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={downloadDesign}
                          className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors text-white hover:opacity-90"
                          style={{ background: "linear-gradient(135deg, #8B6F47 0%, #A88967 100%)", boxShadow: "0 2px 8px rgba(139,111,71,0.3)" }}
                          title="Unduh"
                        >
                          {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Center: Brush/Eraser controls */}
                {activeTool !== "select" && (
                  <div className="flex items-center gap-2 flex-1 min-w-0 px-2.5 py-1.5 rounded-xl w-full md:w-auto overflow-hidden" style={{ background: "rgba(139,111,71,0.04)", border: "1px solid rgba(139,111,71,0.08)" }}>
                    {activeTool === "brush" && (
                      <>
                        {/* Color picker */}
                        <div style={{ padding: "3px", background: "#FFFFFF", border: "1px solid rgba(139,111,71,0.15)", borderRadius: "8px", flexShrink: 0 }}>
                          <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-5 h-5 rounded-md cursor-pointer border-0 p-0 bg-transparent block [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md" title="Warna kuas" />
                        </div>
                        {/* Quick swatches */}
                        <div className="flex gap-0.5 flex-shrink-0">
                          {["#8B6F47", "#D4B88B", "#3D2B1F", "#6B3A1F", "#2A4B7C", "#2D5A2D", "#8B2A2A"].map((c, idx) => (
                            <button key={idx} onClick={() => setBrushColor(c)}
                              className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                              style={{ background: c, borderColor: brushColor === c ? "#3D2B1F" : "transparent" }}
                            />
                          ))}
                        </div>
                        <div className="w-px h-4 flex-shrink-0" style={{ background: "rgba(139,111,71,0.2)" }} />
                      </>
                    )}

                    {/* Size */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Minus className="w-3 h-3 flex-shrink-0" style={{ color: "#B8A898" }} />
                      <input type="range" min="2" max="80" step="2" value={brushSize[0]} onChange={(e) => setBrushSize([Number(e.target.value)])}
                        className="w-14 sm:w-20 h-1.5 rounded-full appearance-none cursor-pointer flex-shrink-0"
                        style={{ accentColor: "#8B6F47", background: "rgba(139,111,71,0.2)" }}
                        title="Ukuran kuas" />
                      <Plus className="w-3 h-3 flex-shrink-0" style={{ color: "#B8A898" }} />
                      <span className="text-xs font-bold w-6 text-right flex-shrink-0" style={{ color: "#3D2B1F" }}>{brushSize[0]}</span>
                    </div>

                    {/* Opacity */}
                    {activeTool === "brush" && (
                      <>
                        <div className="w-px h-4 flex-shrink-0" style={{ background: "rgba(139,111,71,0.2)" }} />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[9px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: "#B8A898" }}>Op</span>
                          <input type="range" min="5" max="100" step="5" value={brushOpacity[0]} onChange={(e) => setBrushOpacity([Number(e.target.value)])}
                            className="w-10 sm:w-16 h-1.5 rounded-full appearance-none cursor-pointer flex-shrink-0"
                            style={{ accentColor: "#8B6F47", background: "rgba(139,111,71,0.2)" }}
                            title="Opasitas" />
                          <span className="text-xs font-bold w-6 text-right flex-shrink-0" style={{ color: "#3D2B1F" }}>{brushOpacity[0]}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Right: Actions on Desktop */}
                <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
                  {/* Canvas background color picker */}
                  <div className="relative flex-shrink-0" title="Warna latar belakang kanvas">
                    <div style={{ padding: "3px", background: "#FFFFFF", border: "1px solid rgba(139,111,71,0.15)", borderRadius: "8px", flexShrink: 0 }}>
                      <input
                        type="color"
                        value={canvasBackground}
                        onChange={(e) => setCanvasBackground(e.target.value)}
                        className="w-5 h-5 rounded-md cursor-pointer border-0 p-0 bg-transparent block [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md"
                        title="Ubah warna latar kanvas"
                      />
                    </div>
                  </div>

                  <div className="w-px h-5 flex-shrink-0" style={{ background: "rgba(139,111,71,0.12)" }} />

                  {/* Undo / Redo */}
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(139,111,71,0.05)", border: "1px solid rgba(139,111,71,0.08)" }}>
                    <button
                      onClick={undoAll}
                      disabled={!canUndo}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white"
                      style={{ color: "#8B6F47" }}
                      title="Undo (Ctrl+Z)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={redoAll}
                      disabled={!canRedo}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white"
                      style={{ color: "#8B6F47" }}
                      title="Redo (Ctrl+Y)"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Clear */}
                  <button
                    onClick={clearAll}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50"
                    style={{ color: "#dc2626", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.1)" }}
                    title="Bersihkan kanvas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Separator + Save/Download — only in select mode */}
                  {activeTool === "select" && (
                    <>
                      <div className="w-px h-7 flex-shrink-0" style={{ background: "rgba(139,111,71,0.12)" }} />
                      <button onClick={saveDesign} disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-xl transition-colors text-xs font-semibold disabled:opacity-50 hover:bg-[#F5F0EB]"
                        style={{ color: "#8B6F47", background: "rgba(139,111,71,0.06)", border: "1px solid rgba(139,111,71,0.12)" }}
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Simpan</span>
                      </button>
                      <button onClick={downloadDesign}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-xl transition-colors text-xs font-semibold text-white hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #8B6F47 0%, #A88967 100%)", boxShadow: "0 2px 8px rgba(139,111,71,0.3)" }}
                      >
                        {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Unduh</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Canvas area */}
              <div ref={containerRef} className="aspect-[4/3] relative overflow-hidden select-none" style={{ background: canvasBackground }}>
                {/* Layer 1: Display canvas untuk brush/eraser */}
                <canvas
                  ref={displayCanvasRef}
                  width={800}
                  height={600}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    zIndex: 0,
                    width: "100%",
                    height: "100%",
                  }}
                />

                {/* Layer 2: Fabric canvas — di atas saat select, di bawah saat brush */}
                <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} />

                {layers.length === 0 && !hasOffscreenContent && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ color: "#A89B8F", zIndex: 3 }}>
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
            <div 
              className="rounded-3xl shadow-lg overflow-hidden border" 
              style={{ borderColor: "rgba(139,111,71,0.12)", background: "#FFFFFF" }}>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="p-5 pb-3 border-b" style={{ borderColor: "rgba(139,111,71,0.08)", background: "linear-gradient(to bottom, #FAF8F5, #FFFFFF)" }}>
                  <TabsList className="grid w-full grid-cols-3 p-1 rounded-2xl !h-auto !w-full" style={{ background: "rgba(139,111,71,0.06)" }}>
                    <TabsTrigger value="pattern" className="flex items-center justify-center gap-1.5 rounded-xl !h-auto py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#8B6F47] text-[#7A6B5E]" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      <Plus className="w-3.5 h-3.5" /> Motif
                    </TabsTrigger>
                    <TabsTrigger value="color" className="flex items-center justify-center gap-1.5 rounded-xl !h-auto py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#8B6F47] text-[#7A6B5E]" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      <Palette className="w-3.5 h-3.5" /> Preset
                    </TabsTrigger>
                    <TabsTrigger value="layer" className="flex items-center justify-center gap-1.5 rounded-xl !h-auto py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#8B6F47] text-[#7A6B5E]" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      <Layers className="w-3.5 h-3.5" /> Layer
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab: Tambah Motif */}
                <TabsContent value="pattern" className="p-5 m-0 max-h-[500px] overflow-y-auto" style={{ background: "#FFFFFF" }}>
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Palette className="w-4 h-4 text-[#8B6F47]" />
                    <p style={{ color: "#7A6B5E", fontSize: "0.8rem", fontWeight: 500 }}>Pilih motif untuk diletakkan di kanvas:</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pr-1">
                    {loading ? (
                      [...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
                    ) : (
                      patterns.map((pattern) => (
                        <button 
                          key={pattern.id + "-" + selectedPreset.name} 
                          onClick={() => addItemToCanvas(pattern)}
                          className="p-3.5 rounded-2xl border transition-all duration-200 text-left flex flex-col items-stretch cursor-pointer bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#8B6F47]/40 hover:shadow-sm group"
                          style={{ 
                            borderColor: "rgba(139,111,71,0.12)"
                          }}
                        >
                          <div className="w-full aspect-square rounded-xl mb-3 overflow-hidden flex items-center justify-center p-2 transition-all bg-[#FAF8F5] group-hover:bg-[#FFFFFF] border" 
                            style={{ 
                              borderColor: "rgba(139,111,71,0.06)",
                              boxShadow: "inset 0 1px 3px rgba(139,111,71,0.02)" 
                            }}>
                            {renderMiniPattern(pattern)}
                          </div>
                          <div style={{ color: "#3D2B1F", fontSize: "0.85rem", fontWeight: 700, marginBottom: "2px" }} className="group-hover:text-[#8B6F47] transition-colors">
                            {pattern.name}
                          </div>
                          <div style={{ color: "#8E7F72", fontSize: "0.725rem", lineHeight: 1.4, flex: 1 }} className="line-clamp-2">
                            {pattern.description}
                          </div>
                          <div className="mt-2 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 text-[#8B6F47]">
                            <Plus className="w-3 h-3" /> Tambah
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* Tab: Preset Warna */}
                <TabsContent value="color" className="p-5 m-0 max-h-[500px] overflow-y-auto" style={{ background: "#FFFFFF" }}>
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Palette className="w-4 h-4 text-[#8B6F47]" />
                    <p style={{ color: "#7A6B5E", fontSize: "0.8rem", fontWeight: 500 }}>Pilih palet warna (klik motif di kanvas dulu):</p>
                  </div>
                  
                  <div className="space-y-3 pr-1">
                    {colorPresets.map((preset, i) => {
                      const isActive = selectedPreset.name === preset.name;
                      return (
                        <button 
                          key={i} 
                          onClick={() => setSelectedPreset(preset)}
                          className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                            isActive 
                              ? "bg-[rgba(139,111,71,0.06)] border-[#8B6F47] border-2 shadow-sm" 
                              : "bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#8B6F47]/30 border border-[rgba(139,111,71,0.12)] hover:shadow-sm"
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div style={{ color: "#3D2B1F", fontSize: "0.875rem", fontWeight: 700, marginBottom: "2px" }}>
                              {preset.name}
                            </div>
                            <div style={{ color: "#8E7F72", fontSize: "0.725rem" }}>
                              Preset warna motif batik
                            </div>
                          </div>
                          <div className="flex gap-1.5 p-1.5 rounded-xl bg-white/70 border" style={{ borderColor: "rgba(139,111,71,0.08)" }}>
                            <div className="w-6 h-6 rounded-lg shadow-sm border border-black/5" style={{ background: preset.batik.light }} />
                            <div className="w-6 h-6 rounded-lg shadow-sm border border-black/5" style={{ background: preset.batik.mid }} />
                            <div className="w-6 h-6 rounded-lg shadow-sm border border-black/5" style={{ background: preset.batik.dark }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Tab: Layer Management */}
                <TabsContent value="layer" className="p-5 m-0 max-h-[500px] overflow-y-auto" style={{ background: "#FFFFFF" }}>
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Layers className="w-4 h-4 text-[#8B6F47]" />
                    <p style={{ color: "#7A6B5E", fontSize: "0.8rem", fontWeight: 500 }}>Kelola urutan dan visibilitas layer:</p>
                  </div>
                  
                  {layers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed" style={{ borderColor: "rgba(139,111,71,0.15)", background: "#FAF8F5" }}>
                      <Layers className="w-12 h-12 mb-3 opacity-20 text-[#8B6F47]" />
                      <p className="text-sm font-medium" style={{ color: "#8E7F72" }}>Belum ada layer motif</p>
                      <p className="text-xs opacity-70 mt-1" style={{ color: "#A89B8F" }}>Silakan tambahkan motif terlebih dahulu</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pr-1">
                      {layers.slice().reverse().map((layer, reverseIndex) => {
                        // reverseIndex: 0 adalah layer teratas secara visual (index layers.length - 1)
                        const actualIndex = layers.length - 1 - reverseIndex;
                        const isSelected = selectedLayerId === layer.id;
                        return (
                          <div 
                            key={layer.id} 
                            ref={(el) => { layerItemRefs.current[layer.id] = el; }}
                            onClick={() => {
                              if (layer.fabricObject && fabricCanvasRef.current) {
                                fabricCanvasRef.current.setActiveObject(layer.fabricObject);
                                fabricCanvasRef.current.renderAll();
                                setSelectedLayerId(layer.id);
                              }
                            }}
                            className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5 ${
                              isSelected 
                                ? "bg-[rgba(139,111,71,0.06)] border-[#8B6F47] border-2 shadow-sm" 
                                : "bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#8B6F47]/20 border border-[rgba(139,111,71,0.12)] hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1 bg-white border border-black/5">
                                <div key={layer.id + "-" + ((layer.fabricObject as any)?.data?.colorPresetName || selectedPreset.name)} className="w-full h-full">
                                  {layer.type === "pattern" ? (
                                    renderMiniPattern(
                                      patterns.find((p) => p.id === (layer.fabricObject as any)?.data?.patternId) || patterns[0],
                                      (layer.fabricObject as any)?.data?.colorPresetName
                                    )
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full">
                                      <Brush className="w-5 h-5 opacity-60" style={{ color: layer.brushColor || "#8B6F47" }} />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate" style={{ color: "#3D2B1F" }}>
                                  {layer.name}
                                </p>
                                <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "#8B6F47" }}>
                                  {layer.type === "pattern" ? "Motif" : "Gambar Bebas"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between border-t pt-2 border-black/5">
                              {/* Layer stack reordering buttons */}
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, "up"); }}
                                  disabled={actualIndex === layers.length - 1}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white border"
                                  style={{ borderColor: "rgba(139,111,71,0.1)" }}
                                  title="Pindahkan ke atas"
                                >
                                  <ArrowUp className="w-3.5 h-3.5 text-[#8B6F47]" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, "down"); }}
                                  disabled={actualIndex === 0}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white border"
                                  style={{ borderColor: "rgba(139,111,71,0.1)" }}
                                  title="Pindahkan ke bawah"
                                >
                                  <ArrowDown className="w-3.5 h-3.5 text-[#8B6F47]" />
                                </button>
                              </div>
                              
                              {/* Layer state buttons */}
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-white hover:bg-slate-100 border"
                                  style={{ borderColor: "rgba(139,111,71,0.1)" }}
                                  title={layer.visible ? "Sembunyikan layer" : "Tampilkan layer"}
                                >
                                  {layer.visible ? <Eye className="w-3.5 h-3.5 text-[#8B6F47]" /> : <EyeOff className="w-3.5 h-3.5 text-[#8B6F47]" />}
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-white hover:bg-slate-100 border"
                                  style={{ borderColor: "rgba(139,111,71,0.1)" }}
                                  title={layer.locked ? "Buka kunci" : "Kunci layer"}
                                >
                                  {layer.locked ? <Lock className="w-3.5 h-3.5 text-[#8B6F47]" /> : <Unlock className="w-3.5 h-3.5 text-[#8B6F47]" />}
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-white hover:bg-slate-100 border"
                                  style={{ borderColor: "rgba(139,111,71,0.1)" }}
                                  title="Duplikat layer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-[#8B6F47]" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); deleteSelectedLayer(); }}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-red-50 hover:bg-red-100 border"
                                  style={{ borderColor: "rgba(220,38,38,0.15)" }}
                                  title="Hapus layer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
