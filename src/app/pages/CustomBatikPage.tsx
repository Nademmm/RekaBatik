import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  ZoomIn,
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
  X,
  CheckCircle2,
  PaintBucket,
  Square,
  Circle,
  Slash,
  MousePointer2,
  Star,
  History,
  ShoppingCart,
  Package,
  Type,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BatikBackground } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { BatikItem } from "../../types/database";
import { toast } from "sonner";
import { Skeleton } from "../components/ui/skeleton";
import { fabric } from "fabric";
import { useAuth } from "../../lib/AuthContext";
import { useCart } from "../../lib/CartContext";

// Import batik SVGs
import parangBatikSvg from "../../assets/batik-svgs/parang_batik.svg?raw";
import parangNewSvg from "../../assets/batik-svgs/parang.svg?raw";
import megaMendungNewSvg from "../../assets/batik-svgs/mega_mendung.svg?raw";
import bunga1Svg from "../../assets/batik-svgs/bunga1.svg?raw";
import bunga2Svg from "../../assets/batik-svgs/bunga2.svg?raw";
import ceplokSvg from "../../assets/batik-svgs/ceplok.svg?raw";
import sidomuktiSvg from "../../assets/batik-svgs/sidomukti.svg?raw";
import bunga3Svg from "../../assets/batik-svgs/bunga3.svg?raw";
import tiesSvg from "../../assets/batik-svgs/ties.svg?raw";
import terataiSvg from "../../assets/batik-svgs/teratai.svg?raw";
import urangSvg from "../../assets/batik-svgs/urang.svg?raw";
import iwakSvg from "../../assets/batik-svgs/iwak.svg?raw";

// Mapping style_type ke SVG
const batikSvgMap: Record<string, string> = {
  parang: parangBatikSvg,
  "parang-new": parangNewSvg,
  mega: megaMendungNewSvg,
  "sido-mukti": sidomuktiSvg,
  bunga1: bunga1Svg,
  bunga2: bunga2Svg,
  ceplok: ceplokSvg,
  bunga3: bunga3Svg,
  ties: tiesSvg,
  teratai: terataiSvg,
  urang: urangSvg,
  iwak: iwakSvg,
};

type Tool = "select" | "brush" | "eraser" | "fill" | "shape" | "text";
type ShapeType = "rect" | "circle" | "line" | "star";

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

  // Jika SVG tidak punya fill attributes (seperti parang.svg dan mega_mendung.svg),
  // tambahkan fill="#000000" ke semua path dan g elements agar bisa di-recolor:
  result = result.replace(/<path(?=[\s>])(?!.*\sfill=)/g, '<path fill="#000000"');
  result = result.replace(/<g(?=[\s>])(?!.*\sfill=)/g, '<g fill="#000000"');

  // Untuk parang_batik yang pakai 4 warna khusus:
  result = result.replace(/#f3f3f3/gi, preset.batik.background); // Latar belakang
  result = result.replace(/#a1a0a0/gi, preset.batik.light);     // Warna terang
  result = result.replace(/#5e5c5c/gi, preset.batik.mid);       // Warna sedang
  result = result.replace(/#242020/gi, preset.batik.dark);      // Warna gelap

  // Untuk bunga2.svg dan lainnya yang pakai grayscale:
  result = result.replace(/#d0d0d0/gi, preset.batik.light);     // Warna terang
  result = result.replace(/#b9b9b9/gi, preset.batik.light);     // Warna terang
  result = result.replace(/#a3a3a3/gi, preset.batik.mid);       // Warna sedang
  result = result.replace(/#8c8c8c/gi, preset.batik.mid);       // Warna sedang
  result = result.replace(/#767676/gi, preset.batik.dark);      // Warna gelap
  result = result.replace(/#606060/gi, preset.batik.dark);      // Warna gelap
  result = result.replace(/#494949/gi, preset.batik.dark);      // Warna gelap
  result = result.replace(/#333333/gi, preset.batik.dark);      // Warna gelap

  // Untuk parang.svg dan mega_mendung.svg:
  result = result.replace(/#000000/gi, preset.colors.primary); // Hitam diganti warna utama
  result = result.replace(/#caac47/gi, preset.colors.secondary); // Kuning diganti warna sekunder

  return result;
};

// Helper function to convert hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Helper function to convert RGB to hex
const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
};

// Generate color shades from primary color
const generatePresetFromPrimary = (primaryColor: string) => {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) return colorPresets[0];

  // Generate light, mid, dark shades
  const light = rgbToHex(rgb.r + 60, rgb.g + 60, rgb.b + 60);
  const mid = primaryColor;
  const dark = rgbToHex(rgb.r - 50, rgb.g - 50, rgb.b - 50);

  return {
    name: "Custom",
    colors: { primary: mid, secondary: light, accent: light, background: "transparent" },
    batik: { background: "#f3f3f3", light: light, mid: mid, dark: dark }
  };
};

// ─── Helper: Buat titik polygon bintang ─────────────────────────────────────
function makeStarPoints(cx: number, cy: number, numPoints: number, outerR: number, innerR: number) {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (Math.PI / numPoints) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return points;
}

export function CustomBatikPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToCart: addToCartFromContext } = useCart();

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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState<"saved" | "cart" | "order" | null>(null);
  const [showProjectModal, setShowProjectModal] = useState<"save" | "cart" | "order" | null>(null);
  const [projectInfo, setProjectInfo] = useState({ name: "", description: "", fabric: "Katun Primisima" });
  const [savedDesignId, setSavedDesignId] = useState<number | null>(null);
  const [historyIndex, setHistoryIndex] = useState(-1); // For brush
  const [historyLength, setHistoryLength] = useState(0); // For brush
  const [patternHistoryIndex, setPatternHistoryIndex] = useState(-1); // For pattern
  const [patternHistoryLength, setPatternHistoryLength] = useState(0); // For pattern
  const [hasOffscreenContent, setHasOffscreenContent] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  // State untuk preset warna yang dipilih
  const [selectedPreset, setSelectedPreset] = useState(colorPresets[0]);
  // State untuk warna custom (hanya primary)
  const [customColor, setCustomColor] = useState(colorPresets[0].colors.primary);
  // State untuk tab sidebar aktif
  const [activeTab, setActiveTab] = useState("pattern");
  // State untuk warna latar belakang kanvas
  const [canvasBackground, setCanvasBackground] = useState("#ffffff");
  // Warna yang sudah 'dikonfirmasi' (debounced) — hanya ini yang masuk history
  const [committedBg, setCommittedBg] = useState("#ffffff");
  const bgDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ─── Shape Tool State ────────────────────────────────────────────────────────
  const [shapeType, setShapeType] = useState<ShapeType>("rect");
  const [shapeFill, setShapeFill] = useState("#8B6F47");
  const [shapeStroke, setShapeStroke] = useState("#3D2B1F");
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2);
  const [shapeOpacity, setShapeOpacity] = useState(100);
  // ─── Text Tool State ─────────────────────────────────────────────────────
  const [textColor, setTextColor] = useState("#3D2B1F");
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("serif");
  // ─── Selected Object State ─────────────────────────────────────────────────
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<"pattern" | "shape" | "text" | null>(null);
  // ─── Zoom State ──────────────────────────────────────────────────────────────
  const [zoomLevel, setZoomLevel] = useState(100);

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
  const undoBrushRef = useRef<() => void>(() => { });
  const redoBrushRef = useRef<() => void>(() => { });
  const undoPatternRef = useRef<() => void>(() => { });
  const redoPatternRef = useRef<() => void>(() => { });

  // Unified action stack — track urutan aksi (pattern/brush/bgcolor) untuk undo/redo berurutan
  const actionStackRef = useRef<("pattern" | "brush" | "bgcolor")[]>([]);
  const redoStackRef = useRef<("pattern" | "brush" | "bgcolor")[]>([]);
  const bgColorHistoryRef = useRef<string[]>(["#ffffff"]);
  const bgColorHistoryIndexRef = useRef<number>(0);
  const isInitRef = useRef(true);          // mencegah tracking saat init
  const isRecoloringRef = useRef(false);   // mencegah tracking saat recolor
  const recoloringCountRef = useRef(0);    // counter recolor async
  const undoAllRef = useRef<() => void>(() => { });
  const redoAllRef = useRef<() => void>(() => { });
  // Refs untuk auto-scroll ke layer terpilih di sidebar
  const layerItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Ref untuk melacak apakah mousedown terakhir terjadi di dalam canvas (bukan di sidebar/UI luar)
  const lastMousedownInCanvasRef = useRef(false);
  // Refs untuk shape drawing
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const shapePreviewRef = useRef<fabric.Object | null>(null);
  const shapeTypeRef = useRef<ShapeType>("rect");
  const shapeFillRef = useRef("#8B6F47");
  const shapeStrokeRef = useRef("#3D2B1F");
  const shapeStrokeWidthRef = useRef(2);
  const shapeOpacityRef = useRef(100);
  const textColorRef = useRef("#3D2B1F");
  const fontSizeRef = useRef(32);
  const fontFamilyRef = useRef("serif");
  // Refs untuk zoom & pan
  const zoomLevelRef = useRef(100);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { shapeTypeRef.current = shapeType; }, [shapeType]);
  useEffect(() => { shapeFillRef.current = shapeFill; }, [shapeFill]);
  useEffect(() => { shapeStrokeRef.current = shapeStroke; }, [shapeStroke]);
  useEffect(() => { shapeStrokeWidthRef.current = shapeStrokeWidth; }, [shapeStrokeWidth]);
  useEffect(() => { shapeOpacityRef.current = shapeOpacity; }, [shapeOpacity]);
  useEffect(() => { brushSizeRef.current = brushSize[0]; }, [brushSize]);
  useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
  useEffect(() => { brushOpacityRef.current = brushOpacity[0]; }, [brushOpacity]);
  useEffect(() => { textColorRef.current = textColor; }, [textColor]);
  useEffect(() => { fontSizeRef.current = fontSize; }, [fontSize]);
  useEffect(() => { fontFamilyRef.current = fontFamily; }, [fontFamily]);

  // Sync state when selected object changes
  useEffect(() => {
    if (!selectedObject) return;

    // Check if it's a shape (has fill, stroke, etc.)
    if (selectedObjectType === "shape") {
      if (typeof selectedObject.fill === 'string') {
        setShapeFill(selectedObject.fill);
      }
      if (typeof selectedObject.stroke === 'string') {
        setShapeStroke(selectedObject.stroke);
      }
      if (typeof selectedObject.strokeWidth === 'number') {
        setShapeStrokeWidth(selectedObject.strokeWidth);
      }
      if (typeof selectedObject.opacity === 'number') {
        setShapeOpacity(selectedObject.opacity * 100);
      }
    }

    // Check if it's a text object
    if (selectedObjectType === "text") {
      const textObj = selectedObject as fabric.IText;
      if (typeof textObj.fill === 'string') {
        setTextColor(textObj.fill);
      }
      if (typeof textObj.fontSize === 'number') {
        setFontSize(textObj.fontSize);
      }
      if ((textObj as any).fontFamily) {
        setFontFamily((textObj as any).fontFamily);
      }
    }
  }, [selectedObject, selectedObjectType]);

  // Update selected shape when shape state changes
  useEffect(() => {
    if (!selectedObject || selectedObjectType !== "shape") {
      return;
    }

    let needsRender = false;
    const obj = selectedObject;

    if (typeof obj.fill === 'string' && obj.fill !== shapeFill) {
      obj.set("fill", shapeFill);
      needsRender = true;
    }
    if (typeof obj.stroke === 'string' && obj.stroke !== shapeStroke) {
      obj.set("stroke", shapeStroke);
      needsRender = true;
    }
    if (typeof obj.strokeWidth === 'number' && obj.strokeWidth !== shapeStrokeWidth) {
      obj.set("strokeWidth", shapeStrokeWidth);
      needsRender = true;
    }
    const targetOpacity = shapeOpacity / 100;
    if (typeof obj.opacity === 'number' && Math.abs(obj.opacity - targetOpacity) > 0.001) {
      obj.set("opacity", targetOpacity);
      needsRender = true;
    }

    if (needsRender) {
      obj.setCoords();
      fabricCanvasRef.current?.requestRenderAll();
    }
  }, [shapeFill, shapeStroke, shapeStrokeWidth, shapeOpacity, selectedObject, selectedObjectType]);

  // Update selected text when text state changes
  useEffect(() => {
    if (!selectedObject || selectedObjectType !== "text") {
      return;
    }

    const textObj = selectedObject as fabric.IText;
    let needsRender = false;

    if (typeof textObj.fill === 'string' && textObj.fill !== textColor) {
      textObj.set("fill", textColor);
      needsRender = true;
    }
    if (typeof textObj.fontSize === 'number' && textObj.fontSize !== fontSize) {
      textObj.set("fontSize", fontSize);
      needsRender = true;
    }
    if ((textObj as any).fontFamily !== fontFamily) {
      textObj.set("fontFamily", fontFamily);
      needsRender = true;
    }

    if (needsRender) {
      textObj.setCoords();
      fabricCanvasRef.current?.requestRenderAll();
    }
  }, [textColor, fontSize, fontFamily, selectedObject, selectedObjectType]);

  // ─── State untuk preview warna langsung di UI & DOM ───────────────────
  const [bgColorPickerValue, setBgColorPickerValue] = useState(canvasBackground);
  
  // ─── Ref untuk debounce update Fabric ──────────────────────────────────
  const bgFabricUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // ─── Sync bgColorPickerValue saat canvasBackground berubah (undo/redo) ────
  useEffect(() => {
    setBgColorPickerValue(canvasBackground);
  }, [canvasBackground]);
  
  // ─── Sync Fabric background hanya ketika user berhenti mengubah warna ─────
  const isApplyingBgUndoRef = useRef(false);
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    // Batalkan timer sebelumnya jika ada
    if (bgFabricUpdateTimerRef.current !== null) {
      clearTimeout(bgFabricUpdateTimerRef.current);
    }

    // Update canvasBackground state untuk download dan undo/redo
    setCanvasBackground(bgColorPickerValue);

    // Jika sedang undo/redo, update Fabric segera!
    if (isApplyingBgUndoRef.current) {
      isApplyingBgUndoRef.current = false;
      fc.setBackgroundColor(bgColorPickerValue, () => {
        fc.requestRenderAll();
      });
      return;
    }

    // Jangan jadwalkan debounce saat inisialisasi awal
    if (isInitRef.current) return;

    // Debounce: baru update Fabric dan push ke history setelah 300ms user berhenti
    bgFabricUpdateTimerRef.current = setTimeout(() => {
      fc.setBackgroundColor(bgColorPickerValue, () => {
        fc.requestRenderAll();
      });
      setCommittedBg(bgColorPickerValue);
    }, 300);
    
    // Cleanup timer saat unmount atau perubahan dependencies
    return () => {
      if (bgFabricUpdateTimerRef.current !== null) {
        clearTimeout(bgFabricUpdateTimerRef.current);
      }
    };
  }, [bgColorPickerValue]);
  
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

  // ─── Init offscreen canvas (sekali saja) ──────────────────────────────────
  useEffect(() => {
    const offscreen = document.createElement("canvas");
    offscreen.width = 800;
    offscreen.height = 600;
    offscreenRef.current = offscreen;
    // Save initial empty ImageData
    const ctx = offscreen.getContext("2d")!;
    initialOffscreenImageDataRef.current = ctx.getImageData(0, 0, 800, 600);
    
    // Sync display canvas right away
    syncDisplay();
  }, [syncDisplay]);

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



  // ─── Flood Fill (BFS) untuk Fill Bucket ─────────────────────────────────────
  const floodFill = useCallback((
    startX: number,
    startY: number,
    fillHex: string,
    tolerance = 35
  ) => {
    const offscreen = offscreenRef.current;
    if (!offscreen) return;
    const ctx = offscreen.getContext("2d")!;
    const W = offscreen.width;
    const H = offscreen.height;
    const imageData = ctx.getImageData(0, 0, W, H);
    const data = imageData.data;

    // Helper: get pixel rgba at index
    const idx = (x: number, y: number) => (y * W + x) * 4;

    const sr = data[idx(startX, startY)];
    const sg = data[idx(startX, startY) + 1];
    const sb = data[idx(startX, startY) + 2];
    const sa = data[idx(startX, startY) + 3];

    // Parse fill color
    const fr = parseInt(fillHex.slice(1, 3), 16);
    const fg = parseInt(fillHex.slice(3, 5), 16);
    const fb = parseInt(fillHex.slice(5, 7), 16);
    const fa = 255;

    // Jika warna sama, skip
    if (sr === fr && sg === fg && sb === fb && sa === fa) return;

    const colorMatch = (x: number, y: number) => {
      const i = idx(x, y);
      return (
        Math.abs(data[i] - sr) <= tolerance &&
        Math.abs(data[i + 1] - sg) <= tolerance &&
        Math.abs(data[i + 2] - sb) <= tolerance &&
        Math.abs(data[i + 3] - sa) <= tolerance
      );
    };

    const filled = new Uint8Array(W * H);
    const queue: number[] = [];

    const enqueue = (x: number, y: number) => {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const pos = y * W + x;
      if (filled[pos]) return;
      if (!colorMatch(x, y)) return;
      filled[pos] = 1;
      queue.push(x, y);
    };

    enqueue(startX, startY);

    while (queue.length > 0) {
      const x = queue.shift()!;
      const y = queue.shift()!;
      const i = idx(x, y);
      data[i] = fr;
      data[i + 1] = fg;
      data[i + 2] = fb;
      data[i + 3] = fa;
      enqueue(x + 1, y);
      enqueue(x - 1, y);
      enqueue(x, y + 1);
      enqueue(x, y - 1);
    }

    ctx.putImageData(imageData, 0, 0);
    syncDisplay();
    setHasOffscreenContent(true);
    saveOffscreenSnapshot();
  }, [syncDisplay, saveOffscreenSnapshot]);

  // ─── Zoom helpers ─────────────────────────────────────────────────────────
  const applyZoom = useCallback((newZoom: number, originX?: number, originY?: number) => {
    const fc = fabricCanvasRef.current;
    const container = containerRef.current;
    if (!fc || !container) return;

    const clamped = Math.max(50, Math.min(300, Math.round(newZoom / 25) * 25));
    zoomLevelRef.current = clamped;
    setZoomLevel(clamped);

    const scale = clamped / 100;
    if (originX !== undefined && originY !== undefined) {
      fc.zoomToPoint(new fabric.Point(originX, originY), scale);
    } else {
      const center = fc.getCenter();
      fc.zoomToPoint(new fabric.Point(center.left, center.top), scale);
    }
    fc.requestRenderAll();
  }, []);

  const zoomIn = useCallback(() => applyZoom(zoomLevelRef.current + 25), [applyZoom]);
  const zoomOut = useCallback(() => applyZoom(zoomLevelRef.current - 25), [applyZoom]);
  const resetZoom = useCallback(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    fc.setViewportTransform([1, 0, 0, 1, 0, 0]);
    zoomLevelRef.current = 100;
    setZoomLevel(100);
    fc.requestRenderAll();
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
        
        // Filter only patterns that are in batikSvgMap
        const filteredPatterns = data?.filter(item => batikSvgMap[item.style_type]) || [];
        
        setPatterns(filteredPatterns);
      } catch (err: any) {
        handleSupabaseError(err, "CustomBatikPage.fetchPatterns");
        setPatterns([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPatterns();
  }, []);

  // ─── Load desain dari histori jika ada ?editDesignId ──────────────────────
  useEffect(() => {
    const editDesignId = searchParams.get("editDesignId");
    if (!editDesignId || !user) return;

    const loadDesign = async () => {
      try {
        const { data, error } = await supabase
          .from("custom_designs")
          .select("*")
          .eq("id", editDesignId)
          .eq("user_id", user.id)
          .single();
        if (error || !data) return;

        // Wait for canvas to be ready
        const waitForCanvas = () => new Promise<void>(resolve => {
          const check = () => {
            if (fabricCanvasRef.current) resolve();
            else setTimeout(check, 100);
          };
          check();
        });
        await waitForCanvas();

        const fc = fabricCanvasRef.current!;
        let parsed: any = null;
        try { parsed = JSON.parse(data.drawing_data); } catch { return; }

        // Set background
        if (parsed.canvasBackground) {
          setCanvasBackground(parsed.canvasBackground);
        }

        // Load fabric objects
        if (parsed.objects) {
          fc.loadFromJSON({ objects: parsed.objects, background: parsed.canvasBackground || "#ffffff" }, () => {
            fc.getObjects().forEach((obj: any) => {
              if (obj.data?.layerId) {
                setLayers(prev => [...prev, {
                  id: obj.data.layerId,
                  type: "pattern" as const,
                  name: obj.data.layerName || "Layer",
                  visible: true,
                  locked: false,
                  fabricObject: obj,
                }]);
              }
            });
            fc.requestRenderAll();
          });
        }

        // Load offscreen brush layer
        if (parsed.offscreenDataUrl && offscreenRef.current) {
          const img = new Image();
          img.onload = () => {
            const ctx = offscreenRef.current!.getContext("2d")!;
            ctx.clearRect(0, 0, 800, 600);
            ctx.drawImage(img, 0, 0, 800, 600);
            syncDisplay();
            setHasOffscreenContent(true);
          };
          img.src = parsed.offscreenDataUrl;
        }

        // Set savedDesignId agar update (bukan insert baru) saat save
        setSavedDesignId(Number(editDesignId));
        toast.success("Desain berhasil dimuat untuk diedit");
      } catch (err) {
        toast.error("Gagal memuat desain");
      }
    };

    loadDesign();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  // ─── Initialize Fabric Canvas ─────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: canvasBackground,
      selection: true,
      preserveObjectStacking: true,
      targetFindTolerance: 10,
    });
    fabricCanvasRef.current = canvas;

    // Helper untuk detect tipe objek
    const detectObjectType = (target: fabric.Object): "pattern" | "shape" | "text" | null => {
      if (!target) return null;
      // Try constructor name first
      const ctorName = target.constructor?.name?.toLowerCase();
      if (ctorName?.includes("text")) return "text";
      if (ctorName?.includes("image")) return "pattern";
      if (ctorName?.includes("rect") || ctorName?.includes("ellipse") || ctorName?.includes("polygon") || ctorName?.includes("line") || ctorName?.includes("circle")) return "shape";
      // Fallback to type property
      if (target.type === "i-text" || target.type === "text") return "text";
      if (target.type === "image") return "pattern";
      // Shape: Rect, Ellipse, Polygon, Line
      if (
        target.type === "rect" ||
        target.type === "ellipse" ||
        target.type === "polygon" ||
        target.type === "line" ||
        target.type === "circle"
      ) return "shape";
      return null;
    };

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
      if (!target) {
        setSelectedObject(null);
        setSelectedObjectType(null);
        return;
      }
      setSelectedObject(target);
      const type = detectObjectType(target);
      setSelectedObjectType(type);
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
      if (!target) {
        setSelectedObject(null);
        setSelectedObjectType(null);
        return;
      }
      setSelectedObject(target);
      const type = detectObjectType(target);
      setSelectedObjectType(type);
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
      setSelectedObject(null);
      setSelectedObjectType(null);
      // Hanya clear selection jika mousedown terjadi di dalam canvas
      // Mencegah klik di sidebar/UI luar menghapus selection
      if (lastMousedownInCanvasRef.current) {
        setSelectedLayerId(null);
      }
    });

    canvas.on("mouse:down", (e) => {
      // Manually handle object selection here
      if (e.target) {
        setSelectedObject(e.target);
        
        // Determine the type
        const detectObjectType = (target: fabric.Object): "pattern" | "shape" | "text" | null => {
          const ctorName = target.constructor?.name?.toLowerCase();
          if (ctorName?.includes("text")) return "text";
          if (ctorName?.includes("image")) return "pattern";
          if (
            ctorName?.includes("rect") ||
            ctorName?.includes("ellipse") ||
            ctorName?.includes("polygon") ||
            ctorName?.includes("line") ||
            ctorName?.includes("circle")
          ) return "shape";
          if (target.type === "i-text" || target.type === "text") return "text";
          if (target.type === "image") return "pattern";
          if (
            target.type === "rect" ||
            target.type === "ellipse" ||
            target.type === "polygon" ||
            target.type === "line" ||
            target.type === "circle"
          ) return "shape";
          return null;
        };
        
        const type = detectObjectType(e.target);
        setSelectedObjectType(type);
        
        // Also set selectedLayerId if present
        if (e.target.data?.layerId) {
          setSelectedLayerId(e.target.data.layerId);
          setActiveTab("layer");
        }
      } else {
        setSelectedObject(null);
        setSelectedObjectType(null);
        setSelectedLayerId(null);
      }
    });

    // Track apakah mousedown terjadi di dalam canvas wrapper
    const handleGlobalMousedown = (e: MouseEvent) => {
      const target = e.target as Node;
      const fabricEl = canvas.getElement();
      const wrapper = fabricEl?.parentElement;
      const displayCanvas = displayCanvasRef.current;
      
      // Klik dianggap "di dalam canvas" jika target adalah canvas fabric atau display canvas
      lastMousedownInCanvasRef.current = !!(
        (wrapper && wrapper.contains(target)) ||
        (displayCanvas && displayCanvas.contains(target))
      );
    };
    window.addEventListener("mousedown", handleGlobalMousedown, true);

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
        // Skip delete if any active object is text in editing mode
        let isEditingText = false;
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
          // Check if it's a text object and is in editing mode
          const ctorName = activeObj.constructor?.name?.toLowerCase();
          const isTextObj = ctorName?.includes("text") || activeObj.type === "i-text" || activeObj.type === "text";
          if (isTextObj && (activeObj as any).isEditing) {
            isEditingText = true;
          }
        }

        if (!isEditingText) {
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
            setSelectedObject(null);
            setSelectedObjectType(null);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    saveSnapshot();
    saveOffscreenSnapshot();
    syncDisplay();

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
      window.removeEventListener("mousedown", handleGlobalMousedown, true);
      canvas.dispose();
    };
  }, [saveSnapshot, saveOffscreenSnapshot]);

  // ─── Event listeners di display canvas ────────────────────────────────────
  useEffect(() => {
    const display = displayCanvasRef.current;
    if (!display) return;

    const onStart = (e: MouseEvent | TouchEvent) => {
      const tool = activeToolRef.current;

      // Fill bucket: satu klik langsung flood fill
      if (tool === "fill") {
        const pos = getPos(e, display);
        // Konversi ke koordinat offscreen (800x600)
        const rect = display.getBoundingClientRect();
        const scaleX = 800 / rect.width;
        const scaleY = 600 / rect.height;
        const clientX = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
        const clientY = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY;
        const ox = Math.floor((clientX - rect.left) * scaleX);
        const oy = Math.floor((clientY - rect.top) * scaleY);
        floodFill(ox, oy, brushColorRef.current);
        return;
      }

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
  }, [continueStroke, startStroke, syncDisplay, saveOffscreenSnapshot, floodFill]);



  // ─── Shape tool event listeners di Fabric canvas ──────────────────────────
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const getCanvasPos = (e: any) => {
      const pointer = fc.getPointer(e.e);
      return { x: pointer.x, y: pointer.y };
    };

    const onMouseDown = (e: any) => {
    if (activeToolRef.current !== "shape") return; 
      if (e.target) return; // Don't create new shape if clicking on existing object
      const pos = getCanvasPos(e);
      shapeStartRef.current = pos;

      // Buat shape preview sementara
      const common = {
        left: pos.x,
        top: pos.y,
        fill: shapeFillRef.current,
        stroke: shapeStrokeRef.current,
        strokeWidth: shapeStrokeWidthRef.current,
        opacity: shapeOpacityRef.current / 100,
        selectable: false,
        evented: false,
        objectCaching: false,
      };

      let preview: fabric.Object;
      if (shapeTypeRef.current === "rect") {
        preview = new fabric.Rect({ ...common, width: 1, height: 1 });
      } else if (shapeTypeRef.current === "circle") {
        preview = new fabric.Ellipse({ ...common, rx: 1, ry: 1 });
      } else if (shapeTypeRef.current === "star") {
        // Star preview — small placeholder polygon
        const starPoints = makeStarPoints(pos.x, pos.y, 5, 20, 10);
        preview = new fabric.Polygon(starPoints, { ...common, left: pos.x - 20, top: pos.y - 20 });
      } else {
        preview = new fabric.Line([pos.x, pos.y, pos.x, pos.y], {
          stroke: shapeStrokeRef.current,
          strokeWidth: Math.max(shapeStrokeWidthRef.current, 2),
          selectable: false,
          evented: false,
          fill: "",
          opacity: shapeOpacityRef.current / 100,
        });
      }
      shapePreviewRef.current = preview;
      fc.add(preview);
    };

    const onMouseMove = (e: any) => {
      if (activeToolRef.current !== "shape" || !shapeStartRef.current || !shapePreviewRef.current) return;
      const pos = getCanvasPos(e);
      const start = shapeStartRef.current;
      const preview = shapePreviewRef.current;

      if (shapeTypeRef.current === "rect") {
        const left = Math.min(start.x, pos.x);
        const top = Math.min(start.y, pos.y);
        const width = Math.abs(pos.x - start.x);
        const height = Math.abs(pos.y - start.y);
        preview.set({ left, top, width, height });
      } else if (shapeTypeRef.current === "circle") {
        const left = Math.min(start.x, pos.x);
        const top = Math.min(start.y, pos.y);
        const rx = Math.abs(pos.x - start.x) / 2;
        const ry = Math.abs(pos.y - start.y) / 2;
        (preview as fabric.Ellipse).set({ left, top, rx, ry, width: rx * 2, height: ry * 2 } as any);
      } else if (shapeTypeRef.current === "star") {
        const cx = (start.x + pos.x) / 2;
        const cy = (start.y + pos.y) / 2;
        const r = Math.max(Math.abs(pos.x - start.x), Math.abs(pos.y - start.y)) / 2;
        const newPoints = makeStarPoints(cx, cy, 5, r, r * 0.45);
        (preview as fabric.Polygon).set({ points: newPoints, left: cx - r, top: cy - r, width: r * 2, height: r * 2 } as any);
      } else {
        (preview as fabric.Line).set({ x2: pos.x, y2: pos.y });
      }
      preview.setCoords();
      fc.requestRenderAll();
    };

    const onMouseUp = (e: any) => {
      if (activeToolRef.current !== "shape" || !shapeStartRef.current || !shapePreviewRef.current) return;
      const pos = getCanvasPos(e);
      const start = shapeStartRef.current;
      const preview = shapePreviewRef.current;

      // Hapus preview lama, buat objek final yang selectable
      fc.remove(preview);
      shapePreviewRef.current = null;
      shapeStartRef.current = null;

      const common = {
        fill: shapeFillRef.current,
        stroke: shapeStrokeRef.current,
        strokeWidth: shapeStrokeWidthRef.current,
        opacity: shapeOpacityRef.current / 100,
        selectable: true,
        evented: true,
        objectCaching: false,
        hasControls: true,
      };

      let finalShape: fabric.Object;
      if (shapeTypeRef.current === "rect") {
        const left = Math.min(start.x, pos.x);
        const top = Math.min(start.y, pos.y);
        const width = Math.max(Math.abs(pos.x - start.x), 5);
        const height = Math.max(Math.abs(pos.y - start.y), 5);
        finalShape = new fabric.Rect({ ...common, left, top, width, height });
      } else if (shapeTypeRef.current === "circle") {
        const left = Math.min(start.x, pos.x);
        const top = Math.min(start.y, pos.y);
        const rx = Math.max(Math.abs(pos.x - start.x) / 2, 3);
        const ry = Math.max(Math.abs(pos.y - start.y) / 2, 3);
        finalShape = new fabric.Ellipse({ ...common, left, top, rx, ry });
      } else if (shapeTypeRef.current === "star") {
        const cx = (start.x + pos.x) / 2;
        const cy = (start.y + pos.y) / 2;
        const r = Math.max(Math.max(Math.abs(pos.x - start.x), Math.abs(pos.y - start.y)) / 2, 15);
        const starPoints = makeStarPoints(cx, cy, 5, r, r * 0.45);
        finalShape = new fabric.Polygon(starPoints, { ...common, left: cx - r, top: cy - r });
      } else {
        finalShape = new fabric.Line([start.x, start.y, pos.x, pos.y], {
          stroke: shapeStrokeRef.current,
          strokeWidth: Math.max(shapeStrokeWidthRef.current, 2),
          selectable: true,
          evented: true,
          fill: "",
          opacity: shapeOpacityRef.current / 100,
          objectCaching: false,
          hasControls: true,
        });
      }

      const newLayerId = Date.now().toString();
      const shapeLabel = shapeTypeRef.current === "rect" ? "Kotak" : shapeTypeRef.current === "circle" ? "Lingkaran" : shapeTypeRef.current === "star" ? "Bintang" : "Garis";
      (finalShape as any).data = { layerId: newLayerId, layerName: shapeLabel };

      fc.add(finalShape);
      fc.setActiveObject(finalShape);
      fc.requestRenderAll();

      setLayers((prev) => [...prev, {
        id: newLayerId,
        type: "drawing" as const,
        name: shapeLabel,
        visible: true,
        locked: false,
        fabricObject: finalShape,
      }]);
      setSelectedLayerId(newLayerId);
      setActiveTab("layer");
      saveSnapshot();
    };

    fc.on("mouse:down", onMouseDown);
    fc.on("mouse:move", onMouseMove);
    fc.on("mouse:up", onMouseUp);

    // Scroll wheel zoom
    const handleWheel = (opt: any) => {
      const e = opt.e;
      if (!e.ctrlKey) return; // hanya zoom jika tahan Ctrl
      e.preventDefault();
      const delta = e.deltaY;
      const newZoom = zoomLevelRef.current + (delta < 0 ? 25 : -25);
      applyZoom(newZoom, e.offsetX, e.offsetY);
    };
    fc.on("mouse:wheel", handleWheel);

    return () => {
      fc.off("mouse:down", onMouseDown);
      fc.off("mouse:move", onMouseMove);
      fc.off("mouse:up", onMouseUp);
      fc.off("mouse:wheel", handleWheel);
    };
  }, [saveSnapshot, applyZoom]);

  // ─── Text tool event listener ─────────────────────────────────────────────
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const onMouseDown = (e: any) => {
      if (activeToolRef.current !== "text") return;
      // Don't create new text if clicking on an existing object
      if (e.target) return;

      const pointer = fc.getPointer(e.e);
      const text = new fabric.IText("Ketik teks di sini", {
        left: pointer.x,
        top: pointer.y,
        fontFamily: fontFamilyRef.current,
        fontSize: fontSizeRef.current,
        fill: textColorRef.current,
        selectable: true,
        evented: true,
        hasControls: true,
        editable: true,
        objectCaching: false,
      });

      const newLayerId = Date.now().toString();
      (text as any).data = { layerId: newLayerId, layerName: "Teks" };

      fc.add(text);
      fc.setActiveObject(text);
      text.enterEditing();
      text.selectAll();
      fc.requestRenderAll();

      setLayers((prev) => [...prev, {
        id: newLayerId,
        type: "drawing" as const,
        name: "Teks",
        visible: true,
        locked: false,
        fabricObject: text,
      }]);
      setSelectedLayerId(newLayerId);
      setActiveTab("layer");
      // After user finishes editing, save snapshot
      text.on("editing:exited", () => {
        // Remove if empty
        if (!text.text?.trim()) {
          fc.remove(text);
          setLayers((prev) => prev.filter((l) => l.id !== newLayerId));
          setSelectedLayerId(null);
        } else {
          saveSnapshot();
        }
      });
    };

    fc.on("mouse:down", onMouseDown);
    return () => { fc.off("mouse:down", onMouseDown); };
  }, [saveSnapshot]);

  // ─── Switch tool ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    const display = displayCanvasRef.current;
    const fabricWrapper = (fabricCanvasRef as any).wrapper;
    if (!canvas || !display || !fabricWrapper) return;

    // Always sync display canvas from offscreen to ensure brush strokes are visible!
    syncDisplay();

    if (activeTool === "select") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = "default";
      canvas.hoverCursor = "move";
      // PENTING: restore evented and selectable
      canvas.forEachObject((obj) => {
        const layerId = (obj as any).data?.layerId;
        if (!layerId) return;
        obj.evented = true;
        obj.selectable = true;
      });
      canvas.renderAll();
      
      // Force z-index by setting style properties directly
      display.style.position = "absolute";
      display.style.top = "0";
      display.style.left = "0";
      display.style.pointerEvents = "none";
      display.style.zIndex = "2";
      display.style.width = "100%";
      display.style.height = "100%";
      
      fabricWrapper.style.position = "absolute";
      fabricWrapper.style.top = "0";
      fabricWrapper.style.left = "0";
      fabricWrapper.style.zIndex = "1";
      fabricWrapper.style.width = "100%";
      fabricWrapper.style.height = "100%";
    } else if (activeTool === "text") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = "text";
      canvas.hoverCursor = "text";
      canvas.forEachObject((obj) => { obj.evented = true; obj.selectable = true; });
      canvas.renderAll();
      
      display.style.position = "absolute";
      display.style.top = "0";
      display.style.left = "0";
      display.style.pointerEvents = "none";
      display.style.zIndex = "2";
      display.style.width = "100%";
      display.style.height = "100%";
      
      fabricWrapper.style.position = "absolute";
      fabricWrapper.style.top = "0";
      fabricWrapper.style.left = "0";
      fabricWrapper.style.zIndex = "1";
      fabricWrapper.style.width = "100%";
      fabricWrapper.style.height = "100%";
    } else if (activeTool === "shape") {
      // Shape: Fabric aktif (pointer events ON) tapi tidak bisa select objek lama
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = "crosshair";
      canvas.hoverCursor = "crosshair";
      canvas.forEachObject((obj) => { obj.evented = false; obj.selectable = false; });
      canvas.renderAll();
      
      display.style.position = "absolute";
      display.style.top = "0";
      display.style.left = "0";
      display.style.pointerEvents = "none";
      display.style.zIndex = "2";
      display.style.width = "100%";
      display.style.height = "100%";
      
      fabricWrapper.style.position = "absolute";
      fabricWrapper.style.top = "0";
      fabricWrapper.style.left = "0";
      fabricWrapper.style.zIndex = "1";
      fabricWrapper.style.width = "100%";
      fabricWrapper.style.height = "100%";
    } else {
      // brush, eraser, fill — display canvas di atas
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.forEachObject((obj) => { obj.evented = false; obj.selectable = false; });
      canvas.renderAll();

      let cursor = "crosshair";
      if (activeTool === "fill") {
        cursor = "cell";
      } else {
        const size = brushSizeRef.current;
        const cursorSvg =
          activeTool === "eraser"
            ? `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 1}' fill='none' stroke='%23333' stroke-width='1.5'/></svg>`
            : `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 1}' fill='${brushColorRef.current.replace("#", "%23")}' opacity='0.7'/></svg>`;
        cursor = `url("data:image/svg+xml,${cursorSvg}") ${size / 2} ${size / 2}, crosshair`;
      }
      
      display.style.position = "absolute";
      display.style.top = "0";
      display.style.left = "0";
      display.style.pointerEvents = "auto";
      display.style.zIndex = "2";
      display.style.cursor = cursor;
      display.style.width = "100%";
      display.style.height = "100%";
      
      fabricWrapper.style.position = "absolute";
      fabricWrapper.style.top = "0";
      fabricWrapper.style.left = "0";
      fabricWrapper.style.zIndex = "1";
      fabricWrapper.style.width = "100%";
      fabricWrapper.style.height = "100%";
    }
  }, [activeTool, brushSize, brushColor, syncDisplay]);

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
    if (pattern.style_type === "parang" || pattern.style_type === "parang-new" || pattern.style_type === "traditional" || pattern.style_type === "diagonal-lines") {
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
          {(pattern.style_type === "parang" || pattern.style_type === "parang-new" || pattern.style_type === "traditional" || pattern.style_type === "diagonal-lines") && (
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
          customColor: customColor,
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
    // Skip update jika presetnya sudah sama DAN warna custom juga sama
    if (data.colorPresetName === selectedPreset.name) {
      // If it's a custom preset, check if color actually changed
      if (selectedPreset.name !== "Custom") return;
      if (data.customColor === customColor) return;
    }

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
        data.customColor = customColor; // Store custom color in data
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
  }, [selectedPreset, customColor, saveSnapshot, renderPatternSVGString, patterns]);

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

  // Cek batas
  if (direction === "up" && index === layers.length - 1) return;
  if (direction === "down" && index === 0) return;

  // Update Fabric z-order
  if (direction === "up") {
    fc.bringForward(layer.fabricObject, false);
  } else {
    fc.sendBackwards(layer.fabricObject, false);
  }
  fc.requestRenderAll();

  // Sync React state agar sidebar ikut update
  setLayers((prev) => {
    const next = [...prev];
    const swapIndex = direction === "up" ? index + 1 : index - 1;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    return next;
  });

  saveSnapshot();
}, [layers, saveSnapshot]);

  const duplicateLayer = useCallback((layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer?.fabricObject || !fabricCanvasRef.current) return;
    layer.fabricObject.clone((clonedObj: fabric.Object) => {
      clonedObj.set({ left: (clonedObj.left || 0) + 20, top: (clonedObj.top || 0) + 20 });
      const newLayerId = Date.now().toString();
      // Copy all data properties from the original layer:
      (clonedObj as any).data = {
        ...(layer.fabricObject as any).data,
        layerId: newLayerId,
      };
      fabricCanvasRef.current?.add(clonedObj);
      setLayers((prev) => [...prev, {
        id: newLayerId, type: layer.type, name: `${layer.name} (Copy)`,
        visible: true, locked: false, fabricObject: clonedObj,
      }]);
    });
  }, [layers]);


  // ─── Helper: Composite canvas ke PNG DataURL ───────────────────────────────
  const buildFinalCanvas = async (): Promise<HTMLCanvasElement> => {
    const fc = fabricCanvasRef.current!;
    const offscreen = offscreenRef.current!;

    const final = document.createElement("canvas");
    final.width = 800;
    final.height = 600;
    const ctx = final.getContext("2d")!;

    // 1. Background warna user
    ctx.fillStyle = canvasBackground || "#ffffff";
    ctx.fillRect(0, 0, 800, 600);

    // 2. Fabric layer (motif/pattern) — toDataURL sudah termasuk background object Fabric
    const fabricDataUrl = fc.toDataURL({ format: "png", multiplier: 1 });
    await new Promise<void>((res, rej) => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, 800, 600); res(); };
      img.onerror = rej;
      img.src = fabricDataUrl;
    });

    // 3. Brush/Eraser layer (offscreen canvas — pixel-perfect, sudah ada lubang eraser)
    ctx.drawImage(offscreen, 0, 0, 800, 600);

    // 4. Watermark "RekaBatik"
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.font = "bold 24px 'Playfair Display', serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("RekaBatik", 780, 580);
    ctx.restore();

    return final;
  };

  // ─── Download ──────────────────────────────────────────────────────────────
  const downloadDesign = async () => {
    const fc = fabricCanvasRef.current;
    const offscreen = offscreenRef.current;
    if (!fc || !offscreen) return;
    try {
      setIsDownloading(true);
      toast.info("Mempersiapkan unduhan...");
      const final = await buildFinalCanvas();
      const link = document.createElement("a");
      link.download = `desain-batik-${Date.now()}.png`;
      link.href = final.toDataURL("image/png");
      link.click();
      toast.success("Desain berhasil diunduh! 🎨");
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
    setSavedDesignId(null);
  };

  // ─── Save Design — simpan design JSON + thumbnail ke custom_designs ────────
  const saveDesign = async (): Promise<number | null> => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk menyimpan desain");
      navigate("/auth?redirect=/custom");
      return null;
    }
    if (!fabricCanvasRef.current) return null;
    setIsSaving(true);
    try {
      // Bangun canvas final
      const final = await buildFinalCanvas();
      const thumbnailDataUrl = final.toDataURL("image/png");

      // Simpan JSON design data + thumbnail preview ke kolom drawing_data (karena design_data tidak ada di schema)
      const designJson = fabricCanvasRef.current.toJSON(["data"]);
      const payload = {
        ...designJson,
        offscreenDataUrl: offscreenRef.current?.toDataURL("image/png") || null,
        canvasBackground,
        canvasThumbnail: thumbnailDataUrl,
        projectInfo,
      };

      const { data, error } = await supabase.from("custom_designs").insert([
        {
          drawing_data: JSON.stringify(payload),
          pattern_id: 0,
          scale: 1,
          rotation: 0,
          colors: {},
          created_at: new Date().toISOString(),
          user_id: user.id,
        }
      ]).select("id").single();
      if (error) throw error;
      const newId = data?.id ?? null;
      setSavedDesignId(newId);
      return newId;
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan desain");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Modal Triggers ────────────────────────────────────────────────────────
  const triggerSaveAction = (type: "save" | "cart" | "order") => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/auth?redirect=/custom");
      return;
    }
    if (layers.length === 0 && !hasOffscreenContent) {
      toast.error("Kanvas masih kosong! Tambahkan motif atau gambar terlebih dahulu.");
      return;
    }

    if (savedDesignId && type !== "save") {
      // Jika design sudah disimpan, langung action
      executeAction(type);
    } else {
      setShowProjectModal(type);
    }
  };

  const handleSaveAndShowModal = () => triggerSaveAction("save");
  const addToCart = () => triggerSaveAction("cart"); // Tetap ada di execute action tapi dipanggil dari modal/CTA

  // ─── Execute Action ────────────────────────────────────────────────────────
  const executeAction = async (actionType: "save" | "cart" | "order") => {
    if (actionType === "save") {
      const id = await saveDesign();
      if (id !== null) {
        toast.success("Desain berhasil disimpan ke Histori!");
        navigate("/desain-histori");
      }
    }
    else if (actionType === "cart") {
      setIsAddingToCart(true);
      try {
        let designId = savedDesignId;
        if (!designId) {
          designId = await saveDesign();
          if (!designId) { setIsAddingToCart(false); return; }
        }
        await addToCartFromContext({ customDesignId: designId, quantity: 1 });
        setShowSuccessModal("cart");
      } catch (err) {
        console.error(err);
        toast.error("Gagal menambahkan ke keranjang");
      } finally {
        setIsAddingToCart(false);
      }
    } 
    else if (actionType === "order") {
      setIsAddingToCart(true);
      try {
        let designId = savedDesignId;
        if (!designId) {
          designId = await saveDesign();
          if (!designId) { setIsAddingToCart(false); return; }
        }
        await addToCartFromContext({ customDesignId: designId, quantity: 1 });
        navigate("/cart");
      } catch (err) {
        console.error(err);
        toast.error("Gagal memproses pesanan");
      } finally {
        setIsAddingToCart(false);
      }
    }
  };

  // ─── Confirm Project Info & Execute Action ─────────────────────────────────
  const confirmProjectInfo = async () => {
    if (!showProjectModal) return;
    const actionType = showProjectModal;
    setShowProjectModal(null);
    await executeAction(actionType);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="kawung" />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-4 pointer-events-none" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-4 pointer-events-none" style={{ background: "radial-gradient(circle, #8B6F47 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      <div className="container mx-auto px-4 sm:px-6 py-10 relative z-10 max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2.25rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.15, marginBottom: "0.75rem" }}>
              Wujudkan <span style={{ color: "#8B6F47", position: "relative" }} className="after:absolute after:bottom-1 after:left-0 after:w-full after:h-[6px] after:bg-[#D4B88B]/25 after:rounded-full">Karya Batik</span> Impian
            </h1>
            <p style={{ color: "#7A6B5E", fontSize: "0.95rem", maxWidth: "620px", lineHeight: 1.6 }}>
              Padukan keindahan motif klasik Nusantara dengan kreativitas Anda. Tambahkan motif, coretkan kuas warna-warni, dan unduh hasil karya seni orisinal Anda.
            </p>
          </div>

        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* Canvas Section */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(61,43,31,0.06)] border bg-white" style={{ borderColor: "rgba(212,184,139,0.3)" }}>

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* Canvas Toolbar — 2-Row Premium Design                          */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <div
                style={{
                  background: "linear-gradient(to bottom, #FDFCFA 0%, #FFFFFF 100%)",
                  borderBottom: "1px solid rgba(212,184,139,0.2)",
                }}
              >
                {/* ─── Row 1: Mode Selector + Global Actions ─────────────────── */}
                <div
                  className="px-3 py-2 flex items-center gap-2 overflow-x-auto"
                  style={{
                    borderBottom: "1px solid rgba(212,184,139,0.12)",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {/* ── Left: Tool Mode Segmented Control ── */}
                  <div
                    className="flex items-center p-0.5 rounded-xl gap-0.5 flex-shrink-0"
                    style={{
                      background: "rgba(139,111,71,0.06)",
                      border: "1px solid rgba(212,184,139,0.2)",
                    }}
                  >
                    {([
                      { tool: "select" as Tool, icon: MousePointer2, label: "Pilih" },
                      { tool: "brush" as Tool, icon: Brush, label: "Kuas" },
                      { tool: "eraser" as Tool, icon: Eraser, label: "Hapus" },
                      { tool: "fill" as Tool, icon: PaintBucket, label: "Isi" },
                      { tool: "shape" as Tool, icon: Square, label: "Bentuk" },
                      { tool: "text" as Tool, icon: Type, label: "Teks" },
                    ] as const).map(({ tool, icon: Icon, label }) => {
                      const isActive = activeTool === tool;
                      return (
                        <button
                          key={tool}
                          onClick={() => setActiveTool(tool)}
                          title={label}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer text-xs font-semibold select-none flex-shrink-0"
                          style={{
                            background: isActive
                              ? "linear-gradient(135deg, #8B6F47 0%, #A0845E 100%)"
                              : "transparent",
                            color: isActive ? "#FFFFFF" : "#7A6B5E",
                            boxShadow: isActive
                              ? "0 2px 8px rgba(139,111,71,0.25), inset 0 1px 0 rgba(255,255,255,0.15)"
                              : "none",
                          }}
                        >
                          <Icon style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                          <span className="hidden lg:inline whitespace-nowrap">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Right: All Global Actions in ONE compact pill ── */}
                  <div className="flex items-center ml-auto flex-shrink-0">
                    <div
                      className="flex items-center gap-0.5 p-1 rounded-xl"
                      style={{
                        background: "#F8F6F2",
                        border: "1px solid rgba(212,184,139,0.2)",
                      }}
                    >
                      {/* Zoom */}
                      <button
                        onClick={zoomOut}
                        disabled={zoomLevel <= 50}
                        title="Perkecil"
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-sm"
                        style={{ color: "#8B6F47" }}
                      >
                        <ZoomOut style={{ width: "13px", height: "13px" }} />
                      </button>
                      <button
                        onClick={resetZoom}
                        title="Reset Zoom"
                        className="h-7 px-1 rounded-lg text-[10px] font-bold font-mono transition-all duration-150 hover:bg-white hover:shadow-sm cursor-pointer"
                        style={{ color: zoomLevel !== 100 ? "#8B6F47" : "#A89B8F", minWidth: "38px" }}
                      >
                        {zoomLevel}%
                      </button>
                      <button
                        onClick={zoomIn}
                        disabled={zoomLevel >= 300}
                        title="Perbesar"
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-sm"
                        style={{ color: "#8B6F47" }}
                      >
                        <ZoomIn style={{ width: "13px", height: "13px" }} />
                      </button>

                      {/* Divider */}
                      <div className="h-4 w-px mx-0.5" style={{ background: "rgba(212,184,139,0.35)" }} />

                      {/* Canvas Background */}
                      <div
                        className="relative flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer hover:bg-white transition-all"
                        title="Warna latar kanvas"
                      >
                        <div
                          className="w-3.5 h-3.5 rounded border"
                          style={{ background: bgColorPickerValue, borderColor: "rgba(0,0,0,0.1)" }}
                        />
                        <span className="text-[10px] font-bold text-[#A89B8F] uppercase select-none hidden sm:inline">Latar</span>
                        <input
                          type="color"
                          value={bgColorPickerValue}
                          onChange={(e) => setBgColorPickerValue(e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          title="Ubah warna latar kanvas"
                        />
                      </div>

                      {/* Divider */}
                      <div className="h-4 w-px mx-0.5" style={{ background: "rgba(212,184,139,0.35)" }} />

                      {/* Undo */}
                      <button
                        onClick={undoAll}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-sm"
                        style={{ color: "#8B6F47" }}
                      >
                        <RotateCcw style={{ width: "13px", height: "13px" }} />
                      </button>
                      {/* Redo */}
                      <button
                        onClick={redoAll}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-sm"
                        style={{ color: "#8B6F47" }}
                      >
                        <RotateCw style={{ width: "13px", height: "13px" }} />
                      </button>

                      {/* Divider */}
                      <div className="h-4 w-px mx-0.5" style={{ background: "rgba(212,184,139,0.35)" }} />

                      {/* Clear */}
                      <button
                        onClick={clearAll}
                        title="Bersihkan kanvas"
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer hover:bg-red-50"
                        style={{ color: "#C0614A" }}
                      >
                        <Trash2 style={{ width: "13px", height: "13px" }} />
                      </button>
                      {/* Download */}
                      <button
                        onClick={downloadDesign}
                        disabled={isDownloading}
                        title="Unduh PNG"
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-sm"
                        style={{ color: "#8B6F47" }}
                      >
                        {isDownloading
                          ? <Loader2 style={{ width: "13px", height: "13px" }} className="animate-spin" />
                          : <Download style={{ width: "13px", height: "13px" }} />}
                      </button>
                      {/* Save */}
                      <button
                        onClick={handleSaveAndShowModal}
                        disabled={isSaving}
                        title="Simpan desain"
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-sm"
                        style={{ color: "#8B6F47" }}
                      >
                        {isSaving
                          ? <Loader2 style={{ width: "13px", height: "13px" }} className="animate-spin" />
                          : <Save style={{ width: "13px", height: "13px" }} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ─── Row 2: Contextual Tool Options Bar ─────────────────────── */}
                <div
                  className="px-4 flex items-center gap-3 overflow-x-auto"
                  style={{
                    background: "#FAF9F6",
                    minHeight: "44px",
                    scrollbarWidth: "none",
                  }}
                >

                  {/* MODE: SELECT */}
                  {activeTool === "select" && (
                    <div className="flex items-center gap-2 py-2.5">
                      {!selectedObject ? (
                        // Hint text — tidak ada yang dipilih
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                          style={{ background: "rgba(139,111,71,0.07)", border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}>
                          <MousePointer2 style={{ width: "12px", height: "12px", flexShrink: 0 }} />
                          <span>Klik objek di kanvas untuk memilih, lalu geser, putar, atau ubah ukurannya</span>
                        </div>
                      ) : selectedObjectType === "shape" ? (
                        // ─── Edit Shape Controls ───
                        <div className="flex items-center gap-3">
                          {/* Fill Color — sembunyikan untuk Line */}
                          {!(selectedObject instanceof fabric.Line) && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Isi</span>
                              <div className="relative rounded-lg cursor-pointer transition-all hover:scale-105"
                                style={{ background: shapeFill, border: "2px solid rgba(255,255,255,0.8)",
                                  boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4)", width: "24px", height: "24px" }}>
                                <input type="color" value={shapeFill}
                                  onChange={(e) => setShapeFill(e.target.value)}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                              </div>
                            </div>
                          )}
                          {/* Stroke Color + Width */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Garis</span>
                            <div className="relative rounded-lg cursor-pointer transition-all hover:scale-105"
                              style={{ background: shapeStroke, border: "2px solid rgba(255,255,255,0.8)",
                                boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4)", width: "24px", height: "24px" }}>
                              <input type="color" value={shapeStroke}
                                onChange={(e) => setShapeStroke(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                            </div>
                            <input type="range" min="1" max="20" step="1"
                              value={shapeStrokeWidth}
                              onChange={(e) => setShapeStrokeWidth(Number(e.target.value))}
                              className="h-1.5 rounded-full appearance-none cursor-pointer"
                              style={{ width: "64px", accentColor: "#8B6F47",
                                background: `linear-gradient(to right, #8B6F47 ${(shapeStrokeWidth / 20) * 100}%, rgba(139,111,71,0.15) 0%)` }} />
                            <span className="text-[10px] font-bold font-mono flex-shrink-0" style={{ color: "#3D2B1F", minWidth: "26px" }}>
                              {shapeStrokeWidth}px
                            </span>
                          </div>
                          {/* Opacity */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Opasitas</span>
                            <input type="range" min="10" max="100" step="10"
                              value={shapeOpacity}
                              onChange={(e) => setShapeOpacity(Number(e.target.value))}
                              className="h-1.5 rounded-full appearance-none cursor-pointer"
                              style={{ width: "64px", accentColor: "#8B6F47",
                                background: `linear-gradient(to right, #8B6F47 ${shapeOpacity}%, rgba(139,111,71,0.15) 0%)` }} />
                            <span className="text-[10px] font-bold font-mono flex-shrink-0" style={{ color: "#3D2B1F", minWidth: "32px" }}>
                              {shapeOpacity}%
                            </span>
                          </div>
                        </div>
                      ) : selectedObjectType === "text" ? (
                        // ─── Edit Text Controls ───
                        <div className="flex items-center gap-3">
                          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
                            className="h-8 px-2 rounded-lg text-xs font-semibold border cursor-pointer"
                            style={{ borderColor: "rgba(212,184,139,0.3)", color: "#3D2B1F", background: "#FAF9F6" }}>
                            <option value="serif">Serif</option>
                            <option value="sans-serif">Sans-serif</option>
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="monospace">Monospace</option>
                          </select>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Ukuran</span>
                            <button onClick={() => setFontSize(s => Math.max(8, s - 4))}
                              className="w-6 h-6 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-white"
                              style={{ borderColor: "rgba(212,184,139,0.25)", color: "#8B6F47" }}>
                              <Minus style={{ width: "10px", height: "10px" }} />
                            </button>
                            <span className="text-xs font-bold font-mono w-8 text-center" style={{ color: "#3D2B1F" }}>{fontSize}</span>
                            <button onClick={() => setFontSize(s => Math.min(120, s + 4))}
                              className="w-6 h-6 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-white"
                              style={{ borderColor: "rgba(212,184,139,0.25)", color: "#8B6F47" }}>
                              <Plus style={{ width: "10px", height: "10px" }} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Warna</span>
                            <div className="relative rounded-lg cursor-pointer hover:scale-105 transition-all"
                              style={{ background: textColor, width: "26px", height: "26px",
                                border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4)" }}>
                              <input type="color" value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                            </div>
                            <div className="flex gap-1.5">
                              {["#3D2B1F","#8B6F47","#D4B88B","#2A4B7C","#2D5A2D","#8B2A2A","#ffffff"].map((c) => (
                                <button key={c} onClick={() => setTextColor(c)}
                                  className="rounded-full transition-all hover:scale-110 cursor-pointer"
                                  style={{ width: textColor === c ? "20px" : "16px", height: textColor === c ? "20px" : "16px",
                                    background: c, border: `${textColor === c ? "2.5" : "1.5"}px solid ${textColor === c ? "#3D2B1F" : "rgba(0,0,0,0.12)"}` }} />
                              ))}
                            </div>
                          </div>
                          {/* Double-click hint */}
                          <span className="text-[10px] text-[#A89B8F] italic flex-shrink-0">Klik 2x untuk edit teks</span>
                        </div>
                      ) : selectedObjectType === "pattern" ? (
                        // ─── Pattern selected — hint untuk recolor ───
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                          style={{ background: "rgba(139,111,71,0.07)", border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}>
                          <Palette style={{ width: "12px", height: "12px", flexShrink: 0 }} />
                          <span>Motif dipilih — ganti warna via tab Preset di sidebar kanan</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* MODE: BRUSH */}
                  {activeTool === "brush" && (
                    <div className="flex items-center gap-3 py-2">

                      {/* Color Picker + Swatches */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none whitespace-nowrap">
                          Warna
                        </span>
                        <div
                          className="relative p-0.5 rounded-lg cursor-pointer transition-all hover:scale-105"
                          title="Pilih warna kustom"
                          style={{
                            background: brushColor,
                            border: "2px solid rgba(255,255,255,0.8)",
                            boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4), 0 2px 6px rgba(0,0,0,0.12)",
                            width: "26px",
                            height: "26px",
                            borderRadius: "8px",
                          }}
                        >
                          <input
                            type="color"
                            value={brushColor}
                            onChange={(e) => setBrushColor(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {["#3D2B1F", "#8B6F47", "#D4B88B", "#2A4B7C", "#2D5A2D", "#8B2A2A", "#6B3A1F", "#ffffff"].map((c) => (
                            <button
                              key={c}
                              onClick={() => setBrushColor(c)}
                              title={c}
                              className="transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer flex-shrink-0"
                              style={{
                                width: brushColor === c ? "20px" : "16px",
                                height: brushColor === c ? "20px" : "16px",
                                borderRadius: "50%",
                                background: c,
                                border: brushColor === c
                                  ? "2.5px solid #3D2B1F"
                                  : "1.5px solid rgba(0,0,0,0.12)",
                                boxShadow: brushColor === c ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                                transition: "all 0.15s ease",
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />

                      {/* Brush Size */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none whitespace-nowrap">
                          Ukuran
                        </span>
                        <button
                          onClick={() => setBrushSize([Math.max(2, brushSize[0] - 2)])}
                          className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-white hover:shadow-sm cursor-pointer"
                          style={{ border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}
                        >
                          <Minus style={{ width: "10px", height: "10px" }} />
                        </button>
                        <div className="relative flex items-center" style={{ width: "90px" }}>
                          <input
                            type="range" min="2" max="80" step="2"
                            value={brushSize[0]}
                            onChange={(e) => setBrushSize([Number(e.target.value)])}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                            style={{ accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${((brushSize[0] - 2) / 78) * 100}%, rgba(139,111,71,0.15) 0%)` }}
                          />
                        </div>
                        <button
                          onClick={() => setBrushSize([Math.min(80, brushSize[0] + 2)])}
                          className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-white hover:shadow-sm cursor-pointer"
                          style={{ border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}
                        >
                          <Plus style={{ width: "10px", height: "10px" }} />
                        </button>
                        <span
                          className="text-xs font-bold font-mono text-right flex-shrink-0"
                          style={{ color: "#3D2B1F", minWidth: "24px" }}
                        >
                          {brushSize[0]}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />

                      {/* Brush Opacity */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none whitespace-nowrap">
                          Opasitas
                        </span>
                        <input
                          type="range" min="5" max="100" step="5"
                          value={brushOpacity[0]}
                          onChange={(e) => setBrushOpacity([Number(e.target.value)])}
                          className="h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{ width: "72px", accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${brushOpacity[0]}%, rgba(139,111,71,0.15) 0%)` }}
                        />
                        <span
                          className="text-xs font-bold font-mono flex-shrink-0"
                          style={{ color: "#3D2B1F", minWidth: "32px" }}
                        >
                          {brushOpacity[0]}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* MODE: ERASER */}
                  {activeTool === "eraser" && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none whitespace-nowrap">
                          Ukuran Hapus
                        </span>
                        <button
                          onClick={() => setBrushSize([Math.max(2, brushSize[0] - 2)])}
                          className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-white hover:shadow-sm cursor-pointer"
                          style={{ border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}
                        >
                          <Minus style={{ width: "10px", height: "10px" }} />
                        </button>
                        <div className="relative flex items-center" style={{ width: "100px" }}>
                          <input
                            type="range" min="2" max="80" step="2"
                            value={brushSize[0]}
                            onChange={(e) => setBrushSize([Number(e.target.value)])}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                            style={{ accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${((brushSize[0] - 2) / 78) * 100}%, rgba(139,111,71,0.15) 0%)` }}
                          />
                        </div>
                        <button
                          onClick={() => setBrushSize([Math.min(80, brushSize[0] + 2)])}
                          className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-white hover:shadow-sm cursor-pointer"
                          style={{ border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}
                        >
                          <Plus style={{ width: "10px", height: "10px" }} />
                        </button>
                        <span
                          className="text-xs font-bold font-mono flex-shrink-0"
                          style={{ color: "#3D2B1F", minWidth: "24px" }}
                        >
                          {brushSize[0]}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* MODE: FILL */}
                  {activeTool === "fill" && (
                    <div className="flex items-center gap-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none whitespace-nowrap">
                        Warna Isi
                      </span>
                      <div
                        className="relative p-0.5 rounded-lg cursor-pointer transition-all hover:scale-105"
                        title="Pilih warna kustom"
                        style={{
                          background: brushColor,
                          border: "2px solid rgba(255,255,255,0.8)",
                          boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4), 0 2px 6px rgba(0,0,0,0.12)",
                          width: "26px",
                          height: "26px",
                          borderRadius: "8px",
                        }}
                      >
                        <input
                          type="color"
                          value={brushColor}
                          onChange={(e) => setBrushColor(e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {["#3D2B1F", "#8B6F47", "#D4B88B", "#2A4B7C", "#2D5A2D", "#8B2A2A", "#6B3A1F", "#ffffff"].map((c) => (
                          <button
                            key={c}
                            onClick={() => setBrushColor(c)}
                            title={c}
                            className="transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer flex-shrink-0"
                            style={{
                              width: brushColor === c ? "20px" : "16px",
                              height: brushColor === c ? "20px" : "16px",
                              borderRadius: "50%",
                              background: c,
                              border: brushColor === c ? "2.5px solid #3D2B1F" : "1.5px solid rgba(0,0,0,0.12)",
                              boxShadow: brushColor === c ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                              transition: "all 0.15s ease",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MODE: SHAPE */}
                  {activeTool === "shape" && (
                    <div className="flex items-center gap-3 py-2">

                      {/* Shape Type Selector */}
                      <div className="flex-shrink-0">
                        <div
                          className="flex items-center p-0.5 rounded-xl gap-0.5"
                          style={{
                            background: "rgba(139,111,71,0.08)",
                            border: "1px solid rgba(212,184,139,0.2)",
                          }}
                        >
                          {(["rect", "circle", "line", "star"] as ShapeType[]).map((t) => {
                            const IconMap = { rect: Square, circle: Circle, line: Slash, star: Star };
                            const LabelMap = { rect: "Kotak", circle: "Lingkaran", line: "Garis", star: "Bintang" };
                            const Icon = IconMap[t];
                            const isActive = shapeType === t;
                            return (
                              <button
                                key={t}
                                onClick={() => setShapeType(t)}
                                title={LabelMap[t]}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer"
                                style={{
                                  background: isActive ? "white" : "transparent",
                                  color: isActive ? "#8B6F47" : "#7A6B5E",
                                  boxShadow: isActive ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
                                }}
                              >
                                <Icon style={{ width: "12px", height: "12px" }} />
                                <span className="hidden sm:inline">{LabelMap[t]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />

                      {/* Fill Color (hidden for line) */}
                      {shapeType !== "line" && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none">Isi</span>
                          <div
                            className="relative rounded-lg cursor-pointer transition-all hover:scale-105"
                            style={{
                              background: shapeFill,
                              border: "2px solid rgba(255,255,255,0.8)",
                              boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4), 0 2px 4px rgba(0,0,0,0.1)",
                              width: "24px",
                              height: "24px",
                            }}
                          >
                            <input
                              type="color"
                              value={shapeFill}
                              onChange={(e) => setShapeFill(e.target.value)}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                          </div>
                        </div>
                      )}

                      {/* Stroke Color + Width */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none">Garis</span>
                        <div
                          className="relative rounded-lg cursor-pointer transition-all hover:scale-105"
                          style={{
                            background: shapeStroke,
                            border: "2px solid rgba(255,255,255,0.8)",
                            boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4), 0 2px 4px rgba(0,0,0,0.1)",
                            width: "24px",
                            height: "24px",
                          }}
                        >
                          <input
                            type="color"
                            value={shapeStroke}
                            onChange={(e) => setShapeStroke(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>
                        <input
                          type="range" min="1" max="20" step="1"
                          value={shapeStrokeWidth}
                          onChange={(e) => setShapeStrokeWidth(Number(e.target.value))}
                          className="h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{ width: "64px", accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${(shapeStrokeWidth / 20) * 100}%, rgba(139,111,71,0.15) 0%)` }}
                        />
                        <span className="text-[10px] font-bold font-mono flex-shrink-0" style={{ color: "#3D2B1F", minWidth: "26px" }}>
                          {shapeStrokeWidth}px
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />

                      {/* Shape Opacity */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none">Opasitas</span>
                        <input
                          type="range" min="10" max="100" step="10"
                          value={shapeOpacity}
                          onChange={(e) => setShapeOpacity(Number(e.target.value))}
                          className="h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{ width: "64px", accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${shapeOpacity}%, rgba(139,111,71,0.15) 0%)` }}
                        />
                        <span className="text-[10px] font-bold font-mono flex-shrink-0" style={{ color: "#3D2B1F", minWidth: "32px" }}>
                          {shapeOpacity}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* MODE: TEXT */}
                  {activeTool === "text" && (
                    <div className="flex items-center gap-3 py-2">
                      {/* Font Family */}
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="h-8 px-2 rounded-lg text-xs font-semibold border cursor-pointer"
                        style={{ borderColor: "rgba(212,184,139,0.3)", color: "#3D2B1F", background: "#FAF9F6" }}
                      >
                        <option value="serif">Serif</option>
                        <option value="sans-serif">Sans-serif</option>
                        <option value="'Playfair Display', serif">Playfair Display</option>
                        <option value="monospace">Monospace</option>
                      </select>

                      {/* Font Size */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Ukuran</span>
                        <button onClick={() => setFontSize(s => Math.max(8, s - 4))}
                          className="w-6 h-6 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-white"
                          style={{ borderColor: "rgba(212,184,139,0.25)", color: "#8B6F47" }}>
                          <Minus style={{ width: "10px", height: "10px" }} />
                        </button>
                        <span className="text-xs font-bold font-mono w-8 text-center" style={{ color: "#3D2B1F" }}>{fontSize}</span>
                        <button onClick={() => setFontSize(s => Math.min(120, s + 4))}
                          className="w-6 h-6 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-white"
                          style={{ borderColor: "rgba(212,184,139,0.25)", color: "#8B6F47" }}>
                          <Plus style={{ width: "10px", height: "10px" }} />
                        </button>
                      </div>

                      {/* Text Color */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Warna</span>
                        <div className="relative rounded-lg cursor-pointer hover:scale-105 transition-all"
                          style={{ background: textColor, width: "26px", height: "26px",
                            border: "2px solid rgba(255,255,255,0.8)",
                            boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4)" }}>
                          <input type="color" value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                        </div>
                        <div className="flex gap-1.5">
                          {["#3D2B1F", "#8B6F47", "#D4B88B", "#2A4B7C", "#2D5A2D", "#8B2A2A", "#ffffff"].map((c) => (
                            <button key={c} onClick={() => setTextColor(c)}
                              className="rounded-full border transition-all hover:scale-110 cursor-pointer"
                              style={{ width: textColor === c ? "20px" : "16px", height: textColor === c ? "20px" : "16px",
                                background: c, borderColor: textColor === c ? "#3D2B1F" : "rgba(0,0,0,0.12)",
                                border: `${textColor === c ? "2.5" : "1.5"}px solid ${textColor === c ? "#3D2B1F" : "rgba(0,0,0,0.12)"}` }} />
                          ))}
                        </div>
                      </div>

                      <div className="h-6 w-px" style={{ background: "rgba(212,184,139,0.35)" }} />
                      <span className="text-[10px] text-[#A89B8F] italic">Klik area kosong di kanvas untuk menambah teks</span>
                    </div>
                  )}

                </div>
              </div>

              {/* ─── Canvas Area ────────────────────────────── */}
              <div className="p-4 sm:p-6 bg-[#F8F6F2]" style={{ borderTop: "1px solid rgba(212,184,139,0.12)" }}>
                <div className="relative rounded-2xl overflow-hidden shadow-inner border border-stone-200/50" style={{ boxShadow: "inset 0 4px 20px rgba(61,43,31,0.05)" }}>

                  {/* Aspect Ratio Canvas Container */}
                  <div ref={containerRef} className="aspect-[4/3] relative overflow-hidden select-none" style={{ background: bgColorPickerValue }}>
                    {/* Layer 1: Display canvas untuk brush/eraser */}
                    <canvas
                      ref={displayCanvasRef}
                      width={800}
                      height={600}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'auto' }}
                    />

                    {/* Layer 2: Fabric canvas wrapper */}
                    <div
                      ref={(el) => {
                        // Store this element in a new ref to access it!
                        (fabricCanvasRef as any).wrapper = el;
                        // Also add a click listener directly here
                        if (el) {
                          el.addEventListener("click", (e) => {
                            console.log("=== Fabric wrapper directly clicked! ===");
                            console.log("e:", e);
                            console.log("e.target:", e.target);
                          });
                        }
                      }}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
                    >
                      <canvas ref={canvasRef} />
                    </div>

                    {layers.length === 0 && !hasOffscreenContent && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ color: "#A89B8F", zIndex: 3 }}>
                        <Layers className="w-14 h-14 mb-3 opacity-20 text-[#8B6F47]" />
                        <p className="text-base font-semibold text-[#5A4A3E]">Kanvas Karya Kosong</p>
                        <p className="text-xs opacity-75 mt-0.5">Pilih & klik motif di sidebar kanan untuk memulai membatik</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── CTA Bar (Simpan / Unduh) ─────────────────────────── */}
              <div
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
                style={{
                  background: "linear-gradient(to right, #FAF8F5, #FFFFFF)",
                  borderTop: "1px solid rgba(212,184,139,0.18)",
                }}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#A89B8F] mb-0.5">Simpan atau Unduh</p>
                  <p className="text-sm font-semibold text-[#3D2B1F] leading-snug">
                    Simpan desain ke histori untuk dipesan nanti, atau unduh sebagai gambar.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button
                    onClick={downloadDesign}
                    disabled={isDownloading || (layers.length === 0 && !hasOffscreenContent)}
                    className="flex items-center gap-2 px-4 h-10 rounded-2xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 cursor-pointer border hover:shadow-sm active:scale-95"
                    style={{
                      color: "#5A3D2B",
                      background: "#FFFFFF",
                      borderColor: "rgba(139,111,71,0.3)",
                    }}
                    title="Unduh desain"
                  >
                    {isDownloading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                    <span>Unduh</span>
                  </button>

                  <button
                    onClick={handleSaveAndShowModal}
                    disabled={isSaving || (layers.length === 0 && !hasOffscreenContent)}
                    className="flex items-center gap-2 px-5 h-10 rounded-2xl font-bold text-sm text-white transition-all duration-200 disabled:opacity-50 cursor-pointer hover:brightness-110 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #8B6F47 0%, #6B4F2F 100%)",
                      boxShadow: "0 4px 16px rgba(139,111,71,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
                    }}
                    title="Simpan ke histori"
                  >
                    {isSaving
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Save className="w-4 h-4" />}
                    <span>Simpan</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Sidebar Section */}
          <div className="lg:col-span-4 h-full">
            <div
              className="rounded-[32px] shadow-[0_20px_50px_rgba(61,43,31,0.06)] overflow-hidden border bg-white flex flex-col h-full"
              style={{ borderColor: "rgba(212,184,139,0.3)" }}>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full flex-1 min-h-0">
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

                <TabsContent value="pattern" className="p-5 m-0 max-h-[650px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: "#FFFFFF" }}>
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

                <TabsContent value="color" className="p-5 m-0 max-h-[650px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: "#FFFFFF" }}>
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Palette className="w-4 h-4 text-[#8B6F47]" />
                    <p style={{ color: "#7A6B5E", fontSize: "0.8rem", fontWeight: 500 }}>Pilih palet warna (klik motif di kanvas dulu):</p>
                  </div>

                  {/* Custom Color Picker Section */}
                  <div className="mb-6 p-4 rounded-2xl border bg-[#FAF8F5]" style={{ borderColor: "rgba(139,111,71,0.12)" }}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <Brush className="w-4 h-4 text-[#8B6F47]" />
                      <p style={{ color: "#3D2B1F", fontSize: "0.85rem", fontWeight: 700 }}>Warna Custom</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold" style={{ color: "#8E7F72" }}>Warna Utama</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            setCustomColor(newColor);
                            setSelectedPreset(generatePresetFromPrimary(newColor));
                          }}
                          className="w-12 h-10 rounded-lg border cursor-pointer"
                          style={{ borderColor: "rgba(139,111,71,0.12)" }}
                        />
                        <span className="text-xs font-mono" style={{ color: "#7A6B5E" }}>{customColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pr-1">
                    {colorPresets.map((preset, i) => {
                      const isActive = selectedPreset.name === preset.name;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedPreset(preset);
                            setCustomColor(preset.colors.primary);
                          }}
                          className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${isActive
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

                <TabsContent value="layer" className="p-5 m-0 max-h-[650px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: "#FFFFFF" }}>
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
                              console.log("=== Layer clicked! ===");
                              console.log("layer:", layer);
                              if (layer.fabricObject && fabricCanvasRef.current) {
                                fabricCanvasRef.current.setActiveObject(layer.fabricObject);
                                fabricCanvasRef.current.renderAll();
                                setSelectedLayerId(layer.id);
                                console.log("Setting selectedObject manually");
                                setSelectedObject(layer.fabricObject);
                                const type = (() => {
                                  const target = layer.fabricObject;
                                  const ctorName = target.constructor?.name?.toLowerCase();
                                  if (ctorName?.includes("text")) return "text";
                                  if (ctorName?.includes("image")) return "pattern";
                                  if (ctorName?.includes("rect") || ctorName?.includes("ellipse") || ctorName?.includes("polygon") || ctorName?.includes("line") || ctorName?.includes("circle")) return "shape";
                                  if (target.type === "i-text" || target.type === "text") return "text";
                                  if (target.type === "image") return "pattern";
                                  if (target.type === "rect" || target.type === "ellipse" || target.type === "polygon" || target.type === "line" || target.type === "circle") return "shape";
                                  return null;
                                })();
                                console.log("Setting selectedObjectType manually to:", type);
                                setSelectedObjectType(type);
                              }
                            }}
                            className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5 ${isSelected
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
                                      {(() => {
                                        const obj = layer.fabricObject;
                                        if (!obj) return <Brush className="w-5 h-5 opacity-60" style={{ color: layer.brushColor || "#8B6F47" }} />;
                                        if (obj.type === "i-text" || obj.type === "text" || obj.constructor?.name?.toLowerCase().includes("text")) {
                                          return <Type className="w-5 h-5 opacity-60" style={{ color: (obj as any).fill || "#3D2B1F" }} />;
                                        }
                                        if (obj.type === "rect" || obj.type === "ellipse" || obj.type === "polygon" || obj.type === "line" || obj.type === "circle" ||
                                            obj.constructor?.name?.toLowerCase().includes("rect") || obj.constructor?.name?.toLowerCase().includes("ellipse") ||
                                            obj.constructor?.name?.toLowerCase().includes("polygon") || obj.constructor?.name?.toLowerCase().includes("line") ||
                                            obj.constructor?.name?.toLowerCase().includes("circle")) {
                                          if (obj.type === "line" || obj.constructor?.name?.toLowerCase().includes("line")) {
                                            return <Slash className="w-5 h-5 opacity-60" style={{ color: (obj as any).stroke || "#3D2B1F" }} />;
                                          } else if (obj.type === "ellipse" || obj.constructor?.name?.toLowerCase().includes("ellipse") || obj.type === "circle") {
                                            return <Circle className="w-5 h-5 opacity-60" style={{ color: (obj as any).fill || (obj as any).stroke || "#3D2B1F" }} />;
                                          } else if (obj.type === "polygon" || obj.constructor?.name?.toLowerCase().includes("polygon")) {
                                            return <Star className="w-5 h-5 opacity-60" style={{ color: (obj as any).fill || (obj as any).stroke || "#3D2B1F" }} />;
                                          } else {
                                            return <Square className="w-5 h-5 opacity-60" style={{ color: (obj as any).fill || (obj as any).stroke || "#3D2B1F" }} />;
                                          }
                                        }
                                        return <Brush className="w-5 h-5 opacity-60" style={{ color: layer.brushColor || "#8B6F47" }} />;
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate" style={{ color: "#3D2B1F" }}>
                                  {layer.name}
                                </p>
                                <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "#8B6F47" }}>
                                  {layer.type === "pattern" ? "Motif" : (() => {
                                    const obj = layer.fabricObject;
                                    if (!obj) return "Gambar Bebas";
                                    if (obj.type === "i-text" || obj.type === "text" || obj.constructor?.name?.toLowerCase().includes("text")) {
                                      return "Teks";
                                    }
                                    if (obj.type === "rect" || obj.type === "ellipse" || obj.type === "polygon" || obj.type === "line" || obj.type === "circle" ||
                                        obj.constructor?.name?.toLowerCase().includes("rect") || obj.constructor?.name?.toLowerCase().includes("ellipse") ||
                                        obj.constructor?.name?.toLowerCase().includes("polygon") || obj.constructor?.name?.toLowerCase().includes("line") ||
                                        obj.constructor?.name?.toLowerCase().includes("circle")) {
                                      return "Bentuk";
                                    }
                                    return "Gambar Bebas";
                                  })()}
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

      {/* ── SUCCESS MODAL ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl"
              style={{ border: "1px solid rgba(212,184,139,0.3)" }}
            >
              <button
                onClick={() => setShowSuccessModal(null)}
                className="absolute top-4 right-4 p-2 text-[#A89B8F] hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}>
                {showSuccessModal === "cart" ? <ShoppingCart className="w-10 h-10 text-white" /> : <CheckCircle2 className="w-10 h-10 text-white" />}
              </div>

              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                {showSuccessModal === "cart" ? "Berhasil!" : "Disimpan!"}
              </h3>
              <p className="text-[#7A6B5E] mb-8 text-sm">
                {showSuccessModal === "cart"
                  ? "Desain kustom Anda berhasil ditambahkan ke keranjang belanja."
                  : "Desain Anda berhasil disimpan di koleksi profil."}
              </p>

              <div className="space-y-3">
                {showSuccessModal === "cart" && (
                  <button onClick={() => navigate("/cart")} className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-95" style={{ background: "linear-gradient(135deg, #3D2B1F, #5A3D2B)" }}>
                    Lihat Keranjang
                  </button>
                )}
                <button
                  onClick={() => setShowSuccessModal(null)}
                  className="w-full py-3.5 rounded-xl font-bold transition-all"
                  style={{ color: "#8B6F47", border: "1.5px solid rgba(139,111,71,0.2)", background: "rgba(139,111,71,0.04)" }}
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PROJECT INFO MODAL ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProjectModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl"
              style={{ border: "1px solid rgba(212,184,139,0.3)" }}
            >
              <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                Detail Proyek Batik
              </h3>
              <p className="text-[#7A6B5E] mb-6 text-sm">
                Lengkapi informasi desain kustom Anda sebelum melanjutkan.
              </p>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">Nama Desain</label>
                  <input
                    type="text"
                    placeholder="Contoh: Batik Sarimbit Keluarga"
                    value={projectInfo.name}
                    onChange={(e) => setProjectInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all focus:border-[#8B6F47] focus:ring-1 focus:ring-[#8B6F47]"
                    style={{ borderColor: "rgba(212,184,139,0.3)", background: "#FAF9F6" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">Deskripsi / Tujuan</label>
                  <textarea
                    placeholder="Contoh: Untuk seragam pernikahan bulan depan, Penjelasan motif apa yang anda pakai"
                    value={projectInfo.description}
                    onChange={(e) => setProjectInfo(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all focus:border-[#8B6F47] focus:ring-1 focus:ring-[#8B6F47] resize-none h-24"
                    style={{ borderColor: "rgba(212,184,139,0.3)", background: "#FAF9F6" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">Pilihan Kain Dasar</label>
                  <select
                    value={projectInfo.fabric}
                    onChange={(e) => setProjectInfo(prev => ({ ...prev, fabric: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all focus:border-[#8B6F47] focus:ring-1 focus:ring-[#8B6F47]"
                    style={{ borderColor: "rgba(212,184,139,0.3)", background: "#FAF9F6" }}
                  >
                    <option value="Katun Primisima">Katun Primisima (Rekomendasi)</option>
                    <option value="Katun Dobby">Katun Dobby</option>
                    <option value="Sutra ATBM">Sutra ATBM</option>
                    <option value="Viscose">Viscose</option>
                  </select>
                </div>
              </div>

              <button
                onClick={confirmProjectInfo}
                disabled={!projectInfo.name.trim() || isSaving}
                className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-95"
                style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {showProjectModal === "save" ? "Simpan Desain" : showProjectModal === "cart" ? "Simpan & Masukkan Keranjang" : "Simpan & Pesan Sekarang"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
