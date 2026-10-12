import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
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
  ShoppingCart,
  Type,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  FlipVertical,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  SlidersHorizontal,
  Grid,
  ChevronsUp,
  ChevronsDown,
  Triangle,
  Diamond,
} from "lucide-react";
import { useNavigate, useSearchParams, useBlocker } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover";
import { BatikBackground } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { BatikItem } from "../../types/database";
import { toast } from "sonner";
import { Skeleton } from "../components/ui/skeleton";
import { fabric } from "fabric";
import { useAuth } from "../../lib/AuthContext";
import { useCart } from "../../lib/CartContext";
import { useFullscreen } from "../../lib/FullscreenContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

const normalizeStyleType = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\.svg$/i, "")
    .replace(/[_\s]+/g, "-");

const formatPatternName = (value: string) =>
  value
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const batikSvgModules = import.meta.glob("../../assets/batik-svgs/*.svg", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const batikSvgCache: Record<string, string> = {};
const batikSvgLoadPromises = new Map<string, Promise<string | undefined>>();

const batikSvgPathMap: Record<string, string> = Object.fromEntries(
  Object.keys(batikSvgModules).map((path) => {
    const fileName = path.split("/").pop() ?? "";
    return [normalizeStyleType(fileName), path];
  }),
);

const batikSvgAliasPathMap: Record<string, string> = Object.fromEntries(
  Object.entries({
    ...batikSvgPathMap,
    parang: batikSvgPathMap["parang-batik"],
    "parang-new": batikSvgPathMap.parang,
    mega: batikSvgPathMap["mega-mendung"],
    "sido-mukti": batikSvgPathMap.sidomukti,
  }).filter(([, path]) => Boolean(path)),
);

const batikKnownStyleTypes = new Set(Object.keys(batikSvgAliasPathMap));

const loadBatikSvg = async (styleType?: string) => {
  if (!styleType) return undefined;

  const normalizedStyleType = normalizeStyleType(styleType);
  if (batikSvgCache[normalizedStyleType]) {
    return batikSvgCache[normalizedStyleType];
  }

  const existingPromise = batikSvgLoadPromises.get(normalizedStyleType);
  if (existingPromise) {
    return existingPromise;
  }

  const modulePath = batikSvgAliasPathMap[normalizedStyleType];
  const loader = modulePath ? batikSvgModules[modulePath] : undefined;

  if (!loader) return undefined;

  const loadPromise = loader()
    .then((svg) => {
      batikSvgCache[normalizedStyleType] = svg;
      return svg;
    })
    .finally(() => {
      batikSvgLoadPromises.delete(normalizedStyleType);
    });

  batikSvgLoadPromises.set(normalizedStyleType, loadPromise);
  return loadPromise;
};

const getBatikSvg = (styleType?: string) => {
  if (!styleType) return undefined;
  return batikSvgCache[normalizeStyleType(styleType)];
};

const batikAssetStyleTypeMap: Record<string, string> = {
  "parang-batik": "parang",
  parang: "parang-new",
  "mega-mendung": "mega",
  sidomukti: "sido-mukti",
};

const batikAssetMeta: Record<string, Partial<BatikItem>> = {
  "parang-batik": {
    name: "Parang Klasik",
    description: "Motif parang klasik dengan garis diagonal khas batik Jawa.",
    origin: "Jawa Tengah",
  },
  parang: {
    name: "Parang Baru",
    description: "Motif parang dengan detail yang lebih modern untuk kanvas custom.",
    origin: "Jawa Tengah",
  },
  "mega-mendung": {
    name: "Mega Mendung",
    description: "Motif awan khas Cirebon yang lembut dan ikonik.",
    origin: "Cirebon",
  },
  bunga1: {
    name: "Bunga 1",
    description: "Motif bunga bernuansa klasik yang siap dipadukan di desain custom.",
    origin: "Jawa",
  },
  bunga2: {
    name: "Bunga 2",
    description: "Motif bunga alternatif dengan komposisi ornamen yang lebih padat.",
    origin: "Jawa",
  },
  bunga3: {
    name: "Bunga 3",
    description: "Motif bunga dekoratif untuk tampilan batik yang lebih manis.",
    origin: "Yogyakarta",
  },
  ceplok: {
    name: "Ceplok",
    description: "Motif geometris khas Yogyakarta yang rapi dan seimbang.",
    origin: "Yogyakarta",
  },
  sidomukti: {
    name: "Sido Mukti",
    description: "Motif klasik yang melambangkan kebahagiaan dan kemakmuran.",
    origin: "Jawa Tengah",
  },
  teratai: {
    name: "Teratai",
    description: "Motif floral lembut dengan karakter elegan.",
    origin: "Cirebon",
  },
  ties: {
    name: "Ties",
    description: "Motif modern dengan ritme pola yang lebih kontemporer.",
    origin: "Solo",
  },
  truntum: {
    name: "Truntum",
    description: "Motif bintang kecil khas Solo yang melambangkan cinta dan kesetiaan.",
    origin: "Surakarta",
  },
  urang: {
    name: "Urang",
    description: "Motif pesisir bertema udang dengan karakter dinamis.",
    origin: "Pekalongan",
  },
  iwak: {
    name: "Iwak",
    description: "Motif ikan khas Nusantara untuk nuansa pesisir yang kuat.",
    origin: "Lamongan",
  },
};

const batikAssetPatterns: BatikItem[] = Object.keys(batikSvgPathMap)
  .sort((a, b) => a.localeCompare(b))
  .map((assetKey, index) => {
    const styleType = batikAssetStyleTypeMap[assetKey] ?? assetKey;
    const meta = batikAssetMeta[assetKey] ?? {};
    const name = meta.name ?? formatPatternName(assetKey);

    return {
      id: 100000 + index,
      name,
      price: meta.price ?? 0,
      description: meta.description ?? `Motif ${name} siap dipakai untuk desain batik custom.`,
      origin: meta.origin ?? "Nusantara",
      primary_color: meta.primary_color ?? "#8B6F47",
      secondary_color: meta.secondary_color ?? "#D4B88B",
      bg_color: meta.bg_color ?? "#f3f3f3",
      rating: meta.rating ?? 5,
      sold: meta.sold ?? 0,
      style_type: styleType,
    };
  });

const batikPatternOrder = new Map(
  batikAssetPatterns.map((pattern, index) => [pattern.style_type ?? "", index]),
);

const mergePatternsWithAssets = (items: BatikItem[] = []) => {
  const merged = new Map<string, BatikItem>();

  items.forEach((item) => {
    const styleType = normalizeStyleType(item.style_type ?? "");
    if (!styleType || !batikKnownStyleTypes.has(styleType)) return;

    merged.set(styleType, {
      ...item,
      style_type: styleType,
    });
  });

  batikAssetPatterns.forEach((item) => {
    const styleType = item.style_type ?? "";
    if (!styleType || merged.has(styleType)) return;
    merged.set(styleType, item);
  });

  return Array.from(merged.values()).sort((a, b) => {
    const aIndex = batikPatternOrder.get(a.style_type ?? "") ?? Number.MAX_SAFE_INTEGER;
    const bIndex = batikPatternOrder.get(b.style_type ?? "") ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
};

type Tool = "select" | "brush" | "eraser" | "fill" | "shape" | "text";
type ShapeType = "rect" | "circle" | "line" | "star" | "triangle" | "diamond";

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

const blackPreset = {
  name: "Hitam",
  colors: { primary: "#000000", secondary: "#333333", accent: "#666666", background: "transparent" },
  batik: { background: "#ffffff", light: "#cccccc", mid: "#666666", dark: "#000000" }
};


const recolorSVG = (svgString: string, preset: typeof colorPresets[0]) => {
  let result = svgString;
  result = result.replace(/<path(?=[\s>])(?!.*\sfill=)/g, '<path fill="#000000"');
  result = result.replace(/<g(?=[\s>])(?!.*\sfill=)/g, '<g fill="#000000"');
  result = result.replace(/#f3f3f3/gi, preset.batik.background);
  result = result.replace(/#a1a0a0/gi, preset.batik.light);
  result = result.replace(/#5e5c5c/gi, preset.batik.mid);
  result = result.replace(/#242020/gi, preset.batik.dark);
  result = result.replace(/#d0d0d0/gi, preset.batik.light);
  result = result.replace(/#b9b9b9/gi, preset.batik.light);
  result = result.replace(/#a3a3a3/gi, preset.batik.mid);
  result = result.replace(/#8c8c8c/gi, preset.batik.mid);
  result = result.replace(/#767676/gi, preset.batik.dark);
  result = result.replace(/#606060/gi, preset.batik.dark);
  result = result.replace(/#494949/gi, preset.batik.dark);
  result = result.replace(/#333333/gi, preset.batik.dark);
  result = result.replace(/#000000/gi, preset.colors.primary);
  result = result.replace(/#caac47/gi, preset.colors.secondary);
  result = result.replace(/#[0-9a-f]{6}\b/gi, (match) => mapGrayscaleHexToPreset(match, preset));
  result = result.replace(/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi, (match, r, g, b) =>
    mapGrayscaleRgbToPreset(match, Number(r), Number(g), Number(b), preset),
  );
  return result;
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
};

const mapGrayscaleHexToPreset = (hex: string, preset: typeof colorPresets[0]) => {
  const rgb = hexToRgb(hex);
  if (!rgb || rgb.r !== rgb.g || rgb.g !== rgb.b) return hex;

  const tone = rgb.r;
  if (tone >= 245) return preset.batik.background;
  if (tone >= 190) return preset.batik.light;
  if (tone >= 130) return preset.batik.mid;
  if (tone >= 70) return preset.batik.dark;
  return preset.colors.primary;
};

const mapGrayscaleRgbToPreset = (
  original: string,
  r: number,
  g: number,
  b: number,
  preset: typeof colorPresets[0],
) => {
  if (r !== g || g !== b) return original;
  return mapGrayscaleHexToPreset(rgbToHex(r, g, b), preset);
};

const generatePresetFromPrimary = (primaryColor: string) => {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) return colorPresets[0];
  const light = rgbToHex(rgb.r + 60, rgb.g + 60, rgb.b + 60);
  const mid = primaryColor;
  const dark = rgbToHex(rgb.r - 50, rgb.g - 50, rgb.b - 50);
  return {
    name: "Custom",
    colors: { primary: mid, secondary: light, accent: light, background: "transparent" },
    batik: { background: "#f3f3f3", light: light, mid: mid, dark: dark }
  };
};

function makeStarPoints(cx: number, cy: number, numPoints: number, outerR: number, innerR: number) {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (Math.PI / numPoints) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return points;
}

function makeTrianglePoints(cx: number, cy: number, w: number, h: number) {
  return [
    { x: cx, y: cy - h / 2 },
    { x: cx + w / 2, y: cy + h / 2 },
    { x: cx - w / 2, y: cy + h / 2 },
  ];
}

function makeDiamondPoints(cx: number, cy: number, w: number, h: number) {
  return [
    { x: cx, y: cy - h / 2 },
    { x: cx + w / 2, y: cy },
    { x: cx, y: cy + h / 2 },
    { x: cx - w / 2, y: cy },
  ];
}

// [OPT-2] detectObjectType — centralized helper, defined once outside the component
function detectObjectType(target: fabric.Object): "pattern" | "shape" | "text" | null {
  if (!target) return null;

  // Handle ActiveSelection or Group (multiple objects)
  if ((target.type === "activeSelection" || target.type === "group") && (target as any).getObjects) {
    const objects = (target as any).getObjects();
    if (objects.length === 0) return null;

    // Check if all objects have the same type
    const firstType = detectObjectType(objects[0]);
    if (firstType && objects.every((obj: fabric.Object) => detectObjectType(obj) === firstType)) {
      return firstType;
    }
    // Default to pattern if mixed or cannot decide, so user can still recolor
    return "pattern";
  }

  const ctorName = target.constructor?.name?.toLowerCase() ?? "";
  if (ctorName.includes("text") || target.type === "i-text" || target.type === "text") return "text";
  if (ctorName.includes("image") || target.type === "image" || (target as any).data?.patternId) return "pattern";
  if (
    ctorName.includes("rect") ||
    ctorName.includes("ellipse") ||
    ctorName.includes("polygon") ||
    ctorName.includes("line") ||
    ctorName.includes("circle") ||
    ["rect", "ellipse", "polygon", "line", "circle"].includes(target.type ?? "")
  ) return "shape";
  return null;
}

// [OPT-7] svgStringToPngDataUrl — extracted helper, eliminates duplication in addItemToCanvas & recolorActiveObject
async function svgStringToPngDataUrl(svgString: string): Promise<string> {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 554;
      const h = img.naturalHeight || 554;
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(blobUrl);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("SVG load failed"));
    };
    img.src = blobUrl;
  });
}

// [OPT-6] SidebarTabs — promoted to a proper memoized React component
interface SidebarTabsProps {
  activeTab: string;
  setActiveTab: (v: string) => void;
  patterns: BatikItem[];
  loading: boolean;
  selectedPreset: typeof colorPresets[0];
  setSelectedPreset: (p: typeof colorPresets[0]) => void;
  customColor: string;
  // [OPT-1b] Only called on mouse-release (color input's onChange), not on every
  // drag pixel — avoids re-rendering SidebarTabs (and triggering recolorActiveObject)
  // on every frame while dragging the custom color picker.
  onCustomColorCommit: (c: string, skipPresetRegen?: boolean) => void;
  addItemToCanvas: (pattern: BatikItem) => void;
  renderMiniPattern: (pattern: BatikItem, presetName?: string, customColor?: string) => React.ReactNode;
  layers: CustomLayer[];
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  setSelectedObject: (obj: fabric.Object | null) => void;
  setSelectedObjectType: (t: "pattern" | "shape" | "text" | null) => void;
  fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
  moveLayer: (id: string, dir: "up" | "down") => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  duplicateLayer: (id: string) => void;
  deleteSelectedLayer: () => void;
  layerItemRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  addUploadedImageToCanvas: (dataUrl: string, fileName: string) => void;
  flipLayer: (id: string, axis: "x" | "y") => void;
  // ↓ tambahan baru 
  isMultiSelectMode: boolean;
  toggleMultiSelectMode: () => void;
  selectedPatternIds: Set<number>;
  togglePatternSelection: (patternId: number) => void;
  onAddSelectedPatterns: () => void;
}

const SidebarTabs = memo(({
  activeTab, setActiveTab,
  patterns, loading,
  selectedPreset, setSelectedPreset,
  customColor, onCustomColorCommit,
  addItemToCanvas,
  renderMiniPattern,
  layers, selectedLayerId, setSelectedLayerId,
  setSelectedObject, setSelectedObjectType,
  fabricCanvasRef,
  moveLayer, toggleLayerVisibility, toggleLayerLock, duplicateLayer, deleteSelectedLayer,
  layerItemRefs,
  addUploadedImageToCanvas,
  flipLayer,
  isMultiSelectMode,
  toggleMultiSelectMode,
  selectedPatternIds,
  togglePatternSelection,
  onAddSelectedPatterns,
}: SidebarTabsProps) => {
  // [OPT-1b] Local refs for the custom color input — uncontrolled, so dragging
  // the picker never triggers a SidebarTabs (or parent) re-render. Only the
  // DOM text/swatch preview update on every drag tick; the actual commit
  // (which updates React state, regenerates the preset, and triggers recolor)
  // happens once on mouse-release via the input's onChange.
  const customColorInputRef = useRef<HTMLInputElement>(null);
  const customColorTextRef = useRef<HTMLSpanElement>(null);
  // Debounce timer ref — so onChange (which fires on every drag tick in Chrome)
  // only commits to React state once, 120 ms after the user stops dragging.
  const colorCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // [OPT-1b] Keep the uncontrolled input in sync when customColor changes from
  // elsewhere (e.g. user clicks a built-in preset, which also updates customColor).
  useEffect(() => {
    if (customColorInputRef.current) customColorInputRef.current.value = customColor;
    if (customColorTextRef.current) customColorTextRef.current.textContent = customColor;
  }, [customColor]);

  return (
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

      <TabsContent value="pattern" className="p-5 m-0 max-h-[420px] sm:max-h-[520px] lg:max-h-[650px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: "#FFFFFF" }}>
        <div className="flex items-center justify-between gap-2 mb-4 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <Palette className="w-4 h-4 text-[#8B6F47] flex-shrink-0" />
            <p style={{ color: "#7A6B5E", fontSize: "0.8rem", fontWeight: 500 }}>
              {isMultiSelectMode ? "Klik motif yang ingin ditambahkan:" : "Pilih motif untuk diletakkan di kanvas:"}
            </p>
          </div>
          <button
            onClick={toggleMultiSelectMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex-shrink-0 cursor-pointer"
            style={{
              background: isMultiSelectMode ? "linear-gradient(135deg, #8B6F47 0%, #A0845E 100%)" : "rgba(139,111,71,0.08)",
              color: isMultiSelectMode ? "#FFFFFF" : "#8B6F47",
              border: "1px solid rgba(139,111,71,0.2)",
            }}
          >
            <CheckCircle2 style={{ width: 12, height: 12 }} />
            {isMultiSelectMode ? "Batal" : "Pilih Banyak"}
          </button>
        </div>

        {/* Upload Gambar Card */}
        <div className="mb-5 p-4 rounded-2xl border border-dashed text-center transition-all bg-[#FAF8F5] hover:bg-white hover:border-[#8B6F47] group" style={{ borderColor: "rgba(139,111,71,0.25)" }}>
          <div className="flex flex-col items-center justify-center cursor-pointer" onClick={() => {
            const input = document.getElementById("image-upload-input");
            if (input) input.click();
          }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#8B6F47]/10 text-[#8B6F47] group-hover:bg-[#8B6F47] group-hover:text-white transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#3D2B1F]">Unggah Gambar Kustom</p>
            <p className="text-[10px] text-[#8E7F72] mt-0.5">Mendukung JPG, PNG (maks. 5MB)</p>
          </div>
          <input
            id="image-upload-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                toast.error("Ukuran file maksimal 5MB");
                return;
              }
              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                addUploadedImageToCanvas(dataUrl, file.name);
              };
              reader.readAsDataURL(file);
              e.target.value = ""; // reset input
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pr-1">
          {loading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
          ) : (
            patterns.map((pattern) => {
              const isSelected = selectedPatternIds.has(pattern.id);
              return (
                <button
                  key={pattern.id}
                  onClick={() => {
                    if (isMultiSelectMode) togglePatternSelection(pattern.id);
                    else addItemToCanvas(pattern);
                  }}
                  draggable={!isMultiSelectMode}
                  onDragStart={(e) => {
                    if (isMultiSelectMode) { e.preventDefault(); return; }
                    // [DRAG] Store the pattern id so the canvas drop handler can
                    // look it up and spawn it exactly where the user dropped it.
                    e.dataTransfer.setData("application/x-batik-pattern-id", String(pattern.id));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className={`relative p-2.5 sm:p-3.5 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col items-stretch group ${isMultiSelectMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
                    } ${isSelected ? "bg-[rgba(139,111,71,0.08)]" : "bg-[#FAF8F5] hover:bg-[#FFFFFF]"}`}
                  style={{ borderColor: isSelected ? "#8B6F47" : "rgba(139,111,71,0.12)" }}
                >
                  {isMultiSelectMode && (
                    <div
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all"
                      style={{
                        background: isSelected ? "#8B6F47" : "rgba(255,255,255,0.9)",
                        border: `2px solid ${isSelected ? "#8B6F47" : "rgba(139,111,71,0.3)"}`,
                      }}
                    >
                      {isSelected && <CheckCircle2 style={{ width: 14, height: 14, color: "white" }} />}
                    </div>
                  )}
                  <div className="w-full aspect-square rounded-xl mb-3 overflow-hidden flex items-center justify-center p-2 transition-all bg-[#FAF8F5] group-hover:bg-[#FFFFFF] border"
                    style={{ borderColor: "rgba(139,111,71,0.06)", boxShadow: "inset 0 1px 3px rgba(139,111,71,0.02)" }}>
                    {renderMiniPattern(pattern)}
                  </div>
                  <div style={{ color: "#3D2B1F", fontSize: "0.85rem", fontWeight: 700, marginBottom: "2px", textAlign: "center" }} className="group-hover:text-[#8B6F47] transition-colors text-center">
                    {pattern.name}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {isMultiSelectMode && selectedPatternIds.size > 0 && (
          <div
            className="sticky bottom-0 left-0 right-0 mt-4 -mx-5 px-5 py-3 flex items-center justify-between gap-3"
            style={{ background: "linear-gradient(to top, #FFFFFF 75%, rgba(255,255,255,0.85))", borderTop: "1px solid rgba(139,111,71,0.15)" }}
          >
            <span className="text-xs font-bold text-[#3D2B1F]">{selectedPatternIds.size} motif terpilih</span>
            <button
              onClick={onAddSelectedPatterns}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white cursor-pointer hover:opacity-95"
              style={{ background: "linear-gradient(135deg, #8B6F47 0%, #6B4F2F 100%)" }}
            >
              <Plus className="w-3.5 h-3.5" /> Tambah ke Kanvas
            </button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="color" className="p-5 m-0 max-h-[420px] sm:max-h-[520px] lg:max-h-[650px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: "#FFFFFF" }}>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Palette className="w-4 h-4 text-[#8B6F47]" />
          <p style={{ color: "#7A6B5E", fontSize: "0.8rem", fontWeight: 500 }}>Pilih palet warna motif yang tersedia:</p>
        </div>
        <div className="mb-6 p-4 rounded-2xl border bg-[#FAF8F5]" style={{ borderColor: "rgba(139,111,71,0.12)" }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Brush className="w-4 h-4 text-[#8B6F47]" />
            <p style={{ color: "#3D2B1F", fontSize: "0.85rem", fontWeight: 700 }}>Warna Custom</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold" style={{ color: "#8E7F72" }}>Warna Utama</label>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-10 flex-shrink-0">
                <input
                  type="color"
                  ref={customColorInputRef}
                  defaultValue={customColor}
                  // [OPT-1b] onInput fires on every drag tick — update DOM text only, no setState
                  onInput={(e) => {
                    const v = (e.target as HTMLInputElement).value;
                    if (customColorTextRef.current) customColorTextRef.current.textContent = v;
                  }}
                  // onChange fires on every tick in Chrome's color picker.
                  // Debounce: only commit to React state 120ms after dragging stops.
                  onChange={(e) => {
                    const v = e.target.value;
                    // Update DOM preview immediately (no re-render)
                    if (customColorTextRef.current) customColorTextRef.current.textContent = v;
                    // Debounce the expensive React state update
                    if (colorCommitTimerRef.current) clearTimeout(colorCommitTimerRef.current);
                    colorCommitTimerRef.current = setTimeout(() => {
                      onCustomColorCommit(v);
                      colorCommitTimerRef.current = null;
                    }, 150);
                  }}
                  className="w-full h-full rounded-lg border cursor-pointer"
                  style={{ borderColor: "rgba(139,111,71,0.12)" }}
                />
              </div>
              <span ref={customColorTextRef} className="text-xs font-mono" style={{ color: "#7A6B5E" }}>{customColor}</span>
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
                  // Sync the custom color picker's value to this preset's primary
                  // color too, so switching back to "custom" mode starts from a
                  // sensible value — but without triggering generatePresetFromPrimary
                  // (that would just recompute the same preset we just set).
                  onCustomColorCommit(preset.colors.primary, true);
                }}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${isActive
                  ? "bg-[rgba(139,111,71,0.06)] border-[#8B6F47] border-2 shadow-sm"
                  : "bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#8B6F47]/30 border border-[rgba(139,111,71,0.12)] hover:shadow-sm"
                  }`}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div style={{ color: "#3D2B1F", fontSize: "0.875rem", fontWeight: 700, marginBottom: "2px" }}>{preset.name}</div>
                  <div style={{ color: "#8E7F72", fontSize: "0.725rem" }}>Preset warna motif batik</div>
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

      <TabsContent value="layer" className="p-5 m-0 max-h-[420px] sm:max-h-[520px] lg:max-h-[650px] overflow-y-auto pb-24 sm:pb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: "#FFFFFF" }}>
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
                      setSelectedObject(layer.fabricObject);
                      setSelectedObjectType(detectObjectType(layer.fabricObject)); // [OPT-2]
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5 ${isSelected
                    ? "bg-[rgba(139,111,71,0.06)] border-[#8B6F47] border-2 shadow-sm"
                    : "bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#8B6F47]/20 border border-[rgba(139,111,71,0.12)] hover:shadow-sm"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1 bg-white border border-black/5">
                      <div key={layer.id + "-" + ((layer.fabricObject as any)?.data?.colorPresetName || selectedPreset.name)} className="w-full h-full flex items-center justify-center">
                        {(layer.fabricObject as any)?.data?.imageUrl ? (
                          <img
                            src={(layer.fabricObject as any).data.imageUrl}
                            className="w-full h-full object-cover rounded"
                            alt="Preview"
                          />
                        ) : layer.type === "pattern" ? (
                          renderMiniPattern(
                            patterns.find((p) => p.id === (layer.fabricObject as any)?.data?.patternId) || patterns[0],
                            (layer.fabricObject as any)?.data?.colorPresetName,
                            (layer.fabricObject as any)?.data?.customColor
                          )
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            {(() => {
                              const obj = layer.fabricObject;
                              if (!obj) return <Brush className="w-5 h-5 opacity-60" style={{ color: layer.brushColor || "#8B6F47" }} />;
                              const t = detectObjectType(obj); // [OPT-2]
                              if (t === "text") return <Type className="w-5 h-5 opacity-60" style={{ color: (obj as any).fill || "#3D2B1F" }} />;
                              if (t === "shape") {
                                const ct = obj.constructor?.name?.toLowerCase() ?? "";
                                if (ct.includes("line") || obj.type === "line") return <Slash className="w-5 h-5 opacity-60" style={{ color: (obj as any).stroke || "#3D2B1F" }} />;
                                if (ct.includes("ellipse") || obj.type === "ellipse") return <Circle className="w-5 h-5 opacity-60" style={{ color: (obj as any).fill || (obj as any).stroke || "#3D2B1F" }} />;
                                if (ct.includes("polygon") || obj.type === "polygon") return <Star className="w-5 h-5 opacity-60" style={{ color: (obj as any).fill || (obj as any).stroke || "#3D2B1F" }} />;
                                return <Square className="w-5 h-5 opacity-60" style={{ color: (obj as any).fill || (obj as any).stroke || "#3D2B1F" }} />;
                              }
                              return <Brush className="w-5 h-5 opacity-60" style={{ color: layer.brushColor || "#8B6F47" }} />;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#3D2B1F" }}>{layer.name}</p>
                      <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "#8B6F47" }}>
                        {(layer.fabricObject as any)?.data?.imageUrl ? "Gambar Kustom" : layer.type === "pattern" ? "Motif" : (() => {
                          const obj = layer.fabricObject;
                          if (!obj) return "Gambar Bebas";
                          const t = detectObjectType(obj); // [OPT-2]
                          if (t === "text") return "Teks";
                          if (t === "shape") return "Bentuk";
                          return "Gambar Bebas";
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2 border-black/5">
                    <div className="flex items-center gap-0.5 sm:gap-1">
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
                      <button
                        onClick={(e) => { e.stopPropagation(); flipLayer(layer.id, "x"); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-white hover:bg-slate-100 border"
                        style={{ borderColor: "rgba(139,111,71,0.1)" }}
                        title="Balik Horisontal (Hadap Kiri/Kanan)"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5 text-[#8B6F47]" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); flipLayer(layer.id, "y"); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-white hover:bg-slate-100 border"
                        style={{ borderColor: "rgba(139,111,71,0.1)" }}
                        title="Balik Vertikal (Hadap Atas/Bawah)"
                      >
                        <FlipVertical className="w-3.5 h-3.5 text-[#8B6F47]" />
                      </button>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-white hover:bg-slate-100 border"
                        style={{ borderColor: "rgba(139,111,71,0.1)" }} title={layer.visible ? "Sembunyikan layer" : "Tampilkan layer"}>
                        {layer.visible ? <Eye className="w-3.5 h-3.5 text-[#8B6F47]" /> : <EyeOff className="w-3.5 h-3.5 text-[#8B6F47]" />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-white hover:bg-slate-100 border"
                        style={{ borderColor: "rgba(139,111,71,0.1)" }} title={layer.locked ? "Buka kunci" : "Kunci layer"}>
                        {layer.locked ? <Lock className="w-3.5 h-3.5 text-[#8B6F47]" /> : <Unlock className="w-3.5 h-3.5 text-[#8B6F47]" />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-white hover:bg-slate-100 border"
                        style={{ borderColor: "rgba(139,111,71,0.1)" }} title="Duplikat layer">
                        <Copy className="w-3.5 h-3.5 text-[#8B6F47]" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); deleteSelectedLayer(); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 bg-red-50 hover:bg-red-100 border"
                        style={{ borderColor: "rgba(220,38,38,0.15)" }} title="Hapus layer">
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
  );
});
SidebarTabs.displayName = "SidebarTabs";

// Available typography options for Batik designs
const AVAILABLE_FONTS = [
  {
    name: "Playfair Display",
    value: "'Playfair Display', serif",
    category: "Elegan",
    description: "Serif klasik khas batik keraton",
  },
  {
    name: "Cinzel",
    value: "'Cinzel', serif",
    category: "Keraton",
    description: "Inskripsi megah warisan budaya",
  },
  {
    name: "Cormorant Garamond",
    value: "'Cormorant Garamond', serif",
    category: "Tradisional",
    description: "Serif sastra klasik bernuansa halus",
  },
  {
    name: "Great Vibes",
    value: "'Great Vibes', cursive",
    category: "Kaligrafi",
    description: "Gaya canting luwes mengalir",
  },
  {
    name: "Plus Jakarta Sans",
    value: "'Plus Jakarta Sans', sans-serif",
    category: "Nusantara",
    description: "Sans kontemporer asli Indonesia",
  },
  {
    name: "Inter",
    value: "'Inter', sans-serif",
    category: "Modern",
    description: "Minimalis bersih dan jelas",
  },
  {
    name: "Courier Prime",
    value: "'Courier Prime', monospace",
    category: "Klasik",
    description: "Monospace mesin ketik vintage",
  },
  {
    name: "Serif Standar",
    value: "serif",
    category: "Serif",
    description: "Font serif bawaan sistem",
  },
  {
    name: "Sans Standar",
    value: "sans-serif",
    category: "Sans",
    description: "Font sans-serif bawaan sistem",
  },
];

const FontPicker = ({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (font: string) => void;
  compact?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentFont = AVAILABLE_FONTS.find(f => f.value === value) || {
    name: value.replace(/['",]/g, "").split(" ")[0] || value,
    value,
    category: "Kustom",
    description: ""
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => {
            // Prevent blur from canvas/text editing
            e.preventDefault();
          }}
          className={`${compact ? "h-7 px-2 text-[11px]" : "h-8 px-2.5 sm:px-3 text-xs"} rounded-lg font-semibold border flex items-center justify-between gap-1.5 transition-all hover:bg-white hover:shadow-xs cursor-pointer min-w-[125px] sm:min-w-[155px]`}
          style={{
            borderColor: isOpen ? "#8B6F47" : "rgba(212,184,139,0.35)",
            background: "#FAF9F6",
            color: "#3D2B1F",
            boxShadow: isOpen ? "0 0 0 2px rgba(139,111,71,0.2)" : "none",
          }}
          title="Pilih Jenis Huruf"
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Type style={{ width: compact ? "11px" : "12px", height: compact ? "11px" : "12px", color: "#8B6F47", flexShrink: 0 }} />
            <span
              className="truncate font-medium"
              style={{ fontFamily: value }}
            >
              {currentFont.name}
            </span>
          </div>
          <ChevronDown
            style={{
              width: "11px",
              height: "11px",
              color: "#8B6F47",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
              flexShrink: 0
            }}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-64 sm:w-72 max-h-72 overflow-y-auto rounded-xl shadow-2xl z-[999] border p-1.5"
        style={{
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(212,184,139,0.4)",
          boxShadow: "0 12px 36px -4px rgba(61,43,31,0.25), 0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A89B8F] border-b mb-1 flex items-center justify-between" style={{ borderColor: "rgba(212,184,139,0.2)" }}>
          <span>Pilihan Tipografi</span>
          <span className="text-[9px] font-normal text-[#A89B8F]">{AVAILABLE_FONTS.length} jenis</span>
        </div>

        <div className="space-y-0.5">
          {AVAILABLE_FONTS.map((f) => {
            const isSelected = value === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(f.value);
                  setIsOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all cursor-pointer group hover:bg-[#FAF6EE]"
                style={{
                  background: isSelected ? "rgba(139,111,71,0.12)" : "transparent",
                }}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span
                    className="text-[13px] font-semibold truncate transition-colors"
                    style={{
                      fontFamily: f.value,
                      color: isSelected ? "#8B6F47" : "#3D2B1F"
                    }}
                  >
                    {f.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-medium"
                      style={{
                        background: isSelected ? "rgba(139,111,71,0.2)" : "rgba(139,111,71,0.08)",
                        color: isSelected ? "#6B5234" : "#8B6F47",
                      }}
                    >
                      {f.category}
                    </span>
                    <span className="text-[10px] text-[#A89B8F] truncate hidden sm:inline">
                      {f.description}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle2 style={{ width: "13px", height: "13px", color: "#8B6F47", flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Main Component
export function CustomBatikPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToCart: addToCartFromContext } = useCart();
  const { isFullMode, setIsFullMode } = useFullscreen();

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
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  const [projectInfo, setProjectInfo] = useState({ name: "", description: "", fabric: "Katun Primisima" });
  const [savedDesignId, setSavedDesignId] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyLength, setHistoryLength] = useState(0);
  const [patternHistoryIndex, setPatternHistoryIndex] = useState(-1);
  const [patternHistoryLength, setPatternHistoryLength] = useState(0);
  const [hasOffscreenContent, setHasOffscreenContent] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return !isProceeding && hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname;
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(colorPresets[0]);
  const [customColor, setCustomColor] = useState(colorPresets[0].colors.primary);
  const [sidebarPreset, setSidebarPreset] = useState(blackPreset);
  const [sidebarCustomColor, setSidebarCustomColor] = useState("#000000");
  const [activeTab, setActiveTab] = useState("pattern");

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedPatternIds, setSelectedPatternIds] = useState<Set<number>>(new Set());

  const toggleMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode((prev) => {
      const next = !prev;
      if (!next) setSelectedPatternIds(new Set());
      return next;
    });
  }, []);

  const togglePatternSelection = useCallback((patternId: number) => {
    setSelectedPatternIds((prev) => {
      const next = new Set(prev);
      if (next.has(patternId)) next.delete(patternId);
      else next.add(patternId);
      return next;
    });
  }, []);

  const [isCanvasMultiSelectMode, setIsCanvasMultiSelectMode] = useState(false);
  const [canvasSelectedIds, setCanvasSelectedIds] = useState<Set<string>>(new Set());

  const toggleCanvasMultiSelectMode = useCallback(() => {
    setIsCanvasMultiSelectMode((prev) => {
      const next = !prev;
      const fc = fabricCanvasRef.current;
      if (!fc) return next;

      fc.discardActiveObject();
      if (next) {
        // Masuk mode pilih banyak: matikan selection Fabric, selectable pada objek
        // Kita biarkan evented=true agar findTarget bisa mendeteksi klik
        fc.selection = false;
        fc.defaultCursor = "pointer";
        fc.forEachObject((obj) => {
          (obj as any)._oldSelectable = obj.selectable;
          obj.selectable = false;
        });
      } else {
        // Keluar mode pilih banyak: kembalikan ke select normal
        fc.selection = true;
        fc.defaultCursor = "default";
        fc.forEachObject((obj) => {
          if ((obj as any)._oldSelectable !== undefined) {
            obj.selectable = (obj as any)._oldSelectable;
            delete (obj as any)._oldSelectable;
          } else {
            obj.selectable = true;
          }
        });
      }
      fc.requestRenderAll();
      setCanvasSelectedIds(new Set());
      return next;
    });
  }, []);

  const [canvasBackground, setCanvasBackground] = useState("#ffffff");
  const [committedBg, setCommittedBg] = useState("#ffffff");
  const [shapeType, setShapeType] = useState<ShapeType>("rect");
  const [shapeFill, setShapeFill] = useState("#8B6F47");
  const [shapeStroke, setShapeStroke] = useState("#3D2B1F");
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(0);
  const [shapeOpacity, setShapeOpacity] = useState(100);
  const [textColor, setTextColor] = useState("#3D2B1F");
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("serif");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isLinethrough, setIsLinethrough] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<"pattern" | "shape" | "text" | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [charSpacing, setCharSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [showObjectMenu, setShowObjectMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ width: 0, height: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [toolbarUpdate, setToolbarUpdate] = useState(0);


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isRestoringRef = useRef(false);
  const skipAutoTabSwitchRef = useRef(false);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const initialOffscreenImageDataRef = useRef<ImageData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalScrollThumbRef = useRef<HTMLDivElement>(null);
  const verticalScrollThumbRef = useRef<HTMLDivElement>(null);
  const horizontalScrollTrackRef = useRef<HTMLDivElement>(null);
  const verticalScrollTrackRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastMidRef = useRef<{ x: number; y: number } | null>(null);
  const activeToolRef = useRef<Tool>("select");
  const brushSizeRef = useRef(16);
  const brushColorRef = useRef("#8B6F47");
  const brushOpacityRef = useRef(80);
  const offscreenHistoryRef = useRef<string[]>([]);
  const offscreenHistoryIndexRef = useRef<number>(-1);
  const copiedObjectsRef = useRef<fabric.Object[]>([]);

  const undoBrushRef = useRef<() => void>(() => { });
  const redoBrushRef = useRef<() => void>(() => { });
  const undoPatternRef = useRef<() => void>(() => { });
  const redoPatternRef = useRef<() => void>(() => { });

  const actionStackRef = useRef<("pattern" | "brush" | "bgcolor")[]>([]);
  const redoStackRef = useRef<("pattern" | "brush" | "bgcolor")[]>([]);
  const bgColorHistoryRef = useRef<string[]>(["#ffffff"]);
  const bgColorHistoryIndexRef = useRef<number>(0);
  const isInitRef = useRef(true);
  const isRecoloringRef = useRef(false);
  const recoloringCountRef = useRef(0);
  const undoAllRef = useRef<() => void>(() => { });
  const redoAllRef = useRef<() => void>(() => { });
  const layerItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastMousedownInCanvasRef = useRef(false);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const shapePreviewRef = useRef<fabric.Object | null>(null);
  const shapeTypeRef = useRef<ShapeType>("rect");
  const shapeFillRef = useRef("#8B6F47");
  const shapeStrokeRef = useRef("#3D2B1F");
  const shapeStrokeWidthRef = useRef(0);
  const shapeOpacityRef = useRef(100);
  const textColorRef = useRef("#3D2B1F");
  const fontSizeRef = useRef(32);
  const fontFamilyRef = useRef("serif");
  const isBoldRef = useRef(false);
  const isItalicRef = useRef(false);
  const isUnderlineRef = useRef(false);
  const isLinethroughRef = useRef(false);
  const textAlignRef = useRef<"left" | "center" | "right">("center");
  const textSelectionRef = useRef<{ obj: fabric.IText; start: number; end: number; hasSelection: boolean } | null>(null);
  const syncTextStyleRef = useRef<((textObj: fabric.IText) => void) | null>(null);
  const zoomLevelRef = useRef(100);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  // [PANZOOM-FIX] Tracks the current "fit container width" scale factor
  // (i.e. containerWidth / 800), updated only by container resize (updateSize).
  // The actual Fabric zoom = baseScale * (zoomLevel / 100). Keeping these two
  // separate prevents container resizes (e.g. entering/exiting fullmode) from
  // corrupting the user's manual pan/zoom — previously updateSize() called
  // fc.setZoom(width/800) directly, which silently kept whatever pan offset was
  // already in the viewportTransform, producing a scale+pan combo that no longer
  // matched what the user was actually looking at (items appeared to vanish or
  // jump into a corner).
  const baseScaleRef = useRef(1);
  const isFullModeRef = useRef(false);
  // [FULLMODE-CENTER] Tracks the current canvas left/top offset (px) needed to
  // center the 4:3 canvas within its container. In normal mode the container IS
  // 4:3 (via aspect-[4/3]) so this stays {0,0}. In fullmode the container is the
  // entire viewport (often much taller than 4:3 on phones), so the canvas is
  // "letterboxed": sized to fit both width and height, then centered via this offset.
  const canvasOffsetRef = useRef({ x: 0, y: 0 });

  // [OPT-1] Refs for uncontrolled color picker (no setState during drag)
  const bgColorRef = useRef("#ffffff");
  const bgColorInputRef = useRef<HTMLInputElement>(null);
  const bgColorSwatchRef = useRef<HTMLDivElement>(null);
  // [OPT-canvas-preset] Debounce timer ref for canvas custom color picker commits
  const canvasColorCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgColorInputRefFull = useRef<HTMLInputElement>(null);
  const bgColorSwatchRefFull = useRef<HTMLDivElement>(null);
  const isApplyingBgUndoRef = useRef(false);
  // [DRAG] Ref to addItemToCanvas so handleCanvasDrop (defined earlier in source
  // order) can call the latest version without a temporal-dead-zone issue.
  const addItemToCanvasRef = useRef<((pattern: BatikItem, dropCoords?: { x: number; y: number }) => void) | null>(null);
  const isDraggingObjectRef = useRef(false);

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
  useEffect(() => { isBoldRef.current = isBold; }, [isBold]);
  useEffect(() => { isItalicRef.current = isItalic; }, [isItalic]);
  useEffect(() => { isUnderlineRef.current = isUnderline; }, [isUnderline]);
  useEffect(() => { isLinethroughRef.current = isLinethrough; }, [isLinethrough]);
  useEffect(() => { textAlignRef.current = textAlign; }, [textAlign]);
  useEffect(() => { isFullModeRef.current = isFullMode; }, [isFullMode]);
  useEffect(() => {
    return () => {
      setIsFullMode(false);
    };
  }, [setIsFullMode]);
  // resetZoomRef allows the isFullMode useEffect below to call resetZoom
  // before the resetZoom useCallback is declared (forward reference pattern).
  const resetZoomRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    // Mode Perkakas Lengkap does not alter window scroll
  }, [isFullMode]);

  // Synchronize text formatting state from active object or text selection
  const syncTextStyleFromObject = useCallback((textObj: fabric.IText) => {
    let bold = false;
    let italic = false;
    let underline = false;
    let strike = false;
    let align = (textObj.textAlign || "left") as "left" | "center" | "right";
    let color = typeof textObj.fill === "string" ? textObj.fill : "#3D2B1F";
    let font = textObj.fontFamily || "serif";
    let size = textObj.fontSize || 32;

    const start = Math.min(textObj.selectionStart ?? 0, textObj.selectionEnd ?? 0);
    const end = Math.max(textObj.selectionStart ?? 0, textObj.selectionEnd ?? 0);

    if (textObj.isEditing && start !== end && typeof (textObj as any).getSelectionStyles === "function") {
      const selStyles = (textObj as any).getSelectionStyles(start, end, true) as any[];
      if (selStyles && selStyles.length > 0) {
        const first = selStyles[0];
        bold = first.fontWeight === "bold" || first.fontWeight === "700" || first.fontWeight === 700;
        italic = first.fontStyle === "italic";
        underline = !!first.underline;
        strike = !!first.linethrough;
        if (first.fill && typeof first.fill === "string") color = first.fill;
        if (first.fontFamily) font = first.fontFamily;
        if (typeof first.fontSize === "number") size = first.fontSize;
      }
    } else {
      bold = textObj.fontWeight === "bold" || textObj.fontWeight === "700" || (textObj.fontWeight as any) === 700;
      italic = textObj.fontStyle === "italic";
      underline = !!textObj.underline;
      strike = !!textObj.linethrough;
    }

    setIsBold(bold);
    setIsItalic(italic);
    setIsUnderline(underline);
    setIsLinethrough(strike);
    setTextAlign(align);
    setTextColor(color);
    setFontFamily(font);
    setFontSize(size);
  }, []);

  useEffect(() => {
    syncTextStyleRef.current = syncTextStyleFromObject;
  }, [syncTextStyleFromObject]);

  // Sync selected object state
  useEffect(() => {
    if (!selectedObject) return;
    if (selectedObjectType === "shape") {
      if (typeof selectedObject.fill === 'string') setShapeFill(selectedObject.fill);
      if (typeof selectedObject.stroke === 'string') setShapeStroke(selectedObject.stroke);
      if (typeof selectedObject.strokeWidth === 'number') setShapeStrokeWidth(selectedObject.strokeWidth);
      if (typeof selectedObject.opacity === 'number') setShapeOpacity(selectedObject.opacity * 100);
    }
    if (selectedObjectType === "text") {
      const textObj = selectedObject as fabric.IText;
      syncTextStyleFromObject(textObj);
    } else {
      textSelectionRef.current = null;
    }
  }, [selectedObject, selectedObjectType, syncTextStyleFromObject]);

  // Update selected shape when shape state changes
  useEffect(() => {
    if (!selectedObject || selectedObjectType !== "shape") return;
    let needsRender = false;
    const obj = selectedObject;
    if (typeof obj.fill === 'string' && obj.fill !== shapeFill) { obj.set("fill", shapeFill); needsRender = true; }
    if (typeof obj.stroke === 'string' && obj.stroke !== shapeStroke) { obj.set("stroke", shapeStroke); needsRender = true; }
    if (typeof obj.strokeWidth === 'number' && obj.strokeWidth !== shapeStrokeWidth) { obj.set("strokeWidth", shapeStrokeWidth); needsRender = true; }
    const targetOpacity = shapeOpacity / 100;
    if (typeof obj.opacity === 'number' && Math.abs(obj.opacity - targetOpacity) > 0.001) { obj.set("opacity", targetOpacity); needsRender = true; }
    if (needsRender) { obj.setCoords(); fabricCanvasRef.current?.requestRenderAll(); }
  }, [shapeFill, shapeStroke, shapeStrokeWidth, shapeOpacity, selectedObject, selectedObjectType]);

  // [OPT-1] Sync canvas background FROM undo/redo (canvasBackground state changes)
  // to the uncontrolled input and DOM elements
  useEffect(() => {
    // Keep ref in sync
    bgColorRef.current = canvasBackground;
    // Sync the uncontrolled input values
    if (bgColorInputRef.current) bgColorInputRef.current.value = canvasBackground;
    if (bgColorInputRefFull.current) bgColorInputRefFull.current.value = canvasBackground;
    // Sync the swatch previews
    if (bgColorSwatchRef.current) bgColorSwatchRef.current.style.background = canvasBackground;
    if (bgColorSwatchRefFull.current) bgColorSwatchRefFull.current.style.background = canvasBackground;
    // Sync the canvas container background preview
    if (containerRef.current) containerRef.current.style.background = canvasBackground;

    if (isApplyingBgUndoRef.current) {
      isApplyingBgUndoRef.current = false;
    }
  }, [canvasBackground]);

  // [OPT-1] Push committed background to unified history
  useEffect(() => {
    if (isInitRef.current) return;
    if (isApplyingBgUndoRef.current) return;
    const lastEntry = bgColorHistoryRef.current[bgColorHistoryIndexRef.current];
    if (lastEntry === committedBg) return;
    bgColorHistoryRef.current = bgColorHistoryRef.current.slice(0, bgColorHistoryIndexRef.current + 1);
    bgColorHistoryRef.current.push(committedBg);
    bgColorHistoryIndexRef.current = bgColorHistoryRef.current.length - 1;
    actionStackRef.current.push("bgcolor");
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [committedBg]);

  // Auto-scroll to selected layer
  useEffect(() => {
    if (!selectedLayerId) return;
    const timer = setTimeout(() => {
      const el = layerItemRefs.current[selectedLayerId];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => clearTimeout(timer);
  }, [selectedLayerId, activeTab]);

  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    if (!isCanvasMultiSelectMode) return;

    let mouseDownPointer: { x: number; y: number } | null = null;

    const handleMouseDown = (options: any) => {
      const e = options.e;
      mouseDownPointer = { x: e.clientX, y: e.clientY };
    };

    const handleMultiClick = (options: any) => {
      const e = options.e;
      if (!mouseDownPointer) return;

      // Check distance moved between mouse down and up to determine if it was a drag/resize
      const dx = e.clientX - mouseDownPointer.x;
      const dy = e.clientY - mouseDownPointer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      mouseDownPointer = null;

      // If moved more than 5 pixels, treat as drag/resize/rotate action, do not toggle selection
      if (dist > 5) return;

      // Use fabric's official findTarget to find the clicked object (ignoring evented/selectable constraints)
      const hitObj = fc.findTarget(e, false);
      if (!hitObj) return;

      const layerId = (hitObj as any).data?.layerId;
      if (!layerId) return;

      setCanvasSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(layerId)) {
          next.delete(layerId);
        } else {
          next.add(layerId);
        }

        // Rebuild ActiveSelection dynamically so the blue bounding box and handles are visible
        fc.discardActiveObject();
        const selectedObjects: fabric.Object[] = [];
        fc.forEachObject((obj) => {
          const id = (obj as any).data?.layerId;
          if (id && next.has(id)) {
            selectedObjects.push(obj);
          }
        });

        if (selectedObjects.length > 0) {
          const sel = new fabric.ActiveSelection(selectedObjects, { canvas: fc });
          fc.setActiveObject(sel);
        }

        fc.requestRenderAll();
        return next;
      });
    };

    fc.on("mouse:down", handleMouseDown);
    fc.on("mouse:up", handleMultiClick);
    return () => {
      fc.off("mouse:down", handleMouseDown);
      fc.off("mouse:up", handleMultiClick);
    };
  }, [isCanvasMultiSelectMode]);

  const isImageDataEqual = (img1: ImageData, img2: ImageData) => {
    if (img1.width !== img2.width || img1.height !== img2.height) return false;
    for (let i = 0; i < img1.data.length; i++) {
      if (img1.data[i] !== img2.data[i]) return false;
    }
    return true;
  };

  const checkOffscreenHasContent = () => {
    const offscreen = offscreenRef.current;
    if (!offscreen) return false;

    // If we have history beyond the initial state, it's definitely not "empty" in terms of user action
    if (offscreenHistoryIndexRef.current > 0) return true;

    const initial = initialOffscreenImageDataRef.current;
    if (!initial) return false;

    const ctx = offscreen.getContext("2d")!;
    // Check the center 800x600 region for visual content
    const current = ctx.getImageData(1600, 1200, 800, 600);
    return !isImageDataEqual(initial, current);
  };

  const syncDisplay = useCallback(() => {
    const display = displayCanvasRef.current;
    const offscreen = offscreenRef.current;
    const fc = fabricCanvasRef.current;
    if (!display || !offscreen || !fc) return;

    const ctx = display.getContext("2d")!;
    const dw = display.width;
    const dh = display.height;
    ctx.clearRect(0, 0, dw, dh);

    const vpt = fc.viewportTransform;
    if (!vpt) return;

    const zoom = fc.getZoom() || 1;
    const srcW = dw / zoom;
    const srcH = dh / zoom;
    const srcX = 1600 - (vpt[4] / zoom);
    const srcY = 1200 - (vpt[5] / zoom);

    ctx.drawImage(offscreen, srcX, srcY, srcW, srcH, 0, 0, dw, dh);
  }, []);

  const updateScrollbars = useCallback(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const hThumb = horizontalScrollThumbRef.current;
    const vThumb = verticalScrollThumbRef.current;
    if (!hThumb || !vThumb) return;
    const vpt = fc.viewportTransform;
    if (!vpt) return;

    const zoom = fc.getZoom() || 1;
    const virtualW = 4000;
    const virtualH = 3000;
    const visibleW = fc.getWidth() / zoom;   // ← dynamic, bukan 800/extraScale
    const visibleH = fc.getHeight() / zoom;  // ← dynamic, bukan 600/extraScale

    const leftX = 1600 - (vpt[4] / zoom);
    const topY = 1200 - (vpt[5] / zoom);

    const hThumbWidthPct = Math.max(10, Math.min(100, (visibleW / virtualW) * 100));
    const vThumbHeightPct = Math.max(10, Math.min(100, (visibleH / virtualH) * 100));
    const maxLeftX = virtualW - visibleW;
    const maxTopY = virtualH - visibleH;

    const hPosPct = maxLeftX > 0 ? Math.max(0, Math.min(100, (leftX / maxLeftX) * (100 - hThumbWidthPct))) : 0;
    const vPosPct = maxTopY > 0 ? Math.max(0, Math.min(100, (topY / maxTopY) * (100 - vThumbHeightPct))) : 0;

    hThumb.style.width = `${hThumbWidthPct}%`;
    hThumb.style.left = `${hPosPct}%`;
    vThumb.style.height = `${vThumbHeightPct}%`;
    vThumb.style.top = `${vPosPct}%`;
  }, []);

  const clampViewport = useCallback((vpt: number[]) => {
    const fc = fabricCanvasRef.current;
    if (!fc) return vpt;
    const zoom = vpt[0];
    const w = fc.getWidth();
    const h = fc.getHeight();

    // Virtual bounds in Fabric logical coordinates:
    // Min X: -1600, Max X: 2400 (total width 4000, centered at 400 logical)
    // Min Y: -1200, Max Y: 1800 (total height 3000, centered at 300 logical)
    let minVpt4 = w - 2400 * zoom;
    let maxVpt4 = 1600 * zoom;
    if (minVpt4 > maxVpt4) {
      // Center the 4000px virtual area if it fits on screen
      vpt[4] = w / 2 - 400 * zoom;
    } else {
      vpt[4] = Math.max(minVpt4, Math.min(maxVpt4, vpt[4]));
    }

    let minVpt5 = h - 1800 * zoom;
    let maxVpt5 = 1200 * zoom;
    if (minVpt5 > maxVpt5) {
      // Center the 3000px virtual area if it fits on screen
      vpt[5] = h / 2 - 300 * zoom;
    } else {
      vpt[5] = Math.max(minVpt5, Math.min(maxVpt5, vpt[5]));
    }
    return vpt;
  }, []);

  const exitTextEditingIfActive = useCallback(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const activeObj = fc.getActiveObject();
    if (activeObj && (activeObj as any).isEditing) {
      (activeObj as any).exitEditing();
    }
    fc.clearContext(fc.contextTop);
    fc.requestRenderAll();
  }, []);

  const onHorizontalScrollDrag = useCallback((e: any) => {
    const track = horizontalScrollTrackRef.current;
    const fc = fabricCanvasRef.current;
    if (!track || !fc) return;

    exitTextEditingIfActive();

    const rect = track.getBoundingClientRect();
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clickPct = (clientX - rect.left) / rect.width;

    const zoom = fc.getZoom() || 1;
    const virtualW = 4000;
    const visibleW = fc.getWidth() / zoom;

    const leftX = (clickPct * virtualW) - (visibleW / 2);
    const clampedLeftX = Math.max(0, Math.min(virtualW - visibleW, leftX));
    const nextPanX = (1600 - clampedLeftX) * zoom;

    const vpt = fc.viewportTransform;
    if (vpt) {
      vpt[4] = nextPanX;
      fc.setViewportTransform(clampViewport(vpt));
      fc.clearContext(fc.contextTop);
      fc.requestRenderAll();
    }
  }, [clampViewport, exitTextEditingIfActive]);

  const onVerticalScrollDrag = useCallback((e: any) => {
    const track = verticalScrollTrackRef.current;
    const fc = fabricCanvasRef.current;
    if (!track || !fc) return;

    exitTextEditingIfActive();

    const rect = track.getBoundingClientRect();
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
    const clickPct = (clientY - rect.top) / rect.height;

    const zoom = fc.getZoom() || 1;
    const virtualH = 3000;
    const visibleH = fc.getHeight() / zoom;

    const topY = (clickPct * virtualH) - (visibleH / 2);
    const clampedTopY = Math.max(0, Math.min(virtualH - visibleH, topY));
    const nextPanY = (1200 - clampedTopY) * zoom;

    const vpt = fc.viewportTransform;
    if (vpt) {
      vpt[5] = nextPanY;
      fc.setViewportTransform(clampViewport(vpt));
      fc.clearContext(fc.contextTop);
      fc.requestRenderAll();
    }
  }, [clampViewport, exitTextEditingIfActive]);

  const syncDisplayTransform = useCallback(() => {
    const display = displayCanvasRef.current;
    const fc = fabricCanvasRef.current;
    if (!display || !fc) return;
    display.style.transform = "";
    display.style.transformOrigin = "";
    syncDisplay();
    updateScrollbars();
  }, [syncDisplay, updateScrollbars]);
  // [PAN-FIX] Stable ref so this can be called from the Fabric "after:render"
  // hook (registered once at canvas init) without needing to re-init Fabric
  // every time the callback identity would otherwise change.
  const syncDisplayTransformRef = useRef(syncDisplayTransform);
  useEffect(() => { syncDisplayTransformRef.current = syncDisplayTransform; }, [syncDisplayTransform]);

  useEffect(() => {
    const offscreen = document.createElement("canvas");
    offscreen.width = 4000;
    offscreen.height = 3000;
    offscreenRef.current = offscreen;
    const ctx = offscreen.getContext("2d")!;
    initialOffscreenImageDataRef.current = ctx.getImageData(1600, 1200, 800, 600);
    offscreenHistoryRef.current = [offscreen.toDataURL("image/png")];
    offscreenHistoryIndexRef.current = 0;
    syncDisplay();
  }, [syncDisplay]);

  const saveSnapshot = useCallback(() => {
    const fc = fabricCanvasRef.current;
    if (!fc || isRestoringRef.current || isRecoloringRef.current) return;
    const serialized = fc.toJSON(["data"]);
    delete serialized.background;
    const json = JSON.stringify(serialized);
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
    setPatternHistoryIndex(historyIndexRef.current);
    setPatternHistoryLength(historyRef.current.length);
    if (!isInitRef.current) {
      actionStackRef.current.push("pattern");
      redoStackRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
      setHasUnsavedChanges(true);
    }
  }, []);

  // Smart text styling: applies to highlighted selection range if active,
  // or applies across the entire text object uniformly when no range is selected.
  const applyTextStyle = useCallback((style: {
    fill?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    underline?: boolean;
    linethrough?: boolean;
    textAlign?: "left" | "center" | "right";
    charSpacing?: number;
    lineHeight?: number;
  }) => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const activeObj = fc.getActiveObject();
    const textObj = (activeObj instanceof fabric.IText ? activeObj : null) ||
      (selectedObject instanceof fabric.IText ? selectedObject : null) ||
      textSelectionRef.current?.obj;

    if (!textObj) return;

    const liveStart = textObj.isEditing ? Math.min(textObj.selectionStart ?? 0, textObj.selectionEnd ?? 0) : 0;
    const liveEnd = textObj.isEditing ? Math.max(textObj.selectionStart ?? 0, textObj.selectionEnd ?? 0) : 0;
    const isLiveSelection = textObj.isEditing && liveStart !== liveEnd;

    const saved = textSelectionRef.current;
    const hasSavedSelection = !!(saved && saved.obj === textObj && saved.hasSelection && saved.start !== saved.end);

    const hasSelection = isLiveSelection || hasSavedSelection;
    const start = isLiveSelection ? liveStart : (saved?.start ?? 0);
    const end = isLiveSelection ? liveEnd : (saved?.end ?? 0);

    if (style.textAlign && style.textAlign !== textObj.textAlign) {
      textObj.set("textAlign", style.textAlign);
    }

    const charStyle: any = { ...style };
    delete charStyle.textAlign;

    if (Object.keys(charStyle).length > 0) {
      if (hasSelection && start !== end) {
        if (typeof (textObj as any).setSelectionStyles === "function") {
          (textObj as any).setSelectionStyles(charStyle, start, end);
        }
        if (textObj.isEditing) {
          textObj.selectionStart = start;
          textObj.selectionEnd = end;
        }
        textSelectionRef.current = { obj: textObj, start, end, hasSelection: true };
      } else {
        Object.entries(charStyle).forEach(([key, val]) => {
          textObj.set(key as any, val);
          if (textObj.styles) {
            for (const lineIdx in textObj.styles) {
              for (const charIdx in textObj.styles[lineIdx]) {
                if (textObj.styles[lineIdx] && textObj.styles[lineIdx][charIdx]) {
                  delete (textObj.styles[lineIdx][charIdx] as any)[key];
                }
              }
            }
          }
        });
      }
    }

    textObj.dirty = true;
    if (typeof (textObj as any).initDimensions === "function") {
      (textObj as any).initDimensions();
    }
    textObj.setCoords();
    fc.requestRenderAll();
    saveSnapshot();

    if (style.fontFamily && (document as any).fonts) {
      (document as any).fonts.load(`16px ${style.fontFamily}`).then(() => {
        textObj.dirty = true;
        (textObj as any).initDimensions?.();
        textObj.setCoords();
        fc.requestRenderAll();
      }).catch(() => {});
    }
  }, [selectedObject, saveSnapshot]);

  const saveOffscreenSnapshot = useCallback(() => {
    const offscreen = offscreenRef.current;
    if (!offscreen) return;
    const dataUrl = offscreen.toDataURL("image/png");
    offscreenHistoryRef.current = offscreenHistoryRef.current.slice(0, offscreenHistoryIndexRef.current + 1);
    offscreenHistoryRef.current.push(dataUrl);
    offscreenHistoryIndexRef.current = offscreenHistoryRef.current.length - 1;
    if (offscreenHistoryRef.current.length > 50) {
      offscreenHistoryRef.current.shift();
      offscreenHistoryIndexRef.current--;
    }
    setHistoryIndex(offscreenHistoryIndexRef.current);
    setHistoryLength(offscreenHistoryRef.current.length);
    if (!isInitRef.current) {
      actionStackRef.current.push("brush");
      redoStackRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
      setHasUnsavedChanges(true);
    }
  }, []);

  const floodFill = useCallback((startX: number, startY: number, fillHex: string, tolerance = 35) => {
    const offscreen = offscreenRef.current;
    if (!offscreen) return;
    const ctx = offscreen.getContext("2d")!;
    const W = offscreen.width;
    const H = offscreen.height;

    // Map starting point to virtual coordinate space
    const vStartX = Math.floor(startX + 1600);
    const vStartY = Math.floor(startY + 1200);

    if (vStartX < 0 || vStartX >= W || vStartY < 0 || vStartY >= H) return;

    const imageData = ctx.getImageData(0, 0, W, H);
    const data = imageData.data;
    const idx = (x: number, y: number) => (y * W + x) * 4;
    const sr = data[idx(vStartX, vStartY)];
    const sg = data[idx(vStartX, vStartY) + 1];
    const sb = data[idx(vStartX, vStartY) + 2];
    const sa = data[idx(vStartX, vStartY) + 3];
    const fr = parseInt(fillHex.slice(1, 3), 16);
    const fg = parseInt(fillHex.slice(3, 5), 16);
    const fb = parseInt(fillHex.slice(5, 7), 16);
    const fa = 255;
    if (sr === fr && sg === fg && sb === fb && sa === fa) return;
    const colorMatch = (x: number, y: number) => {
      const i = idx(x, y);
      return Math.abs(data[i] - sr) <= tolerance && Math.abs(data[i + 1] - sg) <= tolerance &&
        Math.abs(data[i + 2] - sb) <= tolerance && Math.abs(data[i + 3] - sa) <= tolerance;
    };
    const filled = new Uint8Array(W * H);
    const stack: number[] = [vStartX, vStartY];
    filled[vStartY * W + vStartX] = 1;

    while (stack.length > 0) {
      const y = stack.pop()!;
      const x = stack.pop()!;
      const i = idx(x, y);
      data[i] = fr;
      data[i + 1] = fg;
      data[i + 2] = fb;
      data[i + 3] = fa;

      if (x > 0) {
        const p = y * W + (x - 1);
        if (!filled[p] && colorMatch(x - 1, y)) {
          filled[p] = 1;
          stack.push(x - 1, y);
        }
      }
      if (x < W - 1) {
        const p = y * W + (x + 1);
        if (!filled[p] && colorMatch(x + 1, y)) {
          filled[p] = 1;
          stack.push(x + 1, y);
        }
      }
      if (y > 0) {
        const p = (y - 1) * W + x;
        if (!filled[p] && colorMatch(x, y - 1)) {
          filled[p] = 1;
          stack.push(x, y - 1);
        }
      }
      if (y < H - 1) {
        const p = (y + 1) * W + x;
        if (!filled[p] && colorMatch(x, y + 1)) {
          filled[p] = 1;
          stack.push(x, y + 1);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    syncDisplay();
    setHasOffscreenContent(true);
    saveOffscreenSnapshot();
  }, [syncDisplay, saveOffscreenSnapshot]);

  // [PANZOOM-FIX] effective Fabric zoom = baseScale (fit-to-container) * (zoomLevel% / 100)
  const getEffectiveZoom = useCallback((zoomPct: number) => (baseScaleRef.current || 1) * (zoomPct / 100), []);

  const applyZoom = useCallback((newZoom: number, originX?: number, originY?: number) => {
    const fc = fabricCanvasRef.current;
    const container = containerRef.current;
    if (!fc || !container) return;
    exitTextEditingIfActive();
    const clamped = Math.max(50, Math.min(300, Math.round(newZoom / 25) * 25));
    zoomLevelRef.current = clamped;
    setZoomLevel(clamped);
    const scale = getEffectiveZoom(clamped);
    if (originX !== undefined && originY !== undefined) {
      fc.zoomToPoint(new fabric.Point(originX, originY), scale);
    } else {
      const center = fc.getCenter();
      fc.zoomToPoint(new fabric.Point(center.left, center.top), scale);
    }
    if (fc.viewportTransform) {
      fc.setViewportTransform(clampViewport(fc.viewportTransform));
    }
    fc.clearContext(fc.contextTop);
    fc.requestRenderAll();
  }, [getEffectiveZoom, clampViewport, exitTextEditingIfActive]);

  const zoomIn = useCallback(() => applyZoom(zoomLevelRef.current + 25), [applyZoom]);
  const zoomOut = useCallback(() => applyZoom(zoomLevelRef.current - 25), [applyZoom]);
  const resetZoom = useCallback(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    exitTextEditingIfActive();
    const scale = getEffectiveZoom(100);
    fc.setViewportTransform(clampViewport([scale, 0, 0, scale, 0, 0]));
    zoomLevelRef.current = 100;
    setZoomLevel(100);
    fc.clearContext(fc.contextTop);
    fc.requestRenderAll();
  }, [getEffectiveZoom, clampViewport, exitTextEditingIfActive]);
  // Keep resetZoomRef in sync so the isFullMode useEffect can call it
  resetZoomRef.current = resetZoom;

  const restoreSnapshot = useCallback((index: number) => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    isRestoringRef.current = true;
    const json = historyRef.current[index];
    const parsed = JSON.parse(json);
    parsed.background = "";
    fc.loadFromJSON(parsed, () => {
      fc.renderAll();
      isRestoringRef.current = false;
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

  const alignSelectedObject = useCallback((alignment: "left" | "centerH" | "right" | "top" | "centerV" | "bottom") => {
    const fc = fabricCanvasRef.current;
    const obj = selectedObject;
    if (!fc || !obj) return;
    const canvasWidth = 800;
    const canvasHeight = 600;
    const bound = obj.getBoundingRect(true, true);

    if (alignment === "left") {
      obj.set("left", obj.left! - bound.left);
    } else if (alignment === "centerH") {
      obj.set("left", obj.left! + (canvasWidth / 2 - (bound.left + bound.width / 2)));
    } else if (alignment === "right") {
      obj.set("left", obj.left! + (canvasWidth - (bound.left + bound.width)));
    } else if (alignment === "top") {
      obj.set("top", obj.top! - bound.top);
    } else if (alignment === "centerV") {
      obj.set("top", obj.top! + (canvasHeight / 2 - (bound.top + bound.height / 2)));
    } else if (alignment === "bottom") {
      obj.set("top", obj.top! + (canvasHeight - (bound.top + bound.height)));
    }
    obj.setCoords();
    fc.requestRenderAll();
    saveSnapshot();
  }, [selectedObject, saveSnapshot]);

  const rotateSelectedObject = useCallback((deltaDegrees: number) => {
    const fc = fabricCanvasRef.current;
    const obj = selectedObject;
    if (!fc || !obj) return;
    const currentAngle = obj.angle || 0;
    const nextAngle = (currentAngle + deltaDegrees + 360) % 360;
    obj.set("angle", nextAngle);
    obj.setCoords();
    fc.requestRenderAll();
    saveSnapshot();
  }, [selectedObject, saveSnapshot]);

  const sendSelectedObjectToFront = useCallback(() => {
    const fc = fabricCanvasRef.current;
    const obj = selectedObject;
    if (!fc || !obj) return;
    obj.bringToFront();
    fc.requestRenderAll();
    saveSnapshot();
  }, [selectedObject, saveSnapshot]);

  const sendSelectedObjectToBack = useCallback(() => {
    const fc = fabricCanvasRef.current;
    const obj = selectedObject;
    if (!fc || !obj) return;
    obj.sendToBack();
    fc.requestRenderAll();
    saveSnapshot();
  }, [selectedObject, saveSnapshot]);

  const applyBrushSnapshot = useCallback((dataUrl: string) => {
    const offscreen = offscreenRef.current;
    if (!offscreen) return;
    const ctx = offscreen.getContext("2d")!;
    ctx.clearRect(0, 0, 4000, 3000);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      syncDisplay();
      setHasOffscreenContent(checkOffscreenHasContent());
    };
    img.src = dataUrl;
  }, [syncDisplay]);

  const undoBrush = useCallback(() => {
    if (offscreenHistoryIndexRef.current <= 0) return;
    offscreenHistoryIndexRef.current--;
    applyBrushSnapshot(offscreenHistoryRef.current[offscreenHistoryIndexRef.current]);
    setHistoryIndex(offscreenHistoryIndexRef.current);
    setHasOffscreenContent(checkOffscreenHasContent());
  }, [applyBrushSnapshot]);

  const redoBrush = useCallback(() => {
    if (offscreenHistoryIndexRef.current >= offscreenHistoryRef.current.length - 1) return;
    offscreenHistoryIndexRef.current++;
    applyBrushSnapshot(offscreenHistoryRef.current[offscreenHistoryIndexRef.current]);
    setHistoryIndex(offscreenHistoryIndexRef.current);
    setHasOffscreenContent(true);
  }, [applyBrushSnapshot]);

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

  const undoAll = useCallback(() => {
    if (actionStackRef.current.length === 0) return;
    const actionType = actionStackRef.current[actionStackRef.current.length - 1];
    if (actionType === "pattern" && historyIndexRef.current <= 0) { actionStackRef.current.pop(); return; }
    if (actionType === "brush" && offscreenHistoryIndexRef.current <= 0) { actionStackRef.current.pop(); return; }
    if (actionType === "bgcolor" && bgColorHistoryIndexRef.current <= 0) { actionStackRef.current.pop(); return; }
    actionStackRef.current.pop();
    redoStackRef.current.push(actionType);
    if (actionType === "pattern") {
      historyIndexRef.current--;
      restoreSnapshot(historyIndexRef.current);
      setPatternHistoryIndex(historyIndexRef.current);
    } else if (actionType === "bgcolor") {
      isApplyingBgUndoRef.current = true;
      bgColorHistoryIndexRef.current--;
      const prevColor = bgColorHistoryRef.current[bgColorHistoryIndexRef.current] || "#ffffff";
      setCommittedBg(prevColor);
      setCanvasBackground(prevColor);
      if (containerRef.current) containerRef.current.style.background = prevColor;
      if (bgColorSwatchRef.current) bgColorSwatchRef.current.style.background = prevColor;
      if (bgColorInputRef.current) bgColorInputRef.current.value = prevColor;
    } else {
      offscreenHistoryIndexRef.current--;
      applyBrushSnapshot(offscreenHistoryRef.current[offscreenHistoryIndexRef.current]);
      setHistoryIndex(offscreenHistoryIndexRef.current);
      setHasOffscreenContent(checkOffscreenHasContent());
    }
    setCanUndo(actionStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, [restoreSnapshot, applyBrushSnapshot]);

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
        const nextColor = bgColorHistoryRef.current[bgColorHistoryIndexRef.current] || "#ffffff";
        setCommittedBg(nextColor);
        setCanvasBackground(nextColor);
        if (containerRef.current) containerRef.current.style.background = nextColor;
        if (bgColorSwatchRef.current) bgColorSwatchRef.current.style.background = nextColor;
        if (bgColorInputRef.current) bgColorInputRef.current.value = nextColor;
      }
    } else {
      if (offscreenHistoryIndexRef.current < offscreenHistoryRef.current.length - 1) {
        offscreenHistoryIndexRef.current++;
        applyBrushSnapshot(offscreenHistoryRef.current[offscreenHistoryIndexRef.current]);
        setHistoryIndex(offscreenHistoryIndexRef.current);
        setHasOffscreenContent(true);
      }
    }
    setCanUndo(actionStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, [restoreSnapshot, applyBrushSnapshot]);

  useEffect(() => { undoBrushRef.current = undoBrush; }, [undoBrush]);
  useEffect(() => { redoBrushRef.current = redoBrush; }, [redoBrush]);
  useEffect(() => { undoPatternRef.current = undoPattern; }, [undoPattern]);
  useEffect(() => { redoPatternRef.current = redoPattern; }, [redoPattern]);
  useEffect(() => { undoAllRef.current = undoAll; }, [undoAll]);
  useEffect(() => { redoAllRef.current = redoAll; }, [redoAll]);

  const continueStroke = useCallback((fromMid: { x: number; y: number }, control: { x: number; y: number }, toMid: { x: number; y: number }, tool: "brush" | "eraser") => {
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

    // Map logical coordinate (xf, yf) to virtual canvas (4000x3000 centered at (2000, 1500))
    const vFromMidX = fromMid.x + 1600;
    const vFromMidY = fromMid.y + 1200;
    const vControlX = control.x + 1600;
    const vControlY = control.y + 1200;
    const vToMidX = toMid.x + 1600;
    const vToMidY = toMid.y + 1200;

    ctx.beginPath();
    ctx.moveTo(vFromMidX, vFromMidY);
    ctx.quadraticCurveTo(vControlX, vControlY, vToMidX, vToMidY);
    ctx.stroke();
    ctx.restore();
  }, []);

  const startStroke = useCallback((pos: { x: number; y: number }, tool: "brush" | "eraser") => {
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
      ctx.fillStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      const r = parseInt(brushColorRef.current.slice(1, 3), 16);
      const g = parseInt(brushColorRef.current.slice(3, 5), 16);
      const b = parseInt(brushColorRef.current.slice(5, 7), 16);
      const colorStr = `rgba(${r},${g},${b},${brushOpacityRef.current / 100})`;
      ctx.strokeStyle = colorStr;
      ctx.fillStyle = colorStr;
    }

    // Map logical coordinate (xf, yf) to virtual canvas (4000x3000 centered at (2000, 1500))
    const vX = pos.x + 1600;
    const vY = pos.y + 1200;

    ctx.beginPath();
    ctx.arc(vX, vY, brushSizeRef.current / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Fetch patterns
  useEffect(() => {
    async function fetchPatterns() {
      try {
        const { data, error } = await supabase.from("batik_items").select("*").order("id", { ascending: true });
        if (error) throw error;
        const mergedPatterns = mergePatternsWithAssets(data || []);
        setPatterns(mergedPatterns);

        // Pre-load all SVGs to ensure they are available for the sidebar preview
        await Promise.all(mergedPatterns.map(p => loadBatikSvg(p.style_type)));
      } catch (err: any) {
        handleSupabaseError(err, "CustomBatikPage.fetchPatterns");
        setPatterns(batikAssetPatterns);
        // Pre-load fallback assets too
        await Promise.all(batikAssetPatterns.map(p => loadBatikSvg(p.style_type)));
      } finally {
        setLoading(false);
      }
    }
    fetchPatterns();
  }, []);

  // Load design from history if ?editDesignId
  useEffect(() => {
    const editDesignId = searchParams.get("editDesignId");
    if (!editDesignId || !user) return;

    // Guard: Hanya user Premium yang bisa edit desain tersimpan
    const subscriptionPlan = user?.user_metadata?.subscription_plan || "gratis";
    if (subscriptionPlan === "gratis") {
      toast.error("Fitur edit desain tersimpan hanya untuk pengguna Premium.", {
        description: "Upgrade ke Premium untuk membuka fitur ini!",
        duration: 5000,
      });
      navigate("/histori");
      return;
    }

    const loadDesign = async () => {
      try {
        const { data, error } = await supabase.from("custom_designs").select("*").eq("id", editDesignId).eq("user_id", user.id).single();
        if (error || !data) return;
        const waitForCanvas = () => new Promise<void>(resolve => {
          const check = () => { if (fabricCanvasRef.current) resolve(); else setTimeout(check, 100); };
          check();
        });
        await waitForCanvas();
        const fc = fabricCanvasRef.current!;
        let parsed: any = null;
        try { parsed = JSON.parse(data.drawing_data); } catch { return; }
        if (parsed.canvasBackground) setCanvasBackground(parsed.canvasBackground);
        if (parsed.projectInfo) setProjectInfo(parsed.projectInfo);
        if (parsed.objects) {
          fc.loadFromJSON({ objects: parsed.objects, background: parsed.canvasBackground || "#ffffff" }, () => {
            fc.getObjects().forEach((obj: any) => {
              if (obj.data?.layerId) {
                setLayers(prev => [...prev, { id: obj.data.layerId, type: "pattern" as const, name: obj.data.layerName || "Layer", visible: true, locked: false, fabricObject: obj }]);
              }
            });
            fc.requestRenderAll();
            setHasUnsavedChanges(false);
          });
        }
        if (parsed.offscreenDataUrl && offscreenRef.current) {
          const img = new Image();
          img.onload = () => {
            const ctx = offscreenRef.current!.getContext("2d")!;
            ctx.clearRect(0, 0, 4000, 3000);
            if (img.width === 800 && img.height === 600) {
              ctx.drawImage(img, 1600, 1200);
            } else {
              ctx.drawImage(img, 0, 0);
            }
            syncDisplay();
            setHasOffscreenContent(true);
            setHasUnsavedChanges(false);
          };
          img.src = parsed.offscreenDataUrl;
        }
        setSavedDesignId(Number(editDesignId));
        toast.success("Desain berhasil dimuat untuk diedit");
      } catch (err) {
        toast.error("Gagal memuat desain");
      }
    };
    loadDesign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);


  // [OPT-3] keyboard handler — extracted as useCallback outside init useEffect
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const ctrl = isMac ? e.metaKey : e.ctrlKey;

    if (e.key === "Escape" && isFullModeRef.current) {
      let isEditingText = false;
      const activeObj = canvas.getActiveObject();
      if (activeObj) {
        const ctorName = activeObj.constructor?.name?.toLowerCase();
        const isTextObj = ctorName?.includes("text") || activeObj.type === "i-text" || activeObj.type === "text";
        if (isTextObj && (activeObj as any).isEditing) isEditingText = true;
      }
      if (!isEditingText) { e.preventDefault(); setIsFullMode(false); }
      return;
    }

    if (ctrl && e.key === "z" && !e.shiftKey) { e.preventDefault(); undoAllRef.current(); }
    if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redoAllRef.current(); }

    if (ctrl && e.key === "c") {
      e.preventDefault();
      const active = canvas.getActiveObjects();
      if (active.length > 0) copiedObjectsRef.current = active.map(obj => fabric.util.object.clone(obj));
    }

    if (ctrl && e.key === "v") {
      e.preventDefault();
      if (copiedObjectsRef.current.length > 0) {
        const newObjects = copiedObjectsRef.current.map(original => {
          const clone = fabric.util.object.clone(original);
          const newLayerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          (clone as any).data = { ...(original as any).data, layerId: newLayerId, layerName: `${(original as any).data?.layerName || 'Objek'} (copy)` };
          clone.set({ left: (clone.left || 0) + 20, top: (clone.top || 0) + 20, selectable: true, evented: true, hasControls: true, hasBorders: true });
          clone.setCoords();
          return clone;
        });
        newObjects.forEach(obj => {
          canvas.add(obj);
          setLayers(prev => [...prev, { id: (obj as any).data.layerId, type: ((obj as any).data?.patternId ? "pattern" : "drawing") as "pattern" | "drawing", name: (obj as any).data.layerName, visible: true, locked: false, fabricObject: obj }]);
        });
        canvas.discardActiveObject();
        if (newObjects.length > 1) { const sel = new fabric.ActiveSelection(newObjects, { canvas }); canvas.setActiveObject(sel); }
        else if (newObjects.length === 1) { canvas.setActiveObject(newObjects[0]); }
        canvas.requestRenderAll();
        const json = JSON.stringify(canvas.toJSON(["data"]));
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(json);
        historyIndexRef.current = historyRef.current.length - 1;
        if (!isInitRef.current) { actionStackRef.current.push("pattern"); redoStackRef.current = []; setCanUndo(true); setCanRedo(false); }
      }
    }

    if (ctrl && e.key === "a") {
      e.preventDefault();
      canvas.discardActiveObject();
      const allObjects = canvas.getObjects();
      if (allObjects.length > 0) { const sel = new fabric.ActiveSelection(allObjects, { canvas }); canvas.setActiveObject(sel); canvas.requestRenderAll(); }
    }

    if (ctrl && e.key === "d") {
      e.preventDefault();
      const active = canvas.getActiveObjects();
      if (active.length > 0) {
        const newObjects = active.map(original => {
          const clone = fabric.util.object.clone(original);
          const newLayerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          (clone as any).data = { ...(original as any).data, layerId: newLayerId, layerName: `${(original as any).data?.layerName || 'Objek'} (copy)` };
          clone.set({ left: (clone.left || 0) + 20, top: (clone.top || 0) + 20, selectable: true, evented: true, hasControls: true, hasBorders: true });
          clone.setCoords();
          return clone;
        });
        newObjects.forEach(obj => {
          canvas.add(obj);
          setLayers(prev => [...prev, { id: (obj as any).data.layerId, type: ((obj as any).data?.patternId ? "pattern" : "drawing") as "pattern" | "drawing", name: (obj as any).data.layerName, visible: true, locked: false, fabricObject: obj }]);
        });
        canvas.discardActiveObject();
        if (newObjects.length > 1) { const sel = new fabric.ActiveSelection(newObjects, { canvas }); canvas.setActiveObject(sel); }
        else if (newObjects.length === 1) { canvas.setActiveObject(newObjects[0]); }
        canvas.requestRenderAll();
        const json = JSON.stringify(canvas.toJSON(["data"]));
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(json);
        historyIndexRef.current = historyRef.current.length - 1;
        if (!isInitRef.current) { actionStackRef.current.push("pattern"); redoStackRef.current = []; setCanUndo(true); setCanRedo(false); }
      }
    }

    if (ctrl && e.key === "g" && !e.shiftKey) {
      e.preventDefault();
      const active = canvas.getActiveObjects();
      if (active.length > 1) {
        const group = new fabric.Group([], { selectable: true, evented: true, hasControls: true, hasBorders: true });
        const newLayerId = Date.now().toString();
        (group as any).data = { layerId: newLayerId, layerName: 'Grup' };
        canvas.discardActiveObject();
        active.forEach(obj => { canvas.remove(obj); group.addWithUpdate(obj); });
        canvas.add(group);
        const layerIdsToRemove = active.map(obj => (obj as any).data?.layerId).filter(Boolean);
        setLayers(prev => prev.filter(l => !layerIdsToRemove.includes(l.id)));
        setLayers(prev => [...prev, { id: newLayerId, type: 'drawing', name: 'Grup', visible: true, locked: false, fabricObject: group }]);
        canvas.setActiveObject(group);
        group.setCoords();
        canvas.requestRenderAll();
        const json = JSON.stringify(canvas.toJSON(["data"]));
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(json);
        historyIndexRef.current = historyRef.current.length - 1;
        if (!isInitRef.current) { actionStackRef.current.push("pattern"); redoStackRef.current = []; setCanUndo(true); setCanRedo(false); }
      }
    }

    if (ctrl && e.shiftKey && e.key === "g") {
      e.preventDefault();
      const active = canvas.getActiveObject();
      if (active && active.type === 'group') {
        const group = active as fabric.Group;
        const items = group.getObjects();
        canvas.discardActiveObject();
        group._restoreObjectsState();
        canvas.remove(group);
        items.forEach(obj => {
          canvas.add(obj);
          obj.setCoords();
          const newLayerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          (obj as any).data = { ...(obj as any).data, layerId: newLayerId };
          setLayers(prev => [...prev, { id: newLayerId, type: ((obj as any).data?.patternId ? "pattern" : "drawing") as "pattern" | "drawing", name: (obj as any).data?.layerName || 'Objek', visible: true, locked: false, fabricObject: obj }]);
        });
        canvas.requestRenderAll();
        setLayers(prev => prev.filter(l => l.id !== (group as any).data?.layerId));
        const json = JSON.stringify(canvas.toJSON(["data"]));
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(json);
        historyIndexRef.current = historyRef.current.length - 1;
        if (!isInitRef.current) { actionStackRef.current.push("pattern"); redoStackRef.current = []; setCanUndo(true); setCanRedo(false); }
      }
    }

    if (ctrl && e.key === "]") {
      e.preventDefault();
      const active = canvas.getActiveObject();
      if (active) { canvas.bringToFront(active); canvas.requestRenderAll(); }
    }
    if (ctrl && e.key === "[") {
      e.preventDefault();
      const active = canvas.getActiveObject();
      if (active) { canvas.sendToBack(active); canvas.requestRenderAll(); }
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      let isEditingText = false;
      const activeObj = canvas.getActiveObject();
      if (activeObj) {
        const ctorName = activeObj.constructor?.name?.toLowerCase();
        const isTextObj = ctorName?.includes("text") || activeObj.type === "i-text" || activeObj.type === "text";
        if (isTextObj && (activeObj as any).isEditing) isEditingText = true;
      }
      if (!isEditingText) {
        const active = canvas.getActiveObjects();
        if (active.length > 0) {
          const layerIdsToRemove = active.map(obj => (obj as any).data?.layerId).filter(Boolean);
          setLayers(prev => prev.filter(l => !layerIdsToRemove.includes(l.id)));
          active.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          setSelectedLayerId(null);
          setSelectedObject(null);
          setSelectedObjectType(null);
          const json = JSON.stringify(canvas.toJSON(["data"]));
          historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
          historyRef.current.push(json);
          historyIndexRef.current = historyRef.current.length - 1;
          if (!isInitRef.current) { actionStackRef.current.push("pattern"); redoStackRef.current = []; setCanUndo(true); setCanRedo(false); }
        }
      }
    }
  }, [setIsFullMode]); // only setIsFullMode from outer scope; everything else via refs

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "",
      selection: true,
      preserveObjectStacking: true,
      targetFindTolerance: 10,
    });
    const isTouchPrimary = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchPrimary) {
      canvas.selection = false;
    }
    fabricCanvasRef.current = canvas;
    canvas.on("after:render", () => {
      syncDisplayTransformRef.current?.();
      if (canvas.getActiveObject()) {
        setToolbarUpdate(v => v + 1);
      }
    });

    const syncSelectionColor = (target: fabric.Object) => {
      if (target?.data?.layerId) {
        setSelectedLayerId(target.data.layerId);
        if (target.data.colorPresetName) {
          if (target.data.colorPresetName === "Custom") {
            const hex = target.data.customColor || "#000000";
            setCustomColor(hex);
            setSelectedPreset({
              name: "Custom",
              colors: { primary: hex, secondary: hex, accent: hex, background: "transparent" },
              batik: { background: "#f3f3f3", light: hex, mid: hex, dark: hex }
            });
          } else {
            const foundPreset = colorPresets.find((p) => p.name === target.data.colorPresetName);
            if (foundPreset) {
              setSelectedPreset(foundPreset);
              setCustomColor(foundPreset.colors.primary);
            }
          }
        }
      }
    };

    canvas.on("object:selected", (e) => {
      const target = (e as any).target;
      if (!target) { setSelectedObject(null); setSelectedObjectType(null); textSelectionRef.current = null; return; }
      setSelectedObject(target);
      const objType = detectObjectType(target);
      setSelectedObjectType(objType); // [OPT-2]
      syncSelectionColor(target);
      if (target instanceof fabric.IText) {
        syncTextStyleRef.current?.(target);
      }
    });

    canvas.on("selection:updated", (e) => {
      const target = (e as any).target;
      if (!target) { setSelectedObject(null); setSelectedObjectType(null); textSelectionRef.current = null; return; }
      setSelectedObject(target);
      const objType = detectObjectType(target);
      setSelectedObjectType(objType); // [OPT-2]
      syncSelectionColor(target);
      if (target instanceof fabric.IText) {
        syncTextStyleRef.current?.(target);
      }
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
      setSelectedObjectType(null);
      textSelectionRef.current = null;
      if (lastMousedownInCanvasRef.current) setSelectedLayerId(null);
    });

    canvas.on("mouse:down", (e) => {
      if (e.target) {
        // isDraggingObjectRef.current = true; // start tracking for potential follow
        setSelectedObject(e.target);
        const objType = detectObjectType(e.target);
        setSelectedObjectType(objType);
        syncSelectionColor(e.target);
        if (e.target instanceof fabric.IText) {
          syncTextStyleRef.current?.(e.target);
        }
      } else {
        setSelectedObject(null);
        setSelectedObjectType(null);
        setSelectedLayerId(null);
        textSelectionRef.current = null;
      }
    });

    const handleGlobalMousedown = (e: MouseEvent) => {
      const target = e.target as Node;
      const fabricEl = canvas.getElement();
      const wrapper = fabricEl?.parentElement;
      const displayCanvas = displayCanvasRef.current;
      lastMousedownInCanvasRef.current = !!(
        (wrapper && wrapper.contains(target)) ||
        (displayCanvas && displayCanvas.contains(target))
      );
    };
    window.addEventListener("mousedown", handleGlobalMousedown, true);

    canvas.on("object:modified", () => saveSnapshot());
    canvas.on("object:removed", () => saveSnapshot());

    // Update toolbar position while dragging/scaling/rotating
    const updateToolbar = () => setToolbarUpdate(v => v + 1);
    canvas.on("object:moving", updateToolbar);
    canvas.on("object:scaling", updateToolbar);
    canvas.on("object:rotating", updateToolbar);
    canvas.on("selection:updated", updateToolbar);
    canvas.on("selection:cleared", updateToolbar);

    // ── Text editing undo checkpoint ─────────────────────────────────────────
    // Strategy: maintain a SEPARATE string-level history for the active text 
    // object. Ctrl+Z inside editing restores previous text WITHOUT exiting. 
    // Only when text history is exhausted does Ctrl+Z fall through to the 
    // canvas-level undo (which removes the text box). 
    // canvas.toJSON() is NOT used during editing — Fabric doesn't serialize 
    // the live editing buffer, so we store raw strings instead. 

    let textHistory: string[] = [];
    let textHistoryCursor = -1;
    let activeTextObj: fabric.IText | null = null;
    let textDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let textUndoKeyHandler: ((e: KeyboardEvent) => void) | null = null;

    const pushTextSnapshot = (value: string) => {
      textHistory = textHistory.slice(0, textHistoryCursor + 1);
      if (textHistory[textHistoryCursor] === value) return; // dedupe 
      textHistory.push(value);
      textHistoryCursor = textHistory.length - 1;
    };

    const clearTextHistory = () => {
      textHistory = [];
      textHistoryCursor = -1;
      if (textDebounceTimer) { clearTimeout(textDebounceTimer); textDebounceTimer = null; }
      if (textUndoKeyHandler && activeTextObj) {
        canvas.getElement().removeEventListener("keydown", textUndoKeyHandler, true);
        textUndoKeyHandler = null;
      }
      activeTextObj = null;
    };

    const startTextEditing = (textObj: fabric.IText) => {
      clearTextHistory();
      activeTextObj = textObj;
      // Seed with current text 
      textHistory = [textObj.text ?? ""];
      textHistoryCursor = 0;

      const scheduleSnapshot = () => {
        if (textDebounceTimer) clearTimeout(textDebounceTimer);
        textDebounceTimer = setTimeout(() => {
          textDebounceTimer = null;
          if (!activeTextObj) return;
          // Read from internal _text array — this captures live editing buffer 
          const live = (activeTextObj as any)._text
            ? (activeTextObj as any)._text.join("")
            : (activeTextObj.text ?? "");
          pushTextSnapshot(live);
        }, 300);
      };

      textObj.on("text:changed", scheduleSnapshot);

      const onKey = (e: KeyboardEvent) => {
        const isMac = navigator.platform.toUpperCase().includes("MAC");
        const ctrl = isMac ? e.metaKey : e.ctrlKey;
        if (!ctrl) return;

        const isUndo = e.key === "z" && !e.shiftKey;
        const isRedo = e.key === "y" || (e.key === "z" && e.shiftKey);
        if (!isUndo && !isRedo) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        // Flush pending debounce first so current state is in history 
        if (textDebounceTimer) {
          clearTimeout(textDebounceTimer);
          textDebounceTimer = null;
          const live = (activeTextObj as any)._text
            ? (activeTextObj as any)._text.join("")
            : (activeTextObj?.text ?? "");
          pushTextSnapshot(live);
        }

        if (isUndo) {
          if (textHistoryCursor > 0) {
            // Still have text history — restore previous text, stay in edit mode 
            textHistoryCursor--;
            const restored = textHistory[textHistoryCursor];
            textObj.set("text", restored);
            textObj.selectionStart = restored.length;
            textObj.selectionEnd = restored.length;
            canvas.requestRenderAll();
          }
          // If textHistoryCursor === 0, do nothing — let user press Ctrl+Z again 
          // OUTSIDE editing mode to remove the box (they must exit first) 
        } else if (isRedo) {
          if (textHistoryCursor < textHistory.length - 1) {
            textHistoryCursor++;
            const restored = textHistory[textHistoryCursor];
            textObj.set("text", restored);
            textObj.selectionStart = restored.length;
            textObj.selectionEnd = restored.length;
            canvas.requestRenderAll();
          }
        }
      };

      textUndoKeyHandler = onKey;
      canvas.getElement().addEventListener("keydown", onKey, true);
    };

    canvas.on("text:editing:entered", (e: any) => {
      if (e.target) {
        const textObj = e.target as fabric.IText;
        startTextEditing(textObj);
        syncTextStyleRef.current?.(textObj);
      }
    });

    canvas.on("text:selection:changed", (e: any) => {
      const target = e.target as fabric.IText | undefined;
      if (target) {
        const start = Math.min(target.selectionStart ?? 0, target.selectionEnd ?? 0);
        const end = Math.max(target.selectionStart ?? 0, target.selectionEnd ?? 0);
        textSelectionRef.current = {
          obj: target,
          start,
          end,
          hasSelection: target.isEditing && start !== end,
        };
        syncTextStyleRef.current?.(target);
      }
    });

    canvas.on("text:changed", (e: any) => {
      const target = e.target as fabric.IText | undefined;
      if (target) {
        syncTextStyleRef.current?.(target);
      }
    });

    canvas.on("text:editing:exited", (e: any) => {
      const textObj = e.target as fabric.IText | undefined;
      clearTextHistory();
      if (!textObj) return;
      if (!textObj.text?.trim()) {
        canvas.remove(textObj);
        const lid = (textObj as any).data?.layerId;
        if (lid) setLayers(prev => prev.filter(l => l.id !== lid));
        setSelectedLayerId(null);
        textSelectionRef.current = null;
      } else {
        textSelectionRef.current = {
          obj: textObj,
          start: 0,
          end: 0,
          hasSelection: false,
        };
        syncTextStyleRef.current?.(textObj);
      }
      // Commit final text state to main canvas history 
      saveSnapshot();
    });
    // ─────────────────────────────────────────────────────────────────────────

    // [#27] Track start state of scaling/cropping
    canvas.on("before:transform", (e) => {
      const obj = e.transform?.target as any;
      if (obj && obj.type === "image") {
        obj.data = obj.data || {};
        obj.data.startScaleX = obj.scaleX ?? 1;
        obj.data.startScaleY = obj.scaleY ?? 1;
        obj.data.startLeft = obj.left ?? 0;
        obj.data.startTop = obj.top ?? 0;
        obj.data.startWidth = obj.width ?? 0;
        obj.data.startHeight = obj.height ?? 0;
        obj.data.startCropX = obj.cropX ?? 0;
        obj.data.startCropY = obj.cropY ?? 0;
      }
    });

    // [#27] Smooth Canva-like crop/zoom for middle handles (ml, mr, mt, mb)
    canvas.on("object:scaling", (e) => {
      const obj = e.target as any;
      if (!obj || obj.type !== "image") return;

      const corner: string | undefined = (e as any).transform?.corner;
      if (!corner || !["ml", "mr", "mt", "mb"].includes(corner)) return;

      // Ensure we have starting properties
      if (obj.data?.startScaleX === undefined) {
        obj.data = obj.data || {};
        obj.data.startScaleX = obj.scaleX ?? 1;
        obj.data.startScaleY = obj.scaleY ?? 1;
        obj.data.startLeft = obj.left ?? 0;
        obj.data.startTop = obj.top ?? 0;
        obj.data.startWidth = obj.width ?? 0;
        obj.data.startHeight = obj.height ?? 0;
        obj.data.startCropX = obj.cropX ?? 0;
        obj.data.startCropY = obj.cropY ?? 0;
      }

      const origW = obj.data.originalWidth ?? obj._element?.width ?? obj.data.startWidth ?? obj.width ?? 0;
      const origH = obj.data.originalHeight ?? obj._element?.height ?? obj.data.startHeight ?? obj.height ?? 0;

      const startScaleX = obj.data.startScaleX;
      const startScaleY = obj.data.startScaleY;
      const startLeft = obj.data.startLeft;
      const startTop = obj.data.startTop;
      const startWidth = obj.data.startWidth;
      const startHeight = obj.data.startHeight;
      const startCropX = obj.data.startCropX;
      const startCropY = obj.data.startCropY;
      const startRight = startLeft + startWidth * startScaleX;
      const startBottom = startTop + startHeight * startScaleY;

      // Calculate the target dimensions directly using the mouse pointer to prevent glitching/feedback loops
      const pointer = e.e ? canvas.getPointer(e.e) : { x: obj.left, y: obj.top };

      if (corner === "mr") {
        const targetW = Math.max(10 * startScaleX, pointer.x - startLeft);
        const maxUncroppedW = origW - startCropX;
        if (targetW <= maxUncroppedW * startScaleX) {
          // Crop/uncrop phase
          const newCropW = Math.max(10, targetW / startScaleX);
          obj.scaleX = startScaleX;
          obj.scaleY = startScaleY;
          obj.width = newCropW;
          obj.cropX = startCropX;
          obj.left = startLeft;
        } else {
          // Zoom phase
          const newScale = targetW / maxUncroppedW;
          obj.scaleX = newScale;
          obj.scaleY = newScale;
          obj.width = maxUncroppedW;
          obj.cropX = startCropX;
          obj.left = startLeft + startCropX * (startScaleX - newScale);
        }
      } else if (corner === "ml") {
        const targetW = Math.max(10 * startScaleX, startRight - pointer.x);
        const cropRight = startCropX + startWidth;
        const maxUncroppedW = cropRight;
        if (targetW <= maxUncroppedW * startScaleX) {
          // Crop/uncrop phase
          const newCropW = Math.max(10, targetW / startScaleX);
          const newCropX = cropRight - newCropW;
          obj.scaleX = startScaleX;
          obj.scaleY = startScaleY;
          obj.width = newCropW;
          obj.cropX = newCropX;
          obj.left = startLeft + (newCropX - startCropX) * startScaleX;
        } else {
          // Zoom phase
          const newScale = targetW / maxUncroppedW;
          obj.scaleX = newScale;
          obj.scaleY = newScale;
          obj.width = maxUncroppedW;
          obj.cropX = 0;
          obj.left = startRight - cropRight * newScale;
        }
      } else if (corner === "mb") {
        const targetH = Math.max(10 * startScaleY, pointer.y - startTop);
        const maxUncroppedH = origH - startCropY;
        if (targetH <= maxUncroppedH * startScaleY) {
          // Crop/uncrop phase
          const newCropH = Math.max(10, targetH / startScaleY);
          obj.scaleX = startScaleX;
          obj.scaleY = startScaleY;
          obj.height = newCropH;
          obj.cropY = startCropY;
          obj.top = startTop;
        } else {
          // Zoom phase
          const newScale = targetH / maxUncroppedH;
          obj.scaleX = newScale;
          obj.scaleY = newScale;
          obj.height = maxUncroppedH;
          obj.cropY = startCropY;
          obj.top = startTop + startCropY * (startScaleY - newScale);
        }
      } else if (corner === "mt") {
        const targetH = Math.max(10 * startScaleY, startBottom - pointer.y);
        const cropBottom = startCropY + startHeight;
        const maxUncroppedH = cropBottom;
        if (targetH <= maxUncroppedH * startScaleY) {
          // Crop/uncrop phase
          const newCropH = Math.max(10, targetH / startScaleY);
          const newCropY = cropBottom - newCropH;
          obj.scaleX = startScaleX;
          obj.scaleY = startScaleY;
          obj.height = newCropH;
          obj.cropY = newCropY;
          obj.top = startTop + (newCropY - startCropY) * startScaleY;
        } else {
          // Zoom phase
          const newScale = targetH / maxUncroppedH;
          obj.scaleX = newScale;
          obj.scaleY = newScale;
          obj.height = maxUncroppedH;
          obj.cropY = 0;
          obj.top = startBottom - cropBottom * newScale;
        }
      }

      obj.setCoords();
      canvas.requestRenderAll();
    });

    // Restrict object movement to virtual canvas bounds: [-1600, 2400] on X and [-1200, 1800] on Y
    canvas.on("object:moving", (e) => {
      // isDraggingObjectRef.current = true; // REMOVED: so toolbar follows during drag
      const obj = e.target;
      if (!obj) return;

      const objWidth = obj.width ? obj.width * (obj.scaleX || 1) : 0;
      const objHeight = obj.height ? obj.height * (obj.scaleY || 1) : 0;

      const minX = -1600;
      const maxX = 2400;
      const minY = -1200;
      const maxY = 1800;

      let leftBoundMin = minX;
      let leftBoundMax = maxX - objWidth;
      let topBoundMin = minY;
      let topBoundMax = maxY - objHeight;

      if (obj.originX === 'center') {
        leftBoundMin = minX + objWidth / 2;
        leftBoundMax = maxX - objWidth / 2;
      }
      if (obj.originY === 'center') {
        topBoundMin = minY + objHeight / 2;
        topBoundMax = maxY - objHeight / 2;
      }

      if (leftBoundMin > leftBoundMax) {
        const temp = leftBoundMin; leftBoundMin = leftBoundMax; leftBoundMax = temp;
      }
      if (topBoundMin > topBoundMax) {
        const temp = topBoundMin; topBoundMin = topBoundMax; topBoundMax = temp;
      }

      if (obj.left !== undefined) {
        obj.left = Math.max(leftBoundMin, Math.min(leftBoundMax, obj.left));
      }
      if (obj.top !== undefined) {
        obj.top = Math.max(topBoundMin, Math.min(topBoundMax, obj.top));
      }
    });

    // canvas.on("object:scaling", () => { isDraggingObjectRef.current = true; });
    // canvas.on("object:rotating", () => { isDraggingObjectRef.current = true; });
    canvas.on("mouse:up", () => {
      if (isDraggingObjectRef.current) {
        isDraggingObjectRef.current = false;
      }
    });

    // [OPT-3] keyboard handler registered here, defined as useCallback above
    window.addEventListener("keydown", handleKeyDown);

    saveSnapshot();
    saveOffscreenSnapshot();
    syncDisplay();

    if (containerRef.current && displayCanvasRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      canvas.setWidth(containerWidth);
      canvas.setHeight(containerWidth * 0.75);
      canvas.setZoom(containerWidth / 800);
      baseScaleRef.current = containerWidth / 800;
      displayCanvasRef.current.style.width = `${containerWidth}px`;
      displayCanvasRef.current.style.height = `${containerWidth * 0.75}px`;
      setCanvasDisplaySize({ width: containerWidth, height: containerWidth * 0.75 });
    }

    isInitRef.current = false;

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleGlobalMousedown, true);
      canvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveSnapshot, saveOffscreenSnapshot, handleKeyDown]);

  // Event listeners on display canvas
  useEffect(() => {
    const display = displayCanvasRef.current;
    if (!display) return;

    const onStart = (e: MouseEvent | TouchEvent) => {
      const tool = activeToolRef.current;
      const fc = fabricCanvasRef.current;
      if (!fc) return;

      const pointer = fc.getPointer(e);
      const pos = { x: pointer.x, y: pointer.y };

      if (tool === "fill") {
        floodFill(pos.x, pos.y, brushColorRef.current);
        return;
      }
      if (tool !== "brush" && tool !== "eraser") return;
      if (e instanceof TouchEvent) e.preventDefault();
      isDrawingRef.current = true;
      setHasOffscreenContent(true); // Hide "empty" placeholder immediately when starting to draw
      lastPosRef.current = pos;
      lastMidRef.current = pos;
      startStroke(pos, tool);
      syncDisplay();
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      const tool = activeToolRef.current;
      const fc = fabricCanvasRef.current;
      if (!fc) return;

      if (tool !== "brush" && tool !== "eraser") return;
      if (e instanceof TouchEvent) e.preventDefault();

      const pointer = fc.getPointer(e);
      const pos = { x: pointer.x, y: pointer.y };
      const last = lastPosRef.current ?? pos;
      const lastMid = lastMidRef.current ?? last;

      const currentMid = { x: (last.x + pos.x) / 2, y: (last.y + pos.y) / 2 };

      continueStroke(lastMid, last, currentMid, tool);
      syncDisplay();

      lastPosRef.current = pos;
      lastMidRef.current = currentMid;
    };

    const onEnd = () => {
      if (isDrawingRef.current) {
        saveOffscreenSnapshot();
        setHasOffscreenContent(checkOffscreenHasContent());
      }
      isDrawingRef.current = false;
      lastPosRef.current = null;
      lastMidRef.current = null;
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

  // Scrollbar dragging event listeners
  useEffect(() => {
    const hTrack = horizontalScrollTrackRef.current;
    const vTrack = verticalScrollTrackRef.current;
    if (!hTrack || !vTrack) return;

    let activeDrag: "horizontal" | "vertical" | null = null;

    const handleStartDragH = (e: any) => {
      activeDrag = "horizontal";
      onHorizontalScrollDrag(e);
      e.preventDefault();
    };

    const handleStartDragV = (e: any) => {
      activeDrag = "vertical";
      onVerticalScrollDrag(e);
      e.preventDefault();
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (activeDrag === "horizontal") {
        onHorizontalScrollDrag(e);
      } else if (activeDrag === "vertical") {
        onVerticalScrollDrag(e);
      }
    };

    const handleEnd = () => {
      activeDrag = null;
    };

    hTrack.addEventListener("mousedown", handleStartDragH);
    hTrack.addEventListener("touchstart", handleStartDragH, { passive: false });
    vTrack.addEventListener("mousedown", handleStartDragV);
    vTrack.addEventListener("touchstart", handleStartDragV, { passive: false });

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchend", handleEnd);

    return () => {
      hTrack.removeEventListener("mousedown", handleStartDragH);
      hTrack.removeEventListener("touchstart", handleStartDragH);
      vTrack.removeEventListener("mousedown", handleStartDragV);
      vTrack.removeEventListener("touchstart", handleStartDragV);

      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [onHorizontalScrollDrag, onVerticalScrollDrag]);

  // Shape tool event listeners
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const getCanvasPos = (e: any) => { const pointer = fc.getPointer(e.e); return { x: pointer.x, y: pointer.y }; };

    const onMouseDown = (e: any) => {
      if (activeToolRef.current !== "shape") return;
      if (e.target) return;
      const pos = getCanvasPos(e);
      shapeStartRef.current = pos;
      const common = { left: pos.x, top: pos.y, fill: shapeFillRef.current, stroke: shapeStrokeRef.current, strokeWidth: shapeStrokeWidthRef.current, opacity: shapeOpacityRef.current / 100, selectable: false, evented: false, objectCaching: false };
      let preview: fabric.Object;
      if (shapeTypeRef.current === "rect") { preview = new fabric.Rect({ ...common, width: 1, height: 1 }); }
      else if (shapeTypeRef.current === "circle") { preview = new fabric.Ellipse({ ...common, rx: 1, ry: 1 }); }
      else if (shapeTypeRef.current === "triangle") {
        const triPoints = makeTrianglePoints(pos.x, pos.y, 2, 2);
        preview = new fabric.Polygon(triPoints, { ...common, left: pos.x - 1, top: pos.y - 1 });
      }
      else if (shapeTypeRef.current === "diamond") {
        const diamondPoints = makeDiamondPoints(pos.x, pos.y, 2, 2);
        preview = new fabric.Polygon(diamondPoints, { ...common, left: pos.x - 1, top: pos.y - 1 });
      }
      else if (shapeTypeRef.current === "star") {
        const starPoints = makeStarPoints(pos.x, pos.y, 5, 20, 10);
        preview = new fabric.Polygon(starPoints, { ...common, left: pos.x - 20, top: pos.y - 20 });
      } else { preview = new fabric.Line([pos.x, pos.y, pos.x, pos.y], { stroke: shapeStrokeRef.current, strokeWidth: Math.max(shapeStrokeWidthRef.current, 2), selectable: false, evented: false, fill: "", opacity: shapeOpacityRef.current / 100 }); }
      shapePreviewRef.current = preview;
      fc.add(preview);
    };

    const onMouseMove = (e: any) => {
      if (activeToolRef.current !== "shape" || !shapeStartRef.current || !shapePreviewRef.current) return;
      const pos = getCanvasPos(e);
      const start = shapeStartRef.current;
      const preview = shapePreviewRef.current;
      if (shapeTypeRef.current === "rect") { preview.set({ left: Math.min(start.x, pos.x), top: Math.min(start.y, pos.y), width: Math.abs(pos.x - start.x), height: Math.abs(pos.y - start.y) }); }
      else if (shapeTypeRef.current === "circle") { const rx = Math.abs(pos.x - start.x) / 2; const ry = Math.abs(pos.y - start.y) / 2; (preview as fabric.Ellipse).set({ left: Math.min(start.x, pos.x), top: Math.min(start.y, pos.y), rx, ry, width: rx * 2, height: ry * 2 } as any); }
      else if (shapeTypeRef.current === "triangle") {
        const w = Math.max(Math.abs(pos.x - start.x), 2);
        const h = Math.max(Math.abs(pos.y - start.y), 2);
        const cx = Math.min(start.x, pos.x) + w / 2;
        const cy = Math.min(start.y, pos.y) + h / 2;
        (preview as fabric.Polygon).set({ points: makeTrianglePoints(cx, cy, w, h), left: Math.min(start.x, pos.x), top: Math.min(start.y, pos.y), width: w, height: h } as any);
      }
      else if (shapeTypeRef.current === "diamond") {
        const w = Math.max(Math.abs(pos.x - start.x), 2);
        const h = Math.max(Math.abs(pos.y - start.y), 2);
        const cx = Math.min(start.x, pos.x) + w / 2;
        const cy = Math.min(start.y, pos.y) + h / 2;
        (preview as fabric.Polygon).set({ points: makeDiamondPoints(cx, cy, w, h), left: Math.min(start.x, pos.x), top: Math.min(start.y, pos.y), width: w, height: h } as any);
      }
      else if (shapeTypeRef.current === "star") { const cx = (start.x + pos.x) / 2; const cy = (start.y + pos.y) / 2; const r = Math.max(Math.abs(pos.x - start.x), Math.abs(pos.y - start.y)) / 2; (preview as fabric.Polygon).set({ points: makeStarPoints(cx, cy, 5, r, r * 0.45), left: cx - r, top: cy - r, width: r * 2, height: r * 2 } as any); }
      else { (preview as fabric.Line).set({ x2: pos.x, y2: pos.y }); }
      preview.setCoords();
      fc.requestRenderAll();
    };

    const onMouseUp = (e: any) => {
      if (activeToolRef.current !== "shape" || !shapeStartRef.current || !shapePreviewRef.current) return;
      const pos = getCanvasPos(e);
      const start = shapeStartRef.current;
      fc.remove(shapePreviewRef.current);
      shapePreviewRef.current = null;
      shapeStartRef.current = null;
      const common = { fill: shapeFillRef.current, stroke: shapeStrokeRef.current, strokeWidth: shapeStrokeWidthRef.current, opacity: shapeOpacityRef.current / 100, selectable: true, evented: true, objectCaching: false, hasControls: true };
      let finalShape: fabric.Object;
      if (shapeTypeRef.current === "rect") { finalShape = new fabric.Rect({ ...common, left: Math.min(start.x, pos.x), top: Math.min(start.y, pos.y), width: Math.max(Math.abs(pos.x - start.x), 5), height: Math.max(Math.abs(pos.y - start.y), 5) }); }
      else if (shapeTypeRef.current === "circle") { const rx = Math.max(Math.abs(pos.x - start.x) / 2, 3); const ry = Math.max(Math.abs(pos.y - start.y) / 2, 3); finalShape = new fabric.Ellipse({ ...common, left: Math.min(start.x, pos.x), top: Math.min(start.y, pos.y), rx, ry }); }
      else if (shapeTypeRef.current === "triangle") {
        const w = Math.max(Math.abs(pos.x - start.x), 8);
        const h = Math.max(Math.abs(pos.y - start.y), 8);
        const cx = Math.min(start.x, pos.x) + w / 2;
        const cy = Math.min(start.y, pos.y) + h / 2;
        finalShape = new fabric.Polygon(makeTrianglePoints(cx, cy, w, h), { ...common, left: Math.min(start.x, pos.x), top: Math.min(start.y, pos.y) });
      }
      else if (shapeTypeRef.current === "diamond") {
        const w = Math.max(Math.abs(pos.x - start.x), 8);
        const h = Math.max(Math.abs(pos.y - start.y), 8);
        const cx = Math.min(start.x, pos.x) + w / 2;
        const cy = Math.min(start.y, pos.y) + h / 2;
        finalShape = new fabric.Polygon(makeDiamondPoints(cx, cy, w, h), { ...common, left: Math.min(start.x, pos.x), top: Math.min(start.y, pos.y) });
      }
      else if (shapeTypeRef.current === "star") { const cx = (start.x + pos.x) / 2; const cy = (start.y + pos.y) / 2; const r = Math.max(Math.max(Math.abs(pos.x - start.x), Math.abs(pos.y - start.y)) / 2, 15); finalShape = new fabric.Polygon(makeStarPoints(cx, cy, 5, r, r * 0.45), { ...common, left: cx - r, top: cy - r }); }
      else { finalShape = new fabric.Line([start.x, start.y, pos.x, pos.y], { stroke: shapeStrokeRef.current, strokeWidth: Math.max(shapeStrokeWidthRef.current, 2), selectable: true, evented: true, fill: "", opacity: shapeOpacityRef.current / 100, objectCaching: false, hasControls: true }); }
      const newLayerId = Date.now().toString();
      const shapeLabel = shapeTypeRef.current === "rect" ? "Kotak" : shapeTypeRef.current === "circle" ? "Lingkaran" : shapeTypeRef.current === "triangle" ? "Segitiga" : shapeTypeRef.current === "diamond" ? "Belah Ketupat" : shapeTypeRef.current === "star" ? "Bintang" : "Garis";
      (finalShape as any).data = { layerId: newLayerId, layerName: shapeLabel };
      fc.add(finalShape); fc.setActiveObject(finalShape); fc.requestRenderAll();
      setLayers((prev) => [...prev, { id: newLayerId, type: "drawing" as const, name: shapeLabel, visible: true, locked: false, fabricObject: finalShape }]);
      setSelectedLayerId(newLayerId);
      setSelectedObject(finalShape);
      setSelectedObjectType("shape");
      saveSnapshot();
    };

    const handleWheel = (opt: any) => {
      exitTextEditingIfActive();
      const e = opt.e;
      if (e.ctrlKey) {
        // Ctrl + wheel = zoom (existing behavior)
        e.preventDefault();
        applyZoom(zoomLevelRef.current + (e.deltaY < 0 ? 25 : -25), e.offsetX, e.offsetY);
        return;
      }
      // [PAN] Plain wheel (and shift+wheel for horizontal) freely pans the canvas,
      // so the user can navigate anywhere instead of being stuck after a manual
      // zoom/pan with no way back except the Reset Zoom button.
      e.preventDefault();
      const vpt = fc.viewportTransform;
      if (!vpt) return;
      const dx = e.shiftKey ? -e.deltaY : -e.deltaX;
      const dy = e.shiftKey ? 0 : -e.deltaY;
      vpt[4] += dx;
      vpt[5] += dy;
      fc.setViewportTransform(clampViewport(vpt));
      fc.clearContext(fc.contextTop);
      fc.requestRenderAll();
    };

    // [PAN] Middle-mouse-button drag (or Space+left-drag) freely pans the canvas.
    let spaceHeld = false;
    const onKeyDownPan = (e: KeyboardEvent) => { if (e.code === "Space") spaceHeld = true; };
    const onKeyUpPan = (e: KeyboardEvent) => { if (e.code === "Space") spaceHeld = false; };
    window.addEventListener("keydown", onKeyDownPan);
    window.addEventListener("keyup", onKeyUpPan);

    const onPanMouseDown = (opt: any) => {
      const e = opt.e as MouseEvent;
      const isMiddleClick = e.button === 1;
      const isSpaceDrag = e.button === 0 && spaceHeld;
      if (!isMiddleClick && !isSpaceDrag) return;
      e.preventDefault();
      exitTextEditingIfActive();
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      fc.selection = false;
      fc.defaultCursor = "grabbing";
    };
    const onPanMouseMove = (opt: any) => {
      if (!isPanningRef.current || !panStartRef.current) return;
      exitTextEditingIfActive();
      const e = opt.e as MouseEvent;
      const vpt = fc.viewportTransform;
      if (!vpt) return;
      vpt[4] += e.clientX - panStartRef.current.x;
      vpt[5] += e.clientY - panStartRef.current.y;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      fc.setViewportTransform(clampViewport(vpt));
      fc.clearContext(fc.contextTop);
      fc.requestRenderAll();
    };
    const onPanMouseUp = () => {
      if (!isPanningRef.current) return;
      isPanningRef.current = false;
      panStartRef.current = null;
      fc.selection = activeToolRef.current === "select" || activeToolRef.current === "text";
      fc.defaultCursor = "default";
    };

    fc.on("mouse:down", onMouseDown);
    fc.on("mouse:move", onMouseMove);
    fc.on("mouse:up", onMouseUp);
    fc.on("mouse:wheel", handleWheel);
    fc.on("mouse:down", onPanMouseDown);
    fc.on("mouse:move", onPanMouseMove);
    fc.on("mouse:up", onPanMouseUp);



    // [MOBILE-PAN + PINCH-ZOOM v4] Touch pan + pinch-to-zoom 100% di Capture Phase
    //
    // MENYELESAIKAN SEMUA MASALAH SELECTION:
    // 1. Pinch Zoom: Berjalan di Capture Phase sehingga Fabric.js tidak pernah melihat
    //    touch ke-2, menjaga selection tetap utuh.
    // 2. Drag/Pan Canvas: Jika menyeret canvas dari area kosong, kita tangkap di Capture Phase
    //    dan hentikan propagasi ke Fabric (sehingga item tidak ter-unselect).
    // 3. Tap vs Drag: Jika hanya mengetuk area kosong (tanpa seret), kita lakukan unselect
    //    secara manual di end-handler. Jika diseret, selection tetap dipertahankan.
    const fabricEl = fc.getElement();
    const fabricWrapper = fabricEl?.parentElement;
    const panTarget = fabricWrapper ?? fabricEl;

    let touchPanActive = false;
    let touchPanStart = { x: 0, y: 0 };
    let lastPinchMid = { x: 0, y: 0 };
    let touchMoved = false;
    const PAN_THRESHOLD = 5;

    // Pinch-to-zoom state
    let lastPinchDist = 0;
    let isPinching = false;
    // Simpan selection sebelum gesture dimulai
    let pinchSavedActiveObject: fabric.Object | null = null;
    let pinchEndCooldown = false;

    const getTouchDist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchMidpoint = (t: TouchList, rect: DOMRect) => {
      return {
        x: ((t[0].clientX + t[1].clientX) / 2) - rect.left,
        y: ((t[0].clientY + t[1].clientY) / 2) - rect.top,
      };
    };

    const onCaptureStart = (e: TouchEvent) => {
      // --- Pinch-to-zoom (2 Jari) ---
      if (e.touches.length === 2) {
        if (!isPinching) {
          exitTextEditingIfActive();
          pinchSavedActiveObject = fc.getActiveObject() ?? null;
        }
        isPinching = true;
        touchPanActive = false;
        pinchEndCooldown = false;

        const dist = getTouchDist(e.touches);
        lastPinchDist = dist > 0 ? dist : 1;
        const rect = (panTarget as HTMLElement).getBoundingClientRect();
        lastPinchMid = getTouchMidpoint(e.touches, rect);

        e.stopPropagation();
        e.preventDefault();
        return;
      }

      // --- Canvas Pan / Tap Empty Area (1 Jari) ---
      if (e.touches.length === 1 && activeToolRef.current === "select") {
        if (isPinching || pinchEndCooldown) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }

        const target = fc.findTarget(e as any, false);
        // Jika menyentuh area kosong (tidak mengenai object apapun)
        if (!target) {
          exitTextEditingIfActive();
          touchPanActive = true;
          touchMoved = false;
          pinchSavedActiveObject = fc.getActiveObject() ?? null;
          touchPanStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };

          // Blokir dari Fabric agar tidak langsung men-deselect item
          e.stopPropagation();
        }
      }
    };

    const onCaptureMove = (e: TouchEvent) => {
      // 1. Tangani Pinch Zoom (2 Jari)
      if (isPinching && e.touches.length >= 2) {
        e.stopPropagation();
        e.preventDefault();

        const newDist = getTouchDist(e.touches);
        if (lastPinchDist === 0) {
          lastPinchDist = newDist > 0 ? newDist : 1;
          return;
        }

        const ratio = newDist / lastPinchDist;
        lastPinchDist = newDist;

        const rect = (panTarget as HTMLElement).getBoundingClientRect();
        const mid = getTouchMidpoint(e.touches, rect);

        const currentFabricZoom = fc.getZoom();
        const newFabricZoom = Math.max(
          getEffectiveZoom(50),
          Math.min(getEffectiveZoom(400), currentFabricZoom * ratio),
        );

        const newZoomPct = Math.round((newFabricZoom / (baseScaleRef.current || 1)) * 100);
        zoomLevelRef.current = Math.max(50, Math.min(400, newZoomPct));
        setZoomLevel(zoomLevelRef.current);

        fc.zoomToPoint(new fabric.Point(mid.x, mid.y), newFabricZoom);

        const vpt = fc.viewportTransform;
        if (vpt) {
          vpt[4] += mid.x - lastPinchMid.x;
          vpt[5] += mid.y - lastPinchMid.y;
          fc.setViewportTransform(clampViewport(vpt));
        }
        lastPinchMid = mid;
        fc.clearContext(fc.contextTop);
        fc.requestRenderAll();

        if (pinchSavedActiveObject && !fc.getActiveObject()) {
          fc.setActiveObject(pinchSavedActiveObject);
          fc.requestRenderAll();
        }
        return;
      }

      // 2. Tangani Single Finger Canvas Pan (1 Jari)
      if (touchPanActive && e.touches.length === 1) {
        e.stopPropagation();
        e.preventDefault();

        const dx = e.touches[0].clientX - touchPanStart.x;
        const dy = e.touches[0].clientY - touchPanStart.y;

        if (!touchMoved) {
          if (Math.abs(dx) < PAN_THRESHOLD && Math.abs(dy) < PAN_THRESHOLD) return;
          touchMoved = true;
        }

        touchPanStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        const vpt = fc.viewportTransform;
        if (vpt) {
          vpt[4] += dx;
          vpt[5] += dy;
          fc.setViewportTransform(clampViewport(vpt));
          fc.clearContext(fc.contextTop);
          fc.requestRenderAll();
        }

        // Pertahankan selection agar tidak berkedip / hilang selama pan
        if (pinchSavedActiveObject && !fc.getActiveObject()) {
          fc.setActiveObject(pinchSavedActiveObject);
          fc.requestRenderAll();
        }
      }
    };

    const onCaptureEnd = (e: TouchEvent) => {
      // Selesai Pinch Zoom (2 Jari)
      if (isPinching && e.touches.length < 2) {
        e.stopPropagation();
        e.preventDefault();

        isPinching = false;
        lastPinchDist = 0;

        const snappedPct = Math.max(50, Math.min(400, Math.round(zoomLevelRef.current / 5) * 5));
        zoomLevelRef.current = snappedPct;
        setZoomLevel(snappedPct);

        pinchEndCooldown = true;
        requestAnimationFrame(() => {
          if (pinchSavedActiveObject) {
            fc.setActiveObject(pinchSavedActiveObject);
            fc.requestRenderAll();
          }
          pinchSavedActiveObject = null;
          requestAnimationFrame(() => {
            pinchEndCooldown = false;
          });
        });
        return;
      }

      // Selesai Single Finger Pan / Tap
      if (touchPanActive && e.touches.length === 0) {
        e.stopPropagation();
        e.preventDefault();

        // Jika hanya mengetuk area kosong (TIDAK menyeret) → hilangkan selection secara manual
        if (!touchMoved) {
          fc.discardActiveObject();
          fc.requestRenderAll();
          setSelectedObject(null);
          setSelectedObjectType(null);
          setSelectedLayerId(null);
        } else {
          // Jika menyeret/menggeser canvas → Kembalikan selection yang kita amankan tadi
          if (pinchSavedActiveObject) {
            fc.setActiveObject(pinchSavedActiveObject);
            fc.requestRenderAll();
          }
        }

        touchPanActive = false;
        touchMoved = false;
        pinchSavedActiveObject = null;
      }
    };

    if (panTarget) {
      // Daftarkan listener di Capture Phase saja agar mendahului Fabric.js
      panTarget.addEventListener("touchstart", onCaptureStart, { capture: true, passive: false });
      panTarget.addEventListener("touchmove", onCaptureMove, { capture: true, passive: false });
      panTarget.addEventListener("touchend", onCaptureEnd, { capture: true, passive: false });
    }

    return () => {
      fc.off("mouse:down", onMouseDown);
      fc.off("mouse:move", onMouseMove);
      fc.off("mouse:up", onMouseUp);
      fc.off("mouse:wheel", handleWheel);
      fc.off("mouse:down", onPanMouseDown);
      fc.off("mouse:move", onPanMouseMove);
      fc.off("mouse:up", onPanMouseUp);
      window.removeEventListener("keydown", onKeyDownPan);
      window.removeEventListener("keyup", onKeyUpPan);
      if (panTarget) {
        panTarget.removeEventListener("touchstart", onCaptureStart, { capture: true });
        panTarget.removeEventListener("touchmove", onCaptureMove, { capture: true });
        panTarget.removeEventListener("touchend", onCaptureEnd, { capture: true });
      }
    };
  }, [saveSnapshot, applyZoom, clampViewport]);

  // Text tool event listener — mouse:down spawn removed (Canva-style: spawn on toolbar button click)
  useEffect(() => {
    // No mouse:down listener needed; text is spawned directly via spawnTextObject()
    return () => { };
  }, [saveSnapshot]);

  // Switch tool
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    const display = displayCanvasRef.current;
    const fabricWrapper = (fabricCanvasRef as any).wrapper;
    if (!canvas || !display || !fabricWrapper) return;
    syncDisplay();

    const sizeStyle = { width: `${canvas.getWidth()}px`, height: `${canvas.getHeight()}px` };
    if (activeTool === "select") {
      canvas.isDrawingMode = false;
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      canvas.selection = !isTouchDevice;
      canvas.defaultCursor = "default"; canvas.hoverCursor = "move";
      canvas.forEachObject((obj) => { const layerId = (obj as any).data?.layerId; if (!layerId) return; obj.evented = true; obj.selectable = true; });
      canvas.renderAll();
      display.style.position = "absolute"; display.style.top = `${canvasOffsetRef.current.y}px`; display.style.left = `${canvasOffsetRef.current.x}px`; display.style.pointerEvents = "none"; display.style.zIndex = "1"; display.style.width = sizeStyle.width; display.style.height = sizeStyle.height;
      fabricWrapper.style.position = "absolute"; fabricWrapper.style.top = `${canvasOffsetRef.current.y}px`; fabricWrapper.style.left = `${canvasOffsetRef.current.x}px`; fabricWrapper.style.pointerEvents = "auto"; fabricWrapper.style.zIndex = "2"; fabricWrapper.style.width = sizeStyle.width; fabricWrapper.style.height = sizeStyle.height;
    } else if (activeTool === "text") {
      canvas.isDrawingMode = false; canvas.selection = true; canvas.defaultCursor = "text"; canvas.hoverCursor = "text";
      canvas.forEachObject((obj) => { obj.evented = true; obj.selectable = true; }); canvas.renderAll();
      display.style.position = "absolute"; display.style.top = `${canvasOffsetRef.current.y}px`; display.style.left = `${canvasOffsetRef.current.x}px`; display.style.pointerEvents = "none"; display.style.zIndex = "1"; display.style.width = sizeStyle.width; display.style.height = sizeStyle.height;
      fabricWrapper.style.position = "absolute"; fabricWrapper.style.top = `${canvasOffsetRef.current.y}px`; fabricWrapper.style.left = `${canvasOffsetRef.current.x}px`; fabricWrapper.style.pointerEvents = "auto"; fabricWrapper.style.zIndex = "2"; fabricWrapper.style.width = sizeStyle.width; fabricWrapper.style.height = sizeStyle.height;
    } else if (activeTool === "shape") {
      canvas.isDrawingMode = false; canvas.selection = false; canvas.defaultCursor = "crosshair"; canvas.hoverCursor = "crosshair";
      canvas.forEachObject((obj) => { obj.evented = false; obj.selectable = false; }); canvas.renderAll();
      display.style.position = "absolute"; display.style.top = `${canvasOffsetRef.current.y}px`; display.style.left = `${canvasOffsetRef.current.x}px`; display.style.pointerEvents = "none"; display.style.zIndex = "1"; display.style.width = sizeStyle.width; display.style.height = sizeStyle.height;
      fabricWrapper.style.position = "absolute"; fabricWrapper.style.top = `${canvasOffsetRef.current.y}px`; fabricWrapper.style.left = `${canvasOffsetRef.current.x}px`; fabricWrapper.style.pointerEvents = "auto"; fabricWrapper.style.zIndex = "2"; fabricWrapper.style.width = sizeStyle.width; fabricWrapper.style.height = sizeStyle.height;
    } else {
      canvas.isDrawingMode = false; canvas.selection = false; canvas.discardActiveObject();
      canvas.forEachObject((obj) => { obj.evented = false; obj.selectable = false; }); canvas.renderAll();
      let cursor = "crosshair";
      if (activeTool === "fill") { cursor = "cell"; }
      else {
        const size = brushSizeRef.current;
        const cursorSvg = activeTool === "eraser"
          ? `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 1}' fill='none' stroke='%23333' stroke-width='1.5'/></svg>`
          : `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 1}' fill='${brushColorRef.current.replace("#", "%23")}' opacity='0.7'/></svg>`;
        cursor = `url("data:image/svg+xml,${cursorSvg}") ${size / 2} ${size / 2}, crosshair`;
      }
      display.style.position = "absolute"; display.style.top = `${canvasOffsetRef.current.y}px`; display.style.left = `${canvasOffsetRef.current.x}px`; display.style.pointerEvents = "auto"; display.style.zIndex = "1"; display.style.cursor = cursor; display.style.width = sizeStyle.width; display.style.height = sizeStyle.height;
      fabricWrapper.style.position = "absolute"; fabricWrapper.style.top = `${canvasOffsetRef.current.y}px`; fabricWrapper.style.left = `${canvasOffsetRef.current.x}px`; fabricWrapper.style.pointerEvents = "none"; fabricWrapper.style.zIndex = "2"; fabricWrapper.style.cursor = cursor; fabricWrapper.style.width = sizeStyle.width; fabricWrapper.style.height = sizeStyle.height;
    }
  }, [activeTool, brushSize, brushColor, syncDisplay]);

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    const display = displayCanvasRef.current;
    const fc = fabricCanvasRef.current;
    if (!container || !fc || !display) return;
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    if (containerWidth <= 0) return;

    let fitWidth: number, fitHeight: number;
    if (isFullModeRef.current && rect.height > 0) {
      fitWidth = containerWidth;
      fitHeight = rect.height;          // ← isi penuh layar, bukan paksa 4:3
    } else {
      fitWidth = containerWidth;
      fitHeight = containerWidth * 0.75;
    }

    const newBaseScale = fitWidth / 800;
    const oldBaseScale = baseScaleRef.current || newBaseScale;
    const oldVpt = fc.viewportTransform || [oldBaseScale, 0, 0, oldBaseScale, 0, 0];

    fc.setWidth(fitWidth);
    fc.setHeight(fitHeight);

    // ← Update pixel buffer display canvas agar syncDisplay bisa pakai dimensi penuh
    display.width = Math.round(fitWidth);
    display.height = Math.round(fitHeight);

    const ratio = newBaseScale / oldBaseScale;
    const newScale = (oldVpt[0] || oldBaseScale) * ratio;
    const newPanX = (oldVpt[4] || 0) * ratio;
    const newPanY = (oldVpt[5] || 0) * ratio;
    baseScaleRef.current = newBaseScale;
    fc.setViewportTransform(clampViewport([newScale, 0, 0, newScale, newPanX, newPanY]));

    display.style.width = `${fitWidth}px`;
    display.style.height = `${fitHeight}px`;
    display.style.left = "0px";
    display.style.top = "0px";
    const fabricWrapper = (fabricCanvasRef as any).wrapper;
    if (fabricWrapper) {
      fabricWrapper.style.left = "0px";
      fabricWrapper.style.top = "0px";
    }
    canvasOffsetRef.current = { x: 0, y: 0 };
    fc.requestRenderAll();
    setCanvasDisplaySize({ width: fitWidth, height: fitHeight });
    setCanvasOffset({ x: 0, y: 0 });
  }, [clampViewport]);

  const updateSizeRef = useRef(updateSize);
  useEffect(() => { updateSizeRef.current = updateSize; }, [updateSize]);

  useEffect(() => {
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, [updateSize]);

  useEffect(() => {
    let raf1 = 0, raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        updateSizeRef.current?.();
      });
    });
    const timer = setTimeout(() => { updateSizeRef.current?.(); }, 120);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
    };
  }, [isFullMode]);

  const renderPatternSVGString = useCallback((pattern: BatikItem) => {
    const svgSource = getBatikSvg(pattern.style_type);
    if (svgSource) {
      return recolorSVG(svgSource, selectedPreset);
    }
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

  const renderMiniPattern = useCallback((pattern: BatikItem | undefined, presetName?: string, customColor?: string) => {
    if (!pattern) return <div className="w-full h-full bg-[#FAF8F5] rounded-xl animate-pulse" />;

    let preset = sidebarPreset;
    if (presetName) {
      if (presetName === "Custom" && customColor) {
        preset = generatePresetFromPrimary(customColor);
      } else {
        preset = colorPresets.find(p => p.name === presetName) || blackPreset;
      }
    }
    const svgSource = getBatikSvg(pattern.style_type);
    if (svgSource) {
      const svgString = recolorSVG(svgSource, preset);
      return (
        <div className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
          dangerouslySetInnerHTML={{ __html: svgString }} />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <svg width="100%" height="100%" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <rect fill="transparent" width="20" height="20" />
          {(pattern.style_type === "parang" || pattern.style_type === "parang-new" || pattern.style_type === "traditional" || pattern.style_type === "diagonal-lines") && (
            <path d="M0,10 Q5,5 10,10 Q15,15 20,10" stroke={preset.colors.primary} strokeWidth="1.5" fill="none" />
          )}
          {(pattern.style_type === "kawung" || pattern.style_type === "circles") && (
            <g fill="none" stroke={preset.colors.primary} strokeWidth="1"><circle cx="10" cy="6" r="4" /><circle cx="10" cy="14" r="4" /></g>
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
        <Loader2 className="absolute w-4 h-4 animate-spin text-[#8B6F47] opacity-20" />
      </div>
    );
  }, [sidebarPreset]);

  const getSpawnPoint = useCallback((dropCoords?: { x: number; y: number }) => {
    if (dropCoords) return dropCoords;
    const fc = fabricCanvasRef.current;
    if (!fc) return { x: 80, y: 60 };
    const vpt = fc.viewportTransform;
    if (!vpt) return { x: 80, y: 60 };
    const zoom = fc.getZoom() || 1;
    const displayCenterX = fc.getWidth() / 2;
    const displayCenterY = fc.getHeight() / 2;
    const logicalX = (displayCenterX - vpt[4]) / zoom;
    const logicalY = (displayCenterY - vpt[5]) / zoom;
    // Map virtual bounds: width 4000 (centered at 2000, offset 1600), height 3000 (centered at 1500, offset 1200)
    // Left-top is (-1600, -1200) and right-bottom is (2400, 1800) in logical coordinates
    const clampedX = Math.max(-1600, Math.min(2400, logicalX));
    const clampedY = Math.max(-1200, Math.min(1800, logicalY));
    return { x: clampedX, y: clampedY };
  }, []);

  const screenPointToCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const fc = fabricCanvasRef.current;
    const containerEl = containerRef.current;
    if (!fc || !containerEl) return { x: 80, y: 60 };
    const rect = containerEl.getBoundingClientRect();
    const vpt = fc.viewportTransform;
    const zoom = fc.getZoom() || 1;
    const offset = canvasOffsetRef.current; // ← pakai offset canvas, bukan (0,0)
    const displayX = clientX - rect.left - offset.x;
    const displayY = clientY - rect.top - offset.y;
    if (!vpt) return { x: displayX, y: displayY };
    const logicalX = (displayX - vpt[4]) / zoom;
    const logicalY = (displayY - vpt[5]) / zoom;
    // Clamp to virtual canvas limits (-1600..2400 and -1200..1800) so it drops exactly where desired.
    return {
      x: Math.max(-1600, Math.min(2400, logicalX)),
      y: Math.max(-1200, Math.min(1800, logicalY)),
    };
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    const patternIdStr = e.dataTransfer.getData("application/x-batik-pattern-id");
    if (!patternIdStr) return;
    const patternId = Number(patternIdStr);
    const pattern = patterns.find((p) => p.id === patternId);
    if (!pattern) return;
    const dropCoords = screenPointToCanvasCoords(e.clientX, e.clientY);
    addItemToCanvasRef.current?.(pattern, dropCoords);
  }, [patterns, screenPointToCanvasCoords]);
  const addItemToCanvas = useCallback((pattern: BatikItem, dropCoords?: { x: number; y: number }) => {
    if (!fabricCanvasRef.current) return;
    const fc = fabricCanvasRef.current;
    const spawnPoint = getSpawnPoint(dropCoords);

    loadBatikSvg(pattern.style_type)
      .then(() => {
        const svgSource = getBatikSvg(pattern.style_type);
        const svg = svgSource ? recolorSVG(svgSource, sidebarPreset) : renderPatternSVGString(pattern);
        return svgStringToPngDataUrl(svg);
      })
      .then((pngUrl) => {
        fabric.Image.fromURL(pngUrl, (img) => {
          const rawW = img.width ?? 554;
          const rawH = img.height ?? 554;
          const maxSize = 280;
          const scale = rawW > 0 && rawH > 0 ? Math.min(maxSize / rawW, maxSize / rawH, 1) : 1;
          const displayW = rawW * scale;
          const displayH = rawH * scale;
          img.set({
            left: spawnPoint.x - displayW / 2,
            top: spawnPoint.y - displayH / 2,
            scaleX: scale, scaleY: scale,
            selectable: true, evented: true, hasControls: true, hasBorders: true,
            perPixelTargetFind: false,
            lockMovementX: false, lockMovementY: false, lockRotation: false,
            lockScalingX: false, lockScalingY: false, lockUniScaling: false,
            lockScalingFlip: true,
            objectCaching: false,
          });
          img.setCoords();
          const newLayerId = Date.now().toString();
          (img as any).data = { layerId: newLayerId, patternId: pattern.id, layerName: pattern.name || 'Motif', styleType: pattern.style_type, colorPresetName: sidebarPreset.name, customColor: sidebarCustomColor, originalSvg: getBatikSvg(pattern.style_type) || null, originalScale: scale, originalWidth: rawW, originalHeight: rawH };

          skipAutoTabSwitchRef.current = true;
          fc.add(img); img.setCoords(); fc.setActiveObject(img); fc.requestRenderAll();
          setLayers((prev) => [...prev, { id: newLayerId, type: 'pattern', name: pattern.name || 'Motif', visible: true, locked: false, fabricObject: img }]);
          setSelectedLayerId(newLayerId);
          setSelectedObject(img);
          setSelectedObjectType("pattern");
          setSelectedPreset(sidebarPreset);
          setCustomColor(sidebarCustomColor);
          saveSnapshot();
          setTimeout(() => {
            skipAutoTabSwitchRef.current = false;
          }, 50);
        });
      })
      .catch(() => { toast.error('Gagal memuat motif SVG'); });
  }, [saveSnapshot, renderPatternSVGString, sidebarPreset, sidebarCustomColor, getSpawnPoint]);

  useEffect(() => { addItemToCanvasRef.current = addItemToCanvas; }, [addItemToCanvas]);

  const addSelectedPatternsToCanvas = useCallback(() => {
    const selected = patterns.filter((p) => selectedPatternIds.has(p.id));
    if (selected.length === 0) return;

    selected.forEach((pattern, idx) => {
      const base = getSpawnPoint();
      // geser sedikit tiap motif biar gak numpuk persis di titik yang sama 
      const offset = idx * 28;
      addItemToCanvas(pattern, { x: base.x + offset, y: base.y + offset });
    });

    toast.success(`${selected.length} motif berhasil ditambahkan ke kanvas`);
    setSelectedPatternIds(new Set());
    setIsMultiSelectMode(false);
  }, [patterns, selectedPatternIds, addItemToCanvas, getSpawnPoint]);

  const applyCanvasMultiSelect = useCallback(() => {
    const fc = fabricCanvasRef.current;
    if (!fc || canvasSelectedIds.size === 0) return;

    // Discard active object first to reset selection state before constructing final group
    fc.discardActiveObject();

    // Keluar dari mode multi-select dulu (kembalikan evented/selectable & restore opacity)
    fc.selection = true;
    fc.defaultCursor = "default";
    fc.hoverCursor = "move";
    fc.forEachObject((obj) => {
      // Restore selectable
      if ((obj as any)._oldSelectable !== undefined) {
        obj.selectable = (obj as any)._oldSelectable;
        delete (obj as any)._oldSelectable;
      } else {
        obj.selectable = true;
      }
      obj.evented = true;
    });

    // Ambil objek-objek yang dipilih 
    const selected = fc.getObjects().filter((obj) => {
      const layerId = (obj as any).data?.layerId;
      return layerId && canvasSelectedIds.has(layerId);
    });

    if (selected.length === 0) {
      fc.requestRenderAll();
      setIsCanvasMultiSelectMode(false);
      setCanvasSelectedIds(new Set());
      return;
    }

    // Buat Group jika lebih dari 1 objek dipilih, atau set active jika hanya 1
    if (selected.length === 1) {
      fc.setActiveObject(selected[0]);
      setSelectedLayerId((selected[0] as any).data?.layerId ?? null);
      setSelectedObject(selected[0]);
      setSelectedObjectType(detectObjectType(selected[0]));
    } else {
      const group = new fabric.Group([], { selectable: true, evented: true, hasControls: true, hasBorders: true });
      const newLayerId = "group_" + Date.now().toString();
      (group as any).data = { layerId: newLayerId, layerName: 'Grup' };

      fc.discardActiveObject();
      selected.forEach(obj => {
        fc.remove(obj);
        group.addWithUpdate(obj);
      });
      fc.add(group);

      const layerIdsToRemove = selected.map(obj => (obj as any).data?.layerId).filter(Boolean);
      setLayers(prev => prev.filter(l => !layerIdsToRemove.includes(l.id)));
      setLayers(prev => [...prev, { id: newLayerId, type: 'drawing', name: 'Grup', visible: true, locked: false, fabricObject: group }]);

      fc.setActiveObject(group);
      group.setCoords();
      setSelectedObject(group);
      setSelectedObjectType("pattern"); // Treat group as pattern for recoloring controls
      setSelectedLayerId(newLayerId);

      // Save snapshot for grouping action
      const json = JSON.stringify(fc.toJSON(["data"]));
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(json);
      historyIndexRef.current = historyRef.current.length - 1;
      actionStackRef.current.push("pattern");
      redoStackRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
    }

    fc.requestRenderAll();
    setIsCanvasMultiSelectMode(false);
    setCanvasSelectedIds(new Set());
  }, [canvasSelectedIds, setLayers]);
  const handleCustomColorCommit = useCallback((newColor: string, skipPresetRegen?: boolean) => {
    setCustomColor(newColor);
    if (!skipPresetRegen) {
      setSelectedPreset(generatePresetFromPrimary(newColor));
    }
  }, []);

  const handleSidebarCustomColorCommit = useCallback((newColor: string, skipPresetRegen?: boolean) => {
    setSidebarCustomColor(newColor);
    if (!skipPresetRegen) {
      setSidebarPreset(generatePresetFromPrimary(newColor));
    }
  }, []);

  const recolorActiveObject = useCallback(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const activeObjects = fc.getActiveObjects();
    if (activeObjects.length === 0) return;

    const getRecolorableObjects = (objs: fabric.Object[]): fabric.Object[] => {
      let result: fabric.Object[] = [];
      objs.forEach(obj => {
        if (obj.type === 'group') {
          result = result.concat(getRecolorableObjects((obj as fabric.Group).getObjects()));
        } else {
          const data = (obj as any).data;
          if (data && data.patternId) {
            result.push(obj);
          }
        }
      });
      return result;
    };

    const targetObjects = getRecolorableObjects(activeObjects);
    targetObjects.forEach((activeObj) => {
      const data = (activeObj as any).data;
      if (!data || !data.patternId) return;
      if (data.colorPresetName === selectedPreset.name && selectedPreset.name !== "Custom") return;
      if (selectedPreset.name === "Custom" && data.customColor === customColor) return;

      let recoloredSvg = "";
      if (data.originalSvg) {
        recoloredSvg = recolorSVG(data.originalSvg, selectedPreset);
      } else {
        const pattern = patterns.find(p => p.id === data.patternId);
        if (!pattern) return;
        recoloredSvg = renderPatternSVGString(pattern);
      }

      // Save current crop and transform properties to prevent setSrc from resetting them
      const activeObjAny = activeObj as any;
      const currentWidth = activeObj.width;
      const currentHeight = activeObj.height;
      const currentCropX = activeObjAny.cropX;
      const currentCropY = activeObjAny.cropY;
      const currentScaleX = activeObj.scaleX;
      const currentScaleY = activeObj.scaleY;
      const currentLeft = activeObj.left;
      const currentTop = activeObj.top;

      svgStringToPngDataUrl(recoloredSvg).then((pngUrl) => {
        (activeObj as fabric.Image).setSrc(pngUrl, () => {
          activeObj.set({
            width: currentWidth,
            height: currentHeight,
            scaleX: currentScaleX,
            scaleY: currentScaleY,
            left: currentLeft,
            top: currentTop,
          } as any);
          activeObjAny.cropX = currentCropX;
          activeObjAny.cropY = currentCropY;
          data.colorPresetName = selectedPreset.name;
          data.customColor = customColor;
          activeObj.setCoords();
          if (activeObj.group) {
            activeObj.group.dirty = true;
          }
          fc.requestRenderAll();
          setLayers((prev) => [...prev]);
          saveSnapshot();
        });
      }).catch(() => { /* silent */ });
    });
  }, [selectedPreset, customColor, saveSnapshot, renderPatternSVGString, patterns]);

  useEffect(() => {
    recolorActiveObject();
  }, [selectedPreset, recolorActiveObject]);

  // Toolbar position sync on after:render
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    // nothing — position is computed at render time via getObjectToolbarPosition()
    // We force a re-render on after:render by listening to canvas events and
    // updating a lightweight counter state.
  }, [selectedObject]);

  // Dismiss context menu and object menu on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      setContextMenu(null);
      // Only close the secondary dropdown; the primary toolbar stays open while object is selected
      const target = e.target as Element;
      if (!target.closest("[data-object-toolbar]")) {
        setShowObjectMenu(false);
      }
    };
    window.addEventListener("mousedown", onDown, true);
    return () => window.removeEventListener("mousedown", onDown, true);
  }, []);

  const deleteSelectedLayer = useCallback(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const activeObjects = fc.getActiveObjects();
    if (activeObjects.length > 0) {
      const layerIdsToRemove = activeObjects.map((obj) => (obj as any).data?.layerId).filter(Boolean);
      setLayers((prev) => prev.filter((l) => !layerIdsToRemove.includes(l.id)));
      activeObjects.forEach((obj) => fc.remove(obj));
      fc.discardActiveObject();
      setSelectedLayerId(null);
      setSelectedObject(null);
      setSelectedObjectType(null);
      saveSnapshot();
    } else if (selectedLayerId) {
      const layer = layers.find((l) => l.id === selectedLayerId);
      if (layer?.fabricObject) fc.remove(layer.fabricObject);
      setLayers((prev) => prev.filter((l) => l.id !== selectedLayerId));
      setSelectedLayerId(null);
      setSelectedObject(null);
      setSelectedObjectType(null);
      saveSnapshot();
    }
  }, [selectedLayerId, layers, saveSnapshot]);

  const toggleLayerVisibility = useCallback((layerId: string | null) => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const targetLayerIds = layerId
      ? [layerId]
      : fc.getActiveObjects().map(obj => (obj as any).data?.layerId).filter(Boolean);

    if (targetLayerIds.length === 0) return;

    setLayers((prev) => prev.map((layer) => {
      if (targetLayerIds.includes(layer.id) && layer.fabricObject) {
        const newVisible = !layer.visible;
        layer.fabricObject.set("visible", newVisible);
        return { ...layer, visible: newVisible };
      }
      return layer;
    }));
    fc.renderAll();
  }, []);

  const toggleLayerLock = useCallback((layerId: string | null) => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const targetLayerIds = layerId
      ? [layerId]
      : fc.getActiveObjects().map(obj => (obj as any).data?.layerId).filter(Boolean);

    if (targetLayerIds.length === 0) return;

    setLayers((prev) => prev.map((layer) => {
      if (targetLayerIds.includes(layer.id) && layer.fabricObject) {
        const newLocked = !layer.locked;
        layer.fabricObject.set("selectable", !newLocked);
        layer.fabricObject.set("evented", !newLocked);
        return { ...layer, locked: newLocked };
      }
      return layer;
    }));
    fc.renderAll();
  }, []);

  const moveLayer = useCallback((layerId: string | null, direction: "up" | "down") => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const targetObjects = layerId
      ? layers.filter(l => l.id === layerId).map(l => l.fabricObject).filter(Boolean) as fabric.Object[]
      : fc.getActiveObjects();

    if (targetObjects.length === 0) return;

    // Sort target objects by their current index in the layers array to maintain relative order during movement
    const targetLayerIds = targetObjects.map(obj => (obj as any).data?.layerId).filter(Boolean);
    const targetIndices = targetLayerIds.map(id => layers.findIndex(l => l.id === id)).filter(idx => idx !== -1);
    targetIndices.sort((a, b) => a - b);

    if (direction === "up" && targetIndices[targetIndices.length - 1] === layers.length - 1) return;
    if (direction === "down" && targetIndices[0] === 0) return;

    setLayers((prev) => {
      const next = [...prev];
      if (direction === "up") {
        // Move from top to bottom to avoid index shifting issues
        for (let i = targetIndices.length - 1; i >= 0; i--) {
          const idx = targetIndices[i];
          const obj = next[idx].fabricObject;
          if (obj) fc.bringForward(obj, false);
          [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        }
      } else {
        // Move from bottom to top
        for (let i = 0; i < targetIndices.length; i++) {
          const idx = targetIndices[i];
          const obj = next[idx].fabricObject;
          if (obj) fc.sendBackwards(obj, false);
          [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
        }
      }
      return next;
    });

    fc.requestRenderAll();
    saveSnapshot();
  }, [layers, saveSnapshot]);

  const duplicateLayer = useCallback((layerId?: string) => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    let objectsToClone: fabric.Object[] = [];

    if (layerId) {
      const layer = layers.find((l) => l.id === layerId);
      if (layer?.fabricObject) objectsToClone = [layer.fabricObject];
    } else {
      objectsToClone = fc.getActiveObjects();
    }

    if (objectsToClone.length === 0) return;

    const newLayers: CustomLayer[] = [];
    let processedCount = 0;

    objectsToClone.forEach((obj) => {
      obj.clone((clonedObj: fabric.Object) => {
        const newLayerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const originalData = (obj as any).data || {};
        const layerName = `${originalData.layerName || 'Objek'} (Salinan)`;

        clonedObj.set({
          left: (clonedObj.left || 0) + 20,
          top: (clonedObj.top || 0) + 20,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
        });

        (clonedObj as any).data = {
          ...originalData,
          layerId: newLayerId,
          layerName: layerName,
        };

        fc.add(clonedObj);
        clonedObj.setCoords();

        newLayers.push({
          id: newLayerId,
          type: (clonedObj as any).data?.patternId ? "pattern" : "drawing",
          name: layerName,
          visible: true,
          locked: false,
          fabricObject: clonedObj,
        });

        processedCount++;
        if (processedCount === objectsToClone.length) {
          setLayers((prev) => [...prev, ...newLayers]);
          fc.discardActiveObject();

          if (newLayers.length > 1) {
            const sel = new fabric.ActiveSelection(newLayers.map(l => l.fabricObject!), { canvas: fc });
            fc.setActiveObject(sel);
            setSelectedLayerId(null);
            setSelectedObject(sel);
            setSelectedObjectType(null);
          } else {
            fc.setActiveObject(newLayers[0].fabricObject!);
            setSelectedLayerId(newLayers[0].id);
            setSelectedObject(newLayers[0].fabricObject!);
            setSelectedObjectType(detectObjectType(newLayers[0].fabricObject!));
          }

          fc.requestRenderAll();
          saveSnapshot();
        }
      }, ["data"]);
    });
  }, [layers, saveSnapshot]);

  const flipLayer = useCallback((layerId: string | null, axis: "x" | "y") => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const targetObjects = layerId
      ? layers.filter(l => l.id === layerId).map(l => l.fabricObject).filter(Boolean)
      : fc.getActiveObjects();

    if (targetObjects.length === 0) return;

    targetObjects.forEach((obj) => {
      if (axis === "x") {
        obj!.set("flipX", !obj!.flipX);
      } else {
        obj!.set("flipY", !obj!.flipY);
      }
    });

    fc.requestRenderAll();
    saveSnapshot();
  }, [layers, saveSnapshot]);

  const addUploadedImageToCanvas = useCallback((dataUrl: string, fileName: string) => {
    if (!fabricCanvasRef.current) return;
    const fc = fabricCanvasRef.current;
    const spawnPoint = getSpawnPoint();

    fabric.Image.fromURL(dataUrl, (img) => {
      const rawW = img.width ?? 280;
      const rawH = img.height ?? 280;
      const maxSize = 250;
      const scale = rawW > 0 && rawH > 0 ? Math.min(maxSize / rawW, maxSize / rawH, 1) : 1;
      const displayW = rawW * scale;
      const displayH = rawH * scale;

      img.set({
        left: spawnPoint.x - displayW / 2,
        top: spawnPoint.y - displayH / 2,
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
        lockScalingFlip: true,
        objectCaching: false,
      });
      img.setCoords();

      const newLayerId = Date.now().toString();
      const shortName = fileName.length > 20 ? fileName.substring(0, 17) + "..." : fileName;
      (img as any).data = {
        layerId: newLayerId,
        layerName: shortName,
        imageUrl: dataUrl,
        originalScale: scale,
        originalWidth: rawW,
        originalHeight: rawH,
      };

      skipAutoTabSwitchRef.current = true;
      fc.add(img);
      img.setCoords();
      fc.setActiveObject(img);
      fc.requestRenderAll();

      setLayers((prev) => [
        ...prev,
        {
          id: newLayerId,
          type: "drawing" as const,
          name: shortName,
          visible: true,
          locked: false,
          fabricObject: img,
        },
      ]);
      setSelectedLayerId(newLayerId);
      setSelectedObject(img);
      setSelectedObjectType("pattern");
      saveSnapshot();
      setTimeout(() => {
        skipAutoTabSwitchRef.current = false;
      }, 50);
    });
  }, [saveSnapshot, getSpawnPoint]);

  // Spawn text object — Canva-style: called directly from toolbar button click.
  // Saves a snapshot BEFORE enterEditing so the "empty text box" state is in
  // history, while direct listeners handle per-burst text checkpoints.
  const spawnTextObject = useCallback(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const spawnPoint = getSpawnPoint();
    const text = new fabric.IText("Ketik teks di sini", {
      left: spawnPoint.x,
      top: spawnPoint.y,
      fontFamily: fontFamilyRef.current,
      fontSize: fontSizeRef.current,
      fill: textColorRef.current,
      fontWeight: isBoldRef.current ? "bold" : "normal",
      fontStyle: isItalicRef.current ? "italic" : "normal",
      underline: isUnderlineRef.current,
      linethrough: isLinethroughRef.current,
      textAlign: textAlignRef.current,
      selectable: true,
      evented: true,
      hasControls: true,
      editable: true,
      objectCaching: false,
      originX: "center",
      originY: "center",
    });
    const newLayerId = Date.now().toString();
    (text as any).data = { layerId: newLayerId, layerName: "Teks" };
    fc.add(text);
    fc.setActiveObject(text);
    fc.requestRenderAll();

    setLayers((prev) => [...prev, { id: newLayerId, type: "drawing" as const, name: "Teks", visible: true, locked: false, fabricObject: text }]);
    setSelectedLayerId(newLayerId);
    setSelectedObject(text);
    setSelectedObjectType("text");
    setActiveTool("select"); // auto-switch to select like Canva

    // Save spawn state to canvas history BEFORE entering edit mode 
    saveSnapshot();

    text.enterEditing();
    text.selectAll();
    textSelectionRef.current = {
      obj: text,
      start: 0,
      end: text.text?.length ?? 18,
      hasSelection: true,
    };
    syncTextStyleRef.current?.(text);
    fc.requestRenderAll();

    // editing:exited: handled by canvas-level listener above 
    text.on("editing:exited", () => {
    });
  }, [saveSnapshot, getSpawnPoint]);

  const handleSelectTool = useCallback((tool: Tool) => {
    if (tool === "text") {
      spawnTextObject();
      return;
    }
    const fc = fabricCanvasRef.current;
    if (fc) {
      const activeObj = fc.getActiveObject();
      if (activeObj && (activeObj as any).isEditing) {
        (activeObj as any).exitEditing();
      }
      if (tool !== "select") {
        fc.discardActiveObject();
        fc.clearContext(fc.contextTop);
        fc.requestRenderAll();
        setSelectedObject(null);
        setSelectedObjectType(null);
        setSelectedLayerId(null);
      }
    }
    setActiveTool(tool);
  }, [spawnTextObject]);

  // Build final canvas for download/save
  // Smart export: auto-frames all content so off-center designs look correct.
  const buildFinalCanvas = async (): Promise<HTMLCanvasElement> => {
    const fc = fabricCanvasRef.current!;
    const offscreen = offscreenRef.current!;
    
    const subscriptionPlan = user?.user_metadata?.subscription_plan || "gratis";
    const isPremium = subscriptionPlan === "weekly" || subscriptionPlan === "monthly";

    const EXPORT_W = isPremium ? 2000 : 800;
    const EXPORT_H = isPremium ? 1500 : 600;

    const final = document.createElement("canvas");
    final.width = EXPORT_W;
    final.height = EXPORT_H;
    const ctx = final.getContext("2d")!;
    ctx.fillStyle = canvasBackground || "#ffffff";
    ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

    // ── Step 1: calculate bounds of all Fabric objects ────────────────────────
    const objs = fc.getObjects();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasFabricContent = false;

    objs.forEach((obj) => {
      if (!obj.visible) return;
      hasFabricContent = true;
      const b = obj.getBoundingRect(true, true);
      minX = Math.min(minX, b.left);
      minY = Math.min(minY, b.top);
      maxX = Math.max(maxX, b.left + b.width);
      maxY = Math.max(maxY, b.top + b.height);
    });

    // ── Step 2: check if offscreen (brush) layer has any content ──────────────
    const offCtx = offscreen.getContext("2d")!;
    const offW = offscreen.width;   // 4000
    const offH = offscreen.height;  // 3000
    const sample = offCtx.getImageData(0, 0, offW, offH);
    let bMinX = offW, bMinY = offH, bMaxX = 0, bMaxY = 0;
    let hasBrushContent = false;
    const step = 4; // scan every 4th pixel for performance
    for (let y = 0; y < offH; y += step) {
      for (let x = 0; x < offW; x += step) {
        const a = sample.data[(y * offW + x) * 4 + 3];
        if (a > 10) {
          if (x < bMinX) bMinX = x;
          if (y < bMinY) bMinY = y;
          if (x > bMaxX) bMaxX = x;
          if (y > bMaxY) bMaxY = y;
          hasBrushContent = true;
        }
      }
    }

    // ── Step 3: determine final bounding box in Fabric logical coords ─────────
    let exportLeft = 0, exportTop = 0, exportWidth = EXPORT_W, exportHeight = EXPORT_H;

    if (hasBrushContent) {
      const bFabricMinX = bMinX - 1600;
      const bFabricMinY = bMinY - 1200;
      const bFabricMaxX = bMaxX - 1600;
      const bFabricMaxY = bMaxY - 1200;
      minX = Math.min(minX, bFabricMinX);
      minY = Math.min(minY, bFabricMinY);
      maxX = Math.max(maxX, bFabricMaxX);
      maxY = Math.max(maxY, bFabricMaxY);
    }

    const hasAnyContent = hasFabricContent || hasBrushContent;
    if (hasAnyContent && isFinite(minX) && isFinite(minY) && maxX > minX && maxY > minY) {
      const PAD = 24;
      const contentW = maxX - minX;
      const contentH = maxY - minY;
      const scaleX = (EXPORT_W - PAD * 2) / contentW;
      const scaleY = (EXPORT_H - PAD * 2) / contentH;
      const scale = Math.min(scaleX, scaleY, 1.5); // cap upscale at 1.5x

      exportLeft = minX - (EXPORT_W / scale - contentW) / 2;
      exportTop  = minY - (EXPORT_H / scale - contentH) / 2;
      exportWidth  = EXPORT_W / scale;
      exportHeight = EXPORT_H / scale;
    }

    // ── Step 4: composite brush & fill layer using same framing ───────────────
    const offSrcX = (exportLeft + 1600);
    const offSrcY = (exportTop + 1200);
    const offSrcW = exportWidth;
    const offSrcH = exportHeight;
    ctx.drawImage(offscreen, offSrcX, offSrcY, offSrcW, offSrcH, 0, 0, EXPORT_W, EXPORT_H);

    // ── Step 5: render Fabric objects into export canvas (ON TOP of brush/fill) ──
    const savedVpt = fc.viewportTransform ? [...fc.viewportTransform] as number[] : null;
    const savedW = fc.getWidth();
    const savedH = fc.getHeight();

    const vptScale = EXPORT_W / exportWidth;
    const vptX = -exportLeft * vptScale;
    const vptY = -exportTop * (EXPORT_H / exportHeight);

    fc.setWidth(EXPORT_W);
    fc.setHeight(EXPORT_H);
    fc.setViewportTransform([vptScale, 0, 0, EXPORT_H / exportHeight, vptX, vptY]);
    fc.renderAll();
    const fabricDataUrl = fc.toDataURL({ format: "png", multiplier: 1 });

    // Restore state
    fc.setWidth(savedW);
    fc.setHeight(savedH);
    if (savedVpt) fc.setViewportTransform(savedVpt as any);
    fc.requestRenderAll();

    await new Promise<void>((res, rej) => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, EXPORT_W, EXPORT_H); res(); };
      img.onerror = rej;
      img.src = fabricDataUrl;
    });

    // ── Step 6: watermarks ────────────────────────────────────────────────────
    // Watermark besar (Hanya untuk pengguna GRATIS)
    if (!isPremium) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.font = "bold 60px 'Playfair Display', serif";
      ctx.fillStyle = "#8B6F47";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.translate(EXPORT_W / 2, EXPORT_H / 2); ctx.rotate(-25 * Math.PI / 180);
      ctx.shadowColor = "rgba(0,0,0,0.1)"; ctx.shadowBlur = 6;
      ctx.fillText("RekaBatik - Akun Gratis", 0, 0);
      ctx.restore();
    }

    // Watermark pojok
    ctx.save();
    ctx.globalAlpha = isPremium ? 0.4 : 0.7;
    ctx.font = isPremium ? "bold 25px 'Playfair Display', serif" : "bold 20px 'Playfair Display', serif";
    ctx.fillStyle = isPremium ? "rgba(255, 255, 255, 0.6)" : "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillText("RekaBatik", EXPORT_W - 20, EXPORT_H - 20);
    ctx.restore();
    return final;
  };

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
    } catch { toast.error("Gagal mengunduh desain"); }
    finally { setIsDownloading(false); }
  };

  const clearAll = () => {
    setShowClearConfirmModal(true);
  };

  const confirmClearAll = () => {
    const fc = fabricCanvasRef.current;
    isInitRef.current = true;
    if (fc) { const objects = fc.getObjects(); objects.forEach(obj => fc.remove(obj)); fc.discardActiveObject(); fc.renderAll(); }
    if (offscreenRef.current) { const ctx = offscreenRef.current.getContext("2d")!; ctx.clearRect(0, 0, 4000, 3000); syncDisplay(); }
    historyRef.current = []; historyIndexRef.current = -1;
    offscreenHistoryRef.current = []; offscreenHistoryIndexRef.current = -1;
    actionStackRef.current = []; redoStackRef.current = [];
    isApplyingBgUndoRef.current = true;
    setCanvasBackground("#ffffff");
    setCommittedBg("#ffffff");
    bgColorHistoryRef.current = ["#ffffff"]; bgColorHistoryIndexRef.current = 0;
    saveSnapshot(); saveOffscreenSnapshot();
    isInitRef.current = false;
    setLayers([]); setSelectedLayerId(null); setHasOffscreenContent(false); setCanUndo(false); setCanRedo(false); setSavedDesignId(null);
    setHasUnsavedChanges(false);
    setShowClearConfirmModal(false);
  };

  const saveDesign = async (): Promise<number | null> => {
    if (!user) { toast.error("Silakan login terlebih dahulu untuk menyimpan desain"); navigate("/auth?redirect=/custom"); return null; }
    if (!fabricCanvasRef.current) return null;
    setIsSaving(true);
    try {
      const subscriptionPlan = user.user_metadata?.subscription_plan || "gratis";

      // 1. Check block edit limit for Gratis plan
      if (savedDesignId && subscriptionPlan === "gratis") {
        toast.error("Akun Gratis tidak dapat mengedit dan menyimpan ulang desain. Silakan upgrade ke Premium!");
        navigate("/pricing");
        return null;
      }

      // 2. Check design capacity count limits for Gratis and Weekly plans
      if (!savedDesignId) {
        const { count, error: countError } = await supabase
          .from("custom_designs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (countError) throw countError;

        const currentCount = count || 0;
        if (subscriptionPlan === "gratis" && currentCount >= 2) {
          toast.error("Batas simpan akun Gratis adalah 2 desain. Silakan upgrade ke Premium untuk menambah kapasitas!");
          navigate("/pricing");
          return null;
        }

        if (subscriptionPlan === "weekly" && currentCount >= 12) {
          toast.error("Batas simpan paket Premium Mingguan adalah 12 desain. Silakan upgrade ke Premium Bulanan untuk tanpa batas!");
          navigate("/pricing");
          return null;
        }
      }

      const final = await buildFinalCanvas();
      const thumbnailDataUrl = final.toDataURL("image/png");
      const designJson = fabricCanvasRef.current.toJSON(["data"]);
      const payload = { ...designJson, offscreenDataUrl: offscreenRef.current?.toDataURL("image/png") || null, canvasBackground, canvasThumbnail: thumbnailDataUrl, projectInfo };

      if (savedDesignId) {
        const { error } = await supabase
          .from("custom_designs")
          .update({ drawing_data: JSON.stringify(payload) })
          .eq("id", savedDesignId)
          .eq("user_id", user.id);
        if (error) throw error;
        setHasUnsavedChanges(false);
        return savedDesignId;
      } else {
        const { data, error } = await supabase
          .from("custom_designs")
          .insert([{ drawing_data: JSON.stringify(payload), pattern_id: 0, scale: 1, rotation: 0, colors: {}, created_at: new Date().toISOString(), user_id: user.id }])
          .select("id")
          .single();
        if (error) throw error;
        const newId = data?.id ?? null;
        setSavedDesignId(newId);
        setHasUnsavedChanges(false);
        return newId;
      }
    } catch (err) { console.error(err); toast.error("Gagal menyimpan desain"); return null; }
    finally { setIsSaving(false); }
  };

  const triggerSaveAction = (type: "save" | "cart" | "order") => {
    if (!user) { toast.error("Silakan login terlebih dahulu"); navigate("/auth?redirect=/custom"); return; }
    if (layers.length === 0 && !hasOffscreenContent) { toast.error("Kanvas masih kosong! Tambahkan motif atau gambar terlebih dahulu."); return; }
    if (savedDesignId) {
      executeAction(type);
    } else {
      setShowProjectModal(type);
    }
  };

  const handleSaveAndShowModal = () => triggerSaveAction("save");
  const addToCart = () => triggerSaveAction("cart");

  const executeAction = async (actionType: "save" | "cart" | "order") => {
    if (actionType === "save") {
      const id = await saveDesign();
      if (id !== null) {
        toast.success(savedDesignId ? "Desain berhasil diperbarui!" : "Desain berhasil disimpan ke Histori!");
      }
    } else if (actionType === "cart") {
      setIsAddingToCart(true);
      try {
        let designId = savedDesignId;
        if (!designId) { designId = await saveDesign(); if (!designId) { setIsAddingToCart(false); return; } }
        await addToCartFromContext({ customDesignId: designId, quantity: 1 });
        setShowSuccessModal("cart");
      } catch (err) { console.error(err); toast.error("Gagal menambahkan ke keranjang"); }
      finally { setIsAddingToCart(false); }
    } else if (actionType === "order") {
      setIsAddingToCart(true);
      try {
        let designId = savedDesignId;
        if (!designId) { designId = await saveDesign(); if (!designId) { setIsAddingToCart(false); return; } }
        await addToCartFromContext({ customDesignId: designId, quantity: 1 });
        navigate("/cart");
      } catch (err) { console.error(err); toast.error("Gagal memproses pesanan"); }
      finally { setIsAddingToCart(false); }
    }
  };

  const confirmProjectInfo = async () => {
    if (!showProjectModal) return;
    const actionType = showProjectModal;
    setShowProjectModal(null);
    await executeAction(actionType);
  };

  const getObjectToolbarPosition = () => {
    const fc = fabricCanvasRef.current;
    const container = containerRef.current;
    if (!fc || !container || !selectedObject) return null;
    const vpt = fc.viewportTransform;
    if (!vpt) return null;
    const br = selectedObject.getBoundingRect(true, true);
    const zoom = fc.getZoom();
    const offset = canvasOffsetRef.current;
    const displayLeft = br.left * zoom + vpt[4] + offset.x;
    const displayTop = br.top * zoom + vpt[5] + offset.y;
    const displayWidth = br.width * zoom;
    const containerWidth = container.getBoundingClientRect().width;
    const rawLeft = displayLeft + displayWidth / 2;
    const toolbarHeight = 52;
    const toolbarGap = 37;
    return {
      left: Math.max(60, Math.min(containerWidth - 60, rawLeft)),
      top: Math.max(8, displayTop - toolbarHeight - toolbarGap),
    };
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="kawung" />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-4 pointer-events-none" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-4 pointer-events-none" style={{ background: "radial-gradient(circle, #8B6F47 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      <div className="container mx-auto px-4 sm:px-6 py-10 relative z-10 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontSize: "clamp(2.25rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.15, marginBottom: "0.75rem" }}>
              Wujudkan <span style={{ color: "#8B6F47", position: "relative" }} className="after:absolute after:bottom-1 after:left-0 after:w-full after:h-[6px] after:bg-[#D4B88B]/25 after:rounded-full">Karya Batik</span> Impian
            </h1>
            <p style={{ color: "#7A6B5E", maxWidth: "620px", lineHeight: 1.6 }} className="text-[0.85rem] sm:text-[0.95rem]">
              Padukan keindahan motif klasik Nusantara dengan kreativitas Anda. Tambahkan motif, coretkan kuas warna-warni, dan unduh hasil karya seni orisinal Anda.
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 items-stretch min-w-0">
          {/* Canvas Section */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            <div className="rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(61,43,31,0.06)] border bg-white" style={{ borderColor: "rgba(212,184,139,0.3)" }}>
              {/* Toolbar */}
              <div style={{ background: "linear-gradient(to bottom, #FDFCFA 0%, #FFFFFF 100%)", borderBottom: "1px solid rgba(212,184,139,0.2)" }}>
                {/* Row 1: Tool selector + global actions */}
                <div
                  className="px-3 py-2 flex items-center gap-2 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  style={{ borderBottom: "1px solid rgba(212,184,139,0.12)" }}
                >
                  <div className="flex items-center p-0.5 rounded-xl gap-0.5 flex-shrink-0" style={{ background: "rgba(139,111,71,0.06)", border: "1px solid rgba(212,184,139,0.2)" }}>
                    {([
                      { tool: "select" as Tool, icon: MousePointer2, label: "Pilih" },
                      { tool: "brush" as Tool, icon: Brush, label: "Kuas & Canting" },
                      { tool: "eraser" as Tool, icon: Eraser, label: "Hapus" },
                      { tool: "fill" as Tool, icon: PaintBucket, label: "Isi Warna" },
                      { tool: "shape" as Tool, icon: Square, label: "Bentuk" },
                      { tool: "text" as Tool, icon: Type, label: "Teks" },
                    ] as const).map(({ tool, icon: Icon, label }) => {
                      const isActive = activeTool === tool;
                      return (
                        <button key={tool} onClick={() => handleSelectTool(tool)} title={label}
                          className="flex items-center justify-center gap-1.5 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer text-xs font-semibold select-none flex-shrink-0"
                          style={{ background: isActive ? "linear-gradient(135deg, #8B6F47 0%, #A0845E 100%)" : "transparent", color: isActive ? "#FFFFFF" : "#7A6B5E", boxShadow: isActive ? "0 2px 8px rgba(139,111,71,0.25), inset 0 1px 0 rgba(255,255,255,0.15)" : "none" }}>
                          <Icon style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                          <span className="hidden lg:inline whitespace-nowrap">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center ml-auto gap-2 flex-shrink-0">
                    <div className="flex items-center gap-0.5 p-1 rounded-xl flex-shrink-0" style={{ background: "#F8F6F2", border: "1px solid rgba(212,184,139,0.2)" }}>
                      <button onClick={zoomOut} disabled={zoomLevel <= 50} title="Perkecil" className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-sm" style={{ color: "#8B6F47" }}>
                        <ZoomOut style={{ width: "13px", height: "13px" }} />
                      </button>
                      <button onClick={resetZoom} title="Reset Zoom" className="h-7 px-1 rounded-lg text-[9px] sm:text-[10px] font-bold font-mono transition-all duration-150 hover:bg-white hover:shadow-sm cursor-pointer" style={{ color: zoomLevel !== 100 ? "#8B6F47" : "#A89B8F", minWidth: "28px" }}>
                        {zoomLevel}%
                      </button>
                      <button onClick={zoomIn} disabled={zoomLevel >= 300} title="Perbesar" className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-sm" style={{ color: "#8B6F47" }}>
                        <ZoomIn style={{ width: "13px", height: "13px" }} />
                      </button>

                      <div className="h-4 w-px mx-0.5" style={{ background: "rgba(212,184,139,0.35)" }} />

                      {/* Canvas Grid Toggle */}
                      <button
                        onClick={() => setShowGrid(!showGrid)}
                        title={showGrid ? "Sembunyikan Kisi Panduan" : "Tampilkan Kisi Panduan Kanvas"}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer hover:bg-white hover:shadow-sm"
                        style={{
                          background: showGrid ? "rgba(139,111,71,0.18)" : "transparent",
                          color: showGrid ? "#3D2B1F" : "#8B6F47",
                        }}
                      >
                        <Grid style={{ width: "13px", height: "13px" }} />
                      </button>

                      <div className="h-4 w-px mx-0.5" style={{ background: "rgba(212,184,139,0.35)" }} />

                      {/* Mode Lengkap Toggle */}
                      <button
                        onClick={() => setIsFullMode(!isFullMode)}
                        title={isFullMode ? "Mode Perkakas Lengkap (Aktif) — Klik untuk mode ringkas" : "Beralih ke Mode Perkakas Lengkap (Peralatan Tambahan & Lanjutan)"}
                        className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer flex-shrink-0"
                        style={{
                          background: isFullMode ? "linear-gradient(135deg, #8B6F47 0%, #6B4F2F 100%)" : "transparent",
                          color: isFullMode ? "#FFFFFF" : "#8B6F47",
                          border: isFullMode ? "1px solid #6B4F2F" : "1px solid transparent",
                          boxShadow: isFullMode ? "0 2px 6px rgba(139,111,71,0.3)" : "none",
                        }}
                      >
                        <SlidersHorizontal style={{ width: "12px", height: "12px" }} />
                        <span className="text-[11px] whitespace-nowrap">Mode Lengkap</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${isFullMode ? "bg-emerald-300 animate-pulse" : "bg-amber-500/50"}`} />
                      </button>

                      <div className="h-4 w-px mx-0.5" style={{ background: "rgba(212,184,139,0.35)" }} />

                      {/* Uncontrolled color picker for canvas background */}
                      <div className="relative flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer hover:bg-white transition-all" title="Warna latar kanvas">
                        <div
                          ref={bgColorSwatchRef}
                          className="w-8 h-8 sm:w-3.5 sm:h-3.5 rounded border"
                          style={{ background: canvasBackground, borderColor: "rgba(0,0,0,0.1)" }}
                        />
                        <span className="text-[10px] font-bold text-[#A89B8F] uppercase select-none hidden sm:inline">Latar</span>
                        <input
                          type="color"
                          ref={bgColorInputRef}
                          defaultValue={canvasBackground}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          title="Ubah warna latar kanvas"
                          onInput={(e) => {
                            const color = (e.target as HTMLInputElement).value;
                            bgColorRef.current = color;
                            if (containerRef.current) containerRef.current.style.background = color;
                            if (bgColorSwatchRef.current) bgColorSwatchRef.current.style.background = color;
                          }}
                          onChange={(e) => {
                            const color = e.target.value;
                            bgColorRef.current = color;
                            setCanvasBackground(color);
                            setCommittedBg(color);
                          }}
                        />
                      </div>

                      <div className="h-4 w-px mx-0.5" style={{ background: "rgba(212,184,139,0.35)" }} />

                      <button onClick={undoAll} disabled={!canUndo} title="Undo (Ctrl+Z)" className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-sm" style={{ color: "#8B6F47" }}>
                        <RotateCcw style={{ width: "13px", height: "13px" }} />
                      </button>
                      <button onClick={redoAll} disabled={!canRedo} title="Redo (Ctrl+Y)" className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-sm" style={{ color: "#8B6F47" }}>
                        <RotateCw style={{ width: "13px", height: "13px" }} />
                      </button>

                      <div className="h-4 w-px mx-0.5" style={{ background: "rgba(212,184,139,0.35)" }} />

                      <button onClick={clearAll} title="Bersihkan kanvas" className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer hover:bg-red-50" style={{ color: "#C0614A" }}>
                        <Trash2 style={{ width: "13px", height: "13px" }} />
                      </button>
                      <button onClick={handleSaveAndShowModal} disabled={isSaving} title="Simpan desain" className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-sm" style={{ color: "#8B6F47" }}>
                        {isSaving ? <Loader2 style={{ width: "13px", height: "13px" }} className="animate-spin" /> : <Save style={{ width: "13px", height: "13px" }} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Contextual tool options */}
                <div
                  className="px-4 flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 min-h-[52px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  style={{ background: "#FAF9F6" }}
                >

                  {/* Object-type controls: show whenever something is selected in select mode */}
                  {activeTool === "select" && selectedObject && selectedObjectType && !isCanvasMultiSelectMode && (
                    <div className="flex items-center gap-2 py-2.5">
                      {/* Full Mode Object Manipulation Suite */}
                      {isFullMode && (
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                          {/* Flip H & V */}
                          <div className="flex items-center p-0.5 rounded-lg border gap-0.5" style={{ background: "#FFFFFF", borderColor: "rgba(212,184,139,0.25)" }}>
                            <button
                              onClick={() => flipLayer(null, "x")}
                              title="Cermin Horizontal"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer"
                              style={{ color: "#8B6F47" }}
                            >
                              <FlipHorizontal style={{ width: "12px", height: "12px" }} />
                            </button>
                            <button
                              onClick={() => flipLayer(null, "y")}
                              title="Cermin Vertikal"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer"
                              style={{ color: "#8B6F47" }}
                            >
                              <FlipVertical style={{ width: "12px", height: "12px" }} />
                            </button>
                          </div>

                          {/* Rotate -90 / +90 */}
                          <div className="flex items-center p-0.5 rounded-lg border gap-0.5" style={{ background: "#FFFFFF", borderColor: "rgba(212,184,139,0.25)" }}>
                            <button
                              onClick={() => rotateSelectedObject(-90)}
                              title="Putar Kiri 90°"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer"
                              style={{ color: "#8B6F47" }}
                            >
                              <RotateCcw style={{ width: "12px", height: "12px" }} />
                            </button>
                            <button
                              onClick={() => rotateSelectedObject(90)}
                              title="Putar Kanan 90°"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer"
                              style={{ color: "#8B6F47" }}
                            >
                              <RotateCw style={{ width: "12px", height: "12px" }} />
                            </button>
                          </div>

                          {/* Layer Order: Front, Up, Down, Back */}
                          <div className="flex items-center p-0.5 rounded-lg border gap-0.5" style={{ background: "#FFFFFF", borderColor: "rgba(212,184,139,0.25)" }}>
                            <button
                              onClick={sendSelectedObjectToFront}
                              title="Paling Depan"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer"
                              style={{ color: "#8B6F47" }}
                            >
                              <ChevronsUp style={{ width: "12px", height: "12px" }} />
                            </button>
                            <button
                              onClick={() => moveLayer(selectedLayerId, "up")}
                              title="Maju Satu Tingkat"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer"
                              style={{ color: "#8B6F47" }}
                            >
                              <ArrowUp style={{ width: "12px", height: "12px" }} />
                            </button>
                            <button
                              onClick={() => moveLayer(selectedLayerId, "down")}
                              title="Mundur Satu Tingkat"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer"
                              style={{ color: "#8B6F47" }}
                            >
                              <ArrowDown style={{ width: "12px", height: "12px" }} />
                            </button>
                            <button
                              onClick={sendSelectedObjectToBack}
                              title="Paling Belakang"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer"
                              style={{ color: "#8B6F47" }}
                            >
                              <ChevronsDown style={{ width: "12px", height: "12px" }} />
                            </button>
                          </div>

                          {/* Align to Canvas */}
                          <div className="hidden md:flex items-center p-0.5 rounded-lg border gap-0.5" style={{ background: "#FFFFFF", borderColor: "rgba(212,184,139,0.25)" }}>
                            <button
                              onClick={() => alignSelectedObject("left")}
                              title="Rata Kiri Kanvas"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer text-[10px] font-bold"
                              style={{ color: "#8B6F47" }}
                            >
                              L
                            </button>
                            <button
                              onClick={() => alignSelectedObject("centerH")}
                              title="Rata Tengah Kanvas"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer text-[10px] font-bold"
                              style={{ color: "#8B6F47" }}
                            >
                              C
                            </button>
                            <button
                              onClick={() => alignSelectedObject("right")}
                              title="Rata Kanan Kanvas"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer text-[10px] font-bold"
                              style={{ color: "#8B6F47" }}
                            >
                              R
                            </button>
                          </div>

                          {/* Duplicate, Lock, Delete */}
                          <div className="flex items-center p-0.5 rounded-lg border gap-0.5" style={{ background: "#FFFFFF", borderColor: "rgba(212,184,139,0.25)" }}>
                            <button
                              onClick={() => duplicateLayer(selectedLayerId)}
                              title="Duplikat Objek (Ctrl+D)"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer"
                              style={{ color: "#8B6F47" }}
                            >
                              <Copy style={{ width: "12px", height: "12px" }} />
                            </button>
                            <button
                              onClick={() => toggleLayerLock(selectedLayerId)}
                              title="Kunci / Buka Kunci Objek"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-100 cursor-pointer"
                              style={{ color: "#8B6F47" }}
                            >
                              {layers.find(l => l.id === selectedLayerId)?.locked ? <Lock style={{ width: "12px", height: "12px", color: "#C0614A" }} /> : <Unlock style={{ width: "12px", height: "12px" }} />}
                            </button>
                            <button
                              onClick={() => deleteSelectedLayer(selectedLayerId)}
                              title="Hapus Objek"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 cursor-pointer"
                              style={{ color: "#C0614A" }}
                            >
                              <Trash2 style={{ width: "12px", height: "12px" }} />
                            </button>
                          </div>

                          <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
                        </div>
                      )}

                      {selectedObjectType === "shape" ? (
                        <div className="flex items-center gap-3">
                          {!(selectedObject instanceof fabric.Line) && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Isi</span>
                              <div className="relative rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: shapeFill, border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4)", width: "24px", height: "24px" }}>
                                <input type="color" value={shapeFill} onChange={(e) => setShapeFill(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Garis</span>
                            <div className="relative rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: shapeStroke, border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4)", width: "24px", height: "24px" }}>
                              <input type="color" value={shapeStroke} onChange={(e) => setShapeStroke(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                            </div>
                            <input type="range" min="1" max="20" step="1" value={shapeStrokeWidth} onChange={(e) => setShapeStrokeWidth(Number(e.target.value))} className="h-1.5 rounded-full appearance-none cursor-pointer w-[60px] sm:w-16" style={{ accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${(shapeStrokeWidth / 20) * 100}%, rgba(139,111,71,0.15) 0%)` }} />
                            <span className="text-[10px] font-bold font-mono flex-shrink-0" style={{ color: "#3D2B1F", minWidth: "26px" }}>{shapeStrokeWidth}px</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Opasitas</span>
                            <input type="range" min="10" max="100" step="10" value={shapeOpacity} onChange={(e) => setShapeOpacity(Number(e.target.value))} className="h-1.5 rounded-full appearance-none cursor-pointer w-[60px] sm:w-16" style={{ accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${shapeOpacity}%, rgba(139,111,71,0.15) 0%)` }} />
                            <span className="text-[10px] font-bold font-mono flex-shrink-0" style={{ color: "#3D2B1F", minWidth: "32px" }}>{shapeOpacity}%</span>
                          </div>
                        </div>
                      ) : selectedObjectType === "text" ? (
                        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap py-1">
                          {/* Font Family Dropdown */}
                          <FontPicker
                            value={fontFamily}
                            onChange={(newFont) => {
                              setFontFamily(newFont);
                              applyTextStyle({ fontFamily: newFont });
                            }}
                          />

                          {/* Font Size */}
                          <div className="flex items-center gap-1">
                            <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Ukuran</span>
                            <button
                              type="button"
                              title="Perkecil Ukuran Huruf"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const next = Math.max(8, fontSize - 4);
                                setFontSize(next);
                                applyTextStyle({ fontSize: next });
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-white transition-all"
                              style={{ borderColor: "rgba(212,184,139,0.3)", color: "#8B6F47", background: "#FAF9F6" }}
                            >
                              <Minus style={{ width: "10px", height: "10px" }} />
                            </button>
                            <span className="text-xs font-bold font-mono w-7 text-center" style={{ color: "#3D2B1F" }}>{fontSize}</span>
                            <button
                              type="button"
                              title="Perbesar Ukuran Huruf"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const next = Math.min(160, fontSize + 4);
                                setFontSize(next);
                                applyTextStyle({ fontSize: next });
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-white transition-all"
                              style={{ borderColor: "rgba(212,184,139,0.3)", color: "#8B6F47", background: "#FAF9F6" }}
                            >
                              <Plus style={{ width: "10px", height: "10px" }} />
                            </button>
                          </div>

                          <div className="h-5 w-px" style={{ background: "rgba(212,184,139,0.35)" }} />

                          {/* Text Formatting: Bold, Italic, Underline, Strikethrough */}
                          <div className="flex items-center p-0.5 rounded-lg border gap-0.5" style={{ background: "#FAF9F6", borderColor: "rgba(212,184,139,0.3)" }}>
                            <button
                              type="button"
                              title="Tebal (Bold)"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const next = !isBold;
                                setIsBold(next);
                                applyTextStyle({ fontWeight: next ? "bold" : "normal" });
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer"
                              style={{
                                background: isBold ? "#8B6F47" : "transparent",
                                color: isBold ? "#ffffff" : "#3D2B1F",
                                boxShadow: isBold ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                              }}
                            >
                              <Bold style={{ width: "12px", height: "12px" }} />
                            </button>
                            <button
                              type="button"
                              title="Miring (Italic)"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const next = !isItalic;
                                setIsItalic(next);
                                applyTextStyle({ fontStyle: next ? "italic" : "normal" });
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer"
                              style={{
                                background: isItalic ? "#8B6F47" : "transparent",
                                color: isItalic ? "#ffffff" : "#3D2B1F",
                                boxShadow: isItalic ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                              }}
                            >
                              <Italic style={{ width: "12px", height: "12px" }} />
                            </button>
                            <button
                              type="button"
                              title="Garis Bawah (Underline)"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const next = !isUnderline;
                                setIsUnderline(next);
                                applyTextStyle({ underline: next });
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer"
                              style={{
                                background: isUnderline ? "#8B6F47" : "transparent",
                                color: isUnderline ? "#ffffff" : "#3D2B1F",
                                boxShadow: isUnderline ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                              }}
                            >
                              <Underline style={{ width: "12px", height: "12px" }} />
                            </button>
                            <button
                              type="button"
                              title="Coret (Strikethrough)"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const next = !isLinethrough;
                                setIsLinethrough(next);
                                applyTextStyle({ linethrough: next });
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer"
                              style={{
                                background: isLinethrough ? "#8B6F47" : "transparent",
                                color: isLinethrough ? "#ffffff" : "#3D2B1F",
                                boxShadow: isLinethrough ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                              }}
                            >
                              <Strikethrough style={{ width: "12px", height: "12px" }} />
                            </button>
                          </div>

                          <div className="h-5 w-px hidden sm:block" style={{ background: "rgba(212,184,139,0.35)" }} />

                          {/* Text Alignment */}
                          <div className="hidden sm:flex items-center p-0.5 rounded-lg border gap-0.5" style={{ background: "#FAF9F6", borderColor: "rgba(212,184,139,0.3)" }}>
                            <button
                              type="button"
                              title="Rata Kiri"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setTextAlign("left");
                                applyTextStyle({ textAlign: "left" });
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer"
                              style={{
                                background: textAlign === "left" ? "#8B6F47" : "transparent",
                                color: textAlign === "left" ? "#ffffff" : "#3D2B1F",
                              }}
                            >
                              <AlignLeft style={{ width: "12px", height: "12px" }} />
                            </button>
                            <button
                              type="button"
                              title="Rata Tengah"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setTextAlign("center");
                                applyTextStyle({ textAlign: "center" });
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer"
                              style={{
                                background: textAlign === "center" ? "#8B6F47" : "transparent",
                                color: textAlign === "center" ? "#ffffff" : "#3D2B1F",
                              }}
                            >
                              <AlignCenter style={{ width: "12px", height: "12px" }} />
                            </button>
                            <button
                              type="button"
                              title="Rata Kanan"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setTextAlign("right");
                                applyTextStyle({ textAlign: "right" });
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer"
                              style={{
                                background: textAlign === "right" ? "#8B6F47" : "transparent",
                                color: textAlign === "right" ? "#ffffff" : "#3D2B1F",
                              }}
                            >
                              <AlignRight style={{ width: "12px", height: "12px" }} />
                            </button>
                          </div>

                          {/* Extra Text Controls in Full Mode: Letter Spacing */}
                          {isFullMode && (
                            <>
                              <div className="h-5 w-px hidden sm:block" style={{ background: "rgba(212,184,139,0.35)" }} />
                              <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Spasi Huruf</span>
                                <div className="flex items-center p-0.5 rounded-lg border gap-0.5" style={{ background: "#FAF9F6", borderColor: "rgba(212,184,139,0.3)" }}>
                                  {[
                                    { label: "Normal", val: 0 },
                                    { label: "+", val: 40 },
                                    { label: "++", val: 100 },
                                  ].map(({ label, val }) => (
                                    <button
                                      key={label}
                                      type="button"
                                      title={`Spasi Huruf: ${label}`}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setCharSpacing(val);
                                        applyTextStyle({ charSpacing: val });
                                      }}
                                      className="px-2 h-6 text-[10px] font-bold rounded cursor-pointer transition-all"
                                      style={{
                                        background: charSpacing === val ? "#8B6F47" : "transparent",
                                        color: charSpacing === val ? "#ffffff" : "#3D2B1F",
                                      }}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          <div className="h-5 w-px" style={{ background: "rgba(212,184,139,0.35)" }} />

                          {/* Text Color */}
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Warna</span>
                            <div
                              className="relative rounded-lg cursor-pointer hover:scale-105 transition-all flex-shrink-0"
                              title="Pilih Warna Kustom"
                              style={{
                                background: textColor,
                                width: "26px",
                                height: "26px",
                                border: "2px solid rgba(255,255,255,0.85)",
                                boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4), 0 2px 4px rgba(0,0,0,0.1)",
                              }}
                            >
                              <input
                                type="color"
                                value={textColor}
                                onChange={(e) => {
                                  const c = e.target.value;
                                  setTextColor(c);
                                  applyTextStyle({ fill: c });
                                }}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                              />
                            </div>
                            <div className="flex gap-1 items-center flex-wrap">
                              {[
                                { color: "#3D2B1F", label: "Cokelat Sogan" },
                                { color: "#8B6F47", label: "Emas Batik" },
                                { color: "#D4B88B", label: "Krem Parang" },
                                { color: "#2A4B7C", label: "Biru Indigo" },
                                { color: "#2D5A2D", label: "Hijau Lumut" },
                                { color: "#8B2A2A", label: "Merah Mengkudu" },
                                { color: "#ffffff", label: "Putih Mori" },
                                { color: "#1A1A1A", label: "Hitam Pekat" },
                              ].map(({ color: c, label }) => (
                                <button
                                  key={c}
                                  type="button"
                                  title={label}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setTextColor(c);
                                    applyTextStyle({ fill: c });
                                  }}
                                  className="rounded-md transition-all hover:scale-115 cursor-pointer flex-shrink-0"
                                  style={{
                                    width: textColor === c ? "20px" : "16px",
                                    height: textColor === c ? "20px" : "16px",
                                    background: c,
                                    border: textColor === c ? "2.5px solid #3D2B1F" : "1.5px solid rgba(0,0,0,0.15)",
                                    boxShadow: textColor === c ? "0 2px 6px rgba(0,0,0,0.2)" : "none",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : selectedObjectType === "pattern" ? (
                        <div className="flex items-center gap-2">
                          <Palette style={{ width: "12px", height: "12px", color: "#8B6F47", flexShrink: 0 }} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none hidden sm:inline">Warna Motif</span>
                          <div className="flex items-center gap-1.5">
                            {colorPresets.map((preset) => (
                              <button
                                key={preset.name}
                                title={preset.name}
                                onClick={() => setSelectedPreset(preset)}
                                className="rounded-full transition-all hover:scale-110 cursor-pointer flex-shrink-0"
                                style={{
                                  width: selectedPreset.name === preset.name ? "20px" : "16px",
                                  height: selectedPreset.name === preset.name ? "20px" : "16px",
                                  background: preset.colors.primary,
                                  border: `${selectedPreset.name === preset.name ? "2.5" : "1.5"}px solid ${selectedPreset.name === preset.name ? "#3D2B1F" : "rgba(0,0,0,0.12)"}`,
                                  boxShadow: selectedPreset.name === preset.name ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                                }}
                              />
                            ))}
                          </div>
                          <div className="h-4 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
                          <div className="relative rounded-lg cursor-pointer transition-all hover:scale-105 flex-shrink-0" title="Warna kustom" style={{ background: customColor, width: "24px", height: "24px", border: selectedPreset.name === "Custom" ? "2.5px solid #3D2B1F" : "2px solid rgba(255,255,255,0.8)", boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4)", borderRadius: "8px" }}>
                            <input type="color" defaultValue={customColor}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (canvasColorCommitTimerRef.current) clearTimeout(canvasColorCommitTimerRef.current);
                                canvasColorCommitTimerRef.current = setTimeout(() => {
                                  setCustomColor(v);
                                  setSelectedPreset({ name: "Custom", colors: { primary: v, secondary: v, accent: v, background: "transparent" }, batik: { background: "#f3f3f3", light: v, mid: v, dark: v } });
                                  canvasColorCommitTimerRef.current = null;
                                }, 150);
                              }}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* No selection hint — only in select mode with nothing selected */}
                  {activeTool === "select" && !selectedObject && (
                    <div className="flex items-center gap-2 py-2.5 flex-wrap">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: "rgba(139,111,71,0.07)", border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}>
                        <MousePointer2 style={{ width: "12px", height: "12px", flexShrink: 0 }} />
                        <span>Klik objek di kanvas untuk memilih, lalu geser, putar, atau ubah ukurannya</span>
                      </div>
                      {isFullMode && (
                        <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#A89B8F]">
                          <span>Tips Pintasan:</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[10px] text-stone-700">Ctrl+Z</kbd>
                          <span>Undo</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[10px] text-stone-700">Ctrl+D</kbd>
                          <span>Duplikat</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[10px] text-stone-700">Del</kbd>
                          <span>Hapus</span>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTool === "brush" && (
                    <div className="flex items-center gap-2 sm:gap-3 py-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none whitespace-nowrap">Warna</span>
                        <div className="relative p-0.5 rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: brushColor, border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4), 0 2px 6px rgba(0,0,0,0.12)", width: "26px", height: "26px", borderRadius: "8px" }}>
                          <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {[
                            { c: "#3D2B1F", name: "Cokelat Sogan" },
                            { c: "#8B6F47", name: "Emas Batik" },
                            { c: "#D4B88B", name: "Krem Mori" },
                            { c: "#2A4B7C", name: "Biru Indigo" },
                            { c: "#2D5A2D", name: "Hijau Lumut" },
                            { c: "#8B2A2A", name: "Merah Mengkudu" },
                            { c: "#D97706", name: "Kuning Kunyit" },
                            { c: "#6B3A1F", name: "Kayu Tingi" },
                            { c: "#000000", name: "Malam Hitam" },
                            { c: "#ffffff", name: "Putih Mori" },
                          ].map(({ c, name }, idx) => (
                            <button key={c} onClick={() => setBrushColor(c)} title={`${name} (${c})`} className={`${idx >= 8 ? "hidden md:inline-flex" : ""} transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer flex-shrink-0`} style={{ width: brushColor === c ? "20px" : "16px", height: brushColor === c ? "20px" : "16px", borderRadius: "6px", background: c, border: brushColor === c ? "2.5px solid #3D2B1F" : "1.5px solid rgba(0,0,0,0.12)", boxShadow: brushColor === c ? "0 2px 6px rgba(0,0,0,0.15)" : "none" }} />
                          ))}
                        </div>
                      </div>

                      {/* Canting & Brush presets in Full Mode */}
                      {isFullMode && (
                        <>
                          <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
                          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                            {[
                              { size: 2, label: "Cecek (2px)" },
                              { size: 4, label: "Isen (4px)" },
                              { size: 8, label: "Garis (8px)" },
                              { size: 16, label: "Sedang (16px)" },
                              { size: 32, label: "Blok (32px)" },
                            ].map(({ size, label }) => (
                              <button
                                key={size}
                                onClick={() => setBrushSize([size])}
                                title={label}
                                className="px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer flex-shrink-0"
                                style={{
                                  background: brushSize[0] === size ? "#8B6F47" : "rgba(139,111,71,0.08)",
                                  color: brushSize[0] === size ? "#ffffff" : "#6B4F2F",
                                }}
                              >
                                {label.split(" ")[0]}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none whitespace-nowrap">Ukuran</span>
                        <button onClick={() => setBrushSize([Math.max(2, brushSize[0] - 2)])} className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-white hover:shadow-sm cursor-pointer" style={{ border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}><Minus style={{ width: "10px", height: "10px" }} /></button>
                        <input type="range" min="2" max="80" step="2" value={brushSize[0]} onChange={(e) => setBrushSize([Number(e.target.value)])} className="h-1.5 rounded-full appearance-none cursor-pointer w-[60px] sm:w-[90px]" style={{ accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${((brushSize[0] - 2) / 78) * 100}%, rgba(139,111,71,0.15) 0%)` }} />
                        <button onClick={() => setBrushSize([Math.min(80, brushSize[0] + 2)])} className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-white hover:shadow-sm cursor-pointer" style={{ border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}><Plus style={{ width: "10px", height: "10px" }} /></button>
                        <span className="text-xs font-bold font-mono text-right flex-shrink-0" style={{ color: "#3D2B1F", minWidth: "24px" }}>{brushSize[0]}</span>
                      </div>
                      <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none whitespace-nowrap">Opasitas</span>
                        <input type="range" min="5" max="100" step="5" value={brushOpacity[0]} onChange={(e) => setBrushOpacity([Number(e.target.value)])} className="h-1.5 rounded-full appearance-none cursor-pointer w-[60px] sm:w-[72px]" style={{ accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${brushOpacity[0]}%, rgba(139,111,71,0.15) 0%)` }} />
                        <span className="text-xs font-bold font-mono flex-shrink-0" style={{ color: "#3D2B1F", minWidth: "32px" }}>{brushOpacity[0]}%</span>
                      </div>
                    </div>
                  )}

                  {activeTool === "eraser" && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none whitespace-nowrap">Ukuran Hapus</span>
                        <button onClick={() => setBrushSize([Math.max(2, brushSize[0] - 2)])} className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-white hover:shadow-sm cursor-pointer" style={{ border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}><Minus style={{ width: "10px", height: "10px" }} /></button>
                        <input type="range" min="2" max="80" step="2" value={brushSize[0]} onChange={(e) => setBrushSize([Number(e.target.value)])} className="h-1.5 rounded-full appearance-none cursor-pointer w-[60px] sm:w-[100px]" style={{ accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${((brushSize[0] - 2) / 78) * 100}%, rgba(139,111,71,0.15) 0%)` }} />
                        <button onClick={() => setBrushSize([Math.min(80, brushSize[0] + 2)])} className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:bg-white hover:shadow-sm cursor-pointer" style={{ border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}><Plus style={{ width: "10px", height: "10px" }} /></button>
                        <span className="text-xs font-bold font-mono flex-shrink-0" style={{ color: "#3D2B1F", minWidth: "24px" }}>{brushSize[0]}</span>
                      </div>
                    </div>
                  )}

                  {activeTool === "fill" && (
                    <div className="flex items-center gap-3 py-2">
                      <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none whitespace-nowrap">Warna Isi</span>
                      <div className="relative p-0.5 rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: brushColor, border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4), 0 2px 6px rgba(0,0,0,0.12)", width: "26px", height: "26px", borderRadius: "8px" }}>
                        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[
                          { c: "#3D2B1F", name: "Cokelat Sogan" },
                          { c: "#8B6F47", name: "Emas Batik" },
                          { c: "#D4B88B", name: "Krem Mori" },
                          { c: "#2A4B7C", name: "Biru Indigo" },
                          { c: "#2D5A2D", name: "Hijau Lumut" },
                          { c: "#8B2A2A", name: "Merah Mengkudu" },
                          { c: "#D97706", name: "Kuning Kunyit" },
                          { c: "#6B3A1F", name: "Kayu Tingi" },
                          { c: "#000000", name: "Malam Hitam" },
                          { c: "#ffffff", name: "Putih Mori" },
                        ].map(({ c, name }, idx) => (
                          <button key={c} onClick={() => setBrushColor(c)} title={`${name} (${c})`} className={`${idx >= 8 ? "hidden sm:inline-flex" : ""} transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer flex-shrink-0`} style={{ width: brushColor === c ? "20px" : "16px", height: brushColor === c ? "20px" : "16px", borderRadius: "6px", background: c, border: brushColor === c ? "2.5px solid #3D2B1F" : "1.5px solid rgba(0,0,0,0.12)", boxShadow: brushColor === c ? "0 2px 6px rgba(0,0,0,0.15)" : "none" }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTool === "shape" && (
                    <div className="flex items-center gap-2 sm:gap-3 py-2 flex-wrap">
                      <div className="flex-shrink-0">
                        <div className="flex items-center p-0.5 rounded-xl gap-0.5" style={{ background: "rgba(139,111,71,0.08)", border: "1px solid rgba(212,184,139,0.2)" }}>
                          {(([
                            { t: "rect" as ShapeType, icon: Square, label: "Kotak" },
                            { t: "circle" as ShapeType, icon: Circle, label: "Lingkaran" },
                            { t: "triangle" as ShapeType, icon: Triangle, label: "Segitiga" },
                            { t: "diamond" as ShapeType, icon: Diamond, label: "Belah Ketupat" },
                            { t: "star" as ShapeType, icon: Star, label: "Bintang" },
                            { t: "line" as ShapeType, icon: Slash, label: "Garis" },
                          ])).map(({ t, icon: Icon, label }) => {
                            const isActive = shapeType === t;
                            return (
                              <button key={t} onClick={() => setShapeType(t)} title={label}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer"
                                style={{ background: isActive ? "white" : "transparent", color: isActive ? "#8B6F47" : "#7A6B5E", boxShadow: isActive ? "0 1px 6px rgba(0,0,0,0.1)" : "none" }}>
                                <Icon style={{ width: "12px", height: "12px" }} />
                                <span className="hidden sm:inline">{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
                      {shapeType !== "line" && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none">Isi</span>
                          <div className="relative rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: shapeFill, border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4), 0 2px 4px rgba(0,0,0,0.1)", width: "24px", height: "24px" }}>
                            <input type="color" value={shapeFill} onChange={(e) => setShapeFill(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none">Garis</span>
                        <div className="relative rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: shapeStroke, border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4), 0 2px 4px rgba(0,0,0,0.1)", width: "24px", height: "24px" }}>
                          <input type="color" value={shapeStroke} onChange={(e) => setShapeStroke(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                        </div>
                        <input type="range" min="1" max="20" step="1" value={shapeStrokeWidth} onChange={(e) => setShapeStrokeWidth(Number(e.target.value))} className="h-1.5 rounded-full appearance-none cursor-pointer w-[60px] sm:w-16" style={{ accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${(shapeStrokeWidth / 20) * 100}%, rgba(139,111,71,0.15) 0%)` }} />
                        <span className="text-[10px] font-bold font-mono flex-shrink-0" style={{ color: "#3D2B1F", minWidth: "26px" }}>{shapeStrokeWidth}px</span>
                      </div>
                      <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none">Opasitas</span>
                        <input type="range" min="10" max="100" step="10" value={shapeOpacity} onChange={(e) => setShapeOpacity(Number(e.target.value))} className="h-1.5 rounded-full appearance-none cursor-pointer w-[60px] sm:w-16" style={{ accentColor: "#8B6F47", background: `linear-gradient(to right, #8B6F47 ${shapeOpacity}%, rgba(139,111,71,0.15) 0%)` }} />
                        <span className="text-[10px] font-bold font-mono flex-shrink-0" style={{ color: "#3D2B1F", minWidth: "32px" }}>{shapeOpacity}%</span>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Canvas Area */}
              <div className="p-2 sm:p-4 lg:p-6 bg-[#F8F6F2]" style={{ borderTop: "1px solid rgba(212,184,139,0.12)" }}>
                <div className="relative rounded-2xl overflow-hidden shadow-inner border border-stone-200/50" style={{ boxShadow: "inset 0 4px 20px rgba(61,43,31,0.05)" }}>
                  <div
                    ref={containerRef}
                    className="aspect-[4/3] relative overflow-hidden select-none touch-manipulation"
                    style={{
                      background: canvasBackground,
                      boxShadow: isDragOverCanvas ? "inset 0 0 0 3px #8B6F47" : undefined,
                      transition: "box-shadow 0.15s ease",
                      touchAction: "none",
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                      if (!isDragOverCanvas) setIsDragOverCanvas(true);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsDragOverCanvas(false);
                      }
                    }}
                    onDrop={handleCanvasDrop}
                  >
                    {/* Grid Guide Overlay */}
                    {showGrid && (
                      <div
                        className="absolute inset-0 pointer-events-none z-[5]"
                        style={{
                          backgroundImage: "linear-gradient(to right, rgba(139,111,71,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(139,111,71,0.12) 1px, transparent 1px)",
                          backgroundSize: "40px 40px",
                        }}
                      />
                    )}

                    <canvas
                      ref={displayCanvasRef}
                      width={800}
                      height={600}
                      style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none', touchAction: 'manipulation' }}
                    />
                    <div
                      ref={(el) => {
                        (fabricCanvasRef as any).wrapper = el;
                      }}
                      style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'auto', touchAction: 'manipulation' }}
                      onContextMenu={(e: React.MouseEvent) => {
                        e.preventDefault();
                        if (!selectedObject || activeTool !== "select") return;
                        const container = containerRef.current;
                        if (!container) return;
                        const rect = container.getBoundingClientRect();
                        setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      }}
                    >
                      <canvas ref={canvasRef} />
                    </div>
                    {layers.length === 0 && !hasOffscreenContent && (
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center"
                        style={{ color: "#A89B8F", zIndex: 3 }}
                      >
                        <Layers className="w-10 h-10 sm:w-14 sm:h-14 mb-3 opacity-20" style={{ color: "#8B6F47" }} />
                        <p className="text-sm sm:text-base font-semibold" style={{ color: "#5A4A3E" }}>Kanvas Karya Kosong</p>
                        <p className="text-xs opacity-75 mt-0.5">Pilih & klik motif di sidebar kanan, atau seret langsung ke kanvas</p>
                      </div>
                    )}

                    {isCanvasMultiSelectMode && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 20,
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 110,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 14px",
                          borderRadius: 20,
                          background: "rgba(30,20,10,0.88)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                          whiteSpace: "nowrap",
                          pointerEvents: "auto",
                        }}
                      >
                        <CheckCircle2 style={{ width: 13, height: 13, color: "#D4B88B" }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#E8E1DA" }}>
                          {canvasSelectedIds.size > 0
                            ? `${canvasSelectedIds.size} objek dipilih`
                            : "Klik objek di kanvas untuk memilih"}
                        </span>
                        {canvasSelectedIds.size > 0 && (
                          <>
                            <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)" }} />
                            <button
                              onClick={applyCanvasMultiSelect}
                              style={{
                                padding: "3px 10px", borderRadius: 12, border: "none",
                                background: "rgba(212,184,139,0.25)", color: "#D4B88B",
                                fontSize: 11, fontWeight: 700, cursor: "pointer",
                              }}
                            >
                              Terapkan
                            </button>
                          </>
                        )}
                        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)" }} />
                        <button
                          onClick={toggleCanvasMultiSelectMode}
                          style={{
                            width: 22, height: 22, borderRadius: 6, border: "none",
                            background: "transparent", cursor: "pointer", color: "#A89B8F",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <X style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    )}

                    {/* Floating context toolbar — Canva-style, appears above selected object; hidden in multi-select mode to prevent wrong coordinates */}
                    {selectedObject && !isCanvasMultiSelectMode && (activeTool === "select" || activeTool === "shape") && !isDraggingObjectRef.current && (() => {
                      // Trigger re-render when toolbarUpdate changes
                      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                      toolbarUpdate;
                      const pos = getObjectToolbarPosition();
                      if (!pos) return null;
                      return (
                        <div
                          data-object-toolbar
                          style={{
                            position: "absolute",
                            left: pos.left,
                            top: pos.top,
                            transform: "translateX(-50%)",
                            zIndex: 50,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                            pointerEvents: "auto",
                          }}
                        >
                          {/* Primary bar */}
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              padding: "4px 6px",
                              borderRadius: 12,
                              background: "rgba(30,20,10,0.88)",
                              backdropFilter: "blur(8px)",
                              border: "1px solid rgba(255,255,255,0.10)",
                              boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {/* Duplicate */}
                            <button
                              title="Duplikat"
                              onClick={(e) => { e.stopPropagation(); duplicateLayer(); }}
                              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "#E8E1DA" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <Copy style={{ width: 14, height: 14 }} />
                            </button>
                            {/* Delete */}
                            <button
                              title="Hapus"
                              onClick={(e) => { e.stopPropagation(); deleteSelectedLayer(); }}
                              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "#F87171" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                            {/* Divider */}
                            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />
                            {/* Flip H */}
                            <button
                              title="Balik Horizontal"
                              onClick={(e) => { e.stopPropagation(); flipLayer(null, "x"); }}
                              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "#E8E1DA" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <FlipHorizontal style={{ width: 14, height: 14 }} />
                            </button>
                            {/* Flip V */}
                            <button
                              title="Balik Vertikal"
                              onClick={(e) => { e.stopPropagation(); flipLayer(null, "y"); }}
                              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "#E8E1DA" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <FlipVertical style={{ width: 14, height: 14 }} />
                            </button>
                            {/* Divider */}
                            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />
                            {/* Canvas multi-select toggle */}
                            <button
                              title="Pilih Banyak Objek"
                              onClick={(e) => { e.stopPropagation(); toggleCanvasMultiSelectMode(); }}
                              style={{
                                width: 28, height: 28,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: 7, border: "none",
                                background: isCanvasMultiSelectMode ? "rgba(212,184,139,0.3)" : "transparent",
                                cursor: "pointer", color: isCanvasMultiSelectMode ? "#D4B88B" : "#E8E1DA",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                              onMouseLeave={e => (e.currentTarget.style.background = isCanvasMultiSelectMode ? "rgba(212,184,139,0.3)" : "transparent")}
                            >
                              <CheckCircle2 style={{ width: 14, height: 14 }} />
                            </button>
                            {/* More options toggle */}
                            <button
                              title="Lainnya"
                              onClick={(e) => { e.stopPropagation(); setShowObjectMenu(v => !v); }}
                              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "none", background: showObjectMenu ? "rgba(255,255,255,0.18)" : "transparent", cursor: "pointer", color: "#D4B88B" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                              onMouseLeave={e => (e.currentTarget.style.background = showObjectMenu ? "rgba(255,255,255,0.18)" : "transparent")}
                            >
                              {/* MoreHorizontal — three dots */}
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                              </svg>
                            </button>
                          </motion.div>

                          {/* Secondary dropdown */}
                          <AnimatePresence>
                            {showObjectMenu && (
                              <motion.div
                                data-object-toolbar
                                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                transition={{ duration: 0.12 }}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                  padding: "6px",
                                  borderRadius: 10,
                                  background: "rgba(30,20,10,0.92)",
                                  backdropFilter: "blur(8px)",
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                                  minWidth: 160,
                                }}
                              >
                                {/* Move up */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveLayer(null, "up"); setShowObjectMenu(false); }}
                                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "#E8E1DA", width: "100%", textAlign: "left" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                  <ArrowUp style={{ width: 13, height: 13, flexShrink: 0 }} />
                                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#D4B88B" }}>Pindah ke depan</span>
                                </button>
                                {/* Move down */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveLayer(null, "down"); setShowObjectMenu(false); }}
                                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "#E8E1DA", width: "100%", textAlign: "left" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                  <ArrowDown style={{ width: 13, height: 13, flexShrink: 0 }} />
                                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#D4B88B" }}>Pindah ke belakang</span>
                                </button>
                                {/* Divider */}
                                <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "2px 0" }} />
                                {/* Toggle visibility */}
                                {(() => {
                                  const fc = fabricCanvasRef.current;
                                  if (!fc) return null;
                                  const activeObjects = fc.getActiveObjects();
                                  if (activeObjects.length === 0) return null;

                                  const allVisible = activeObjects.every(obj => obj.visible !== false);

                                  return (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(null); setShowObjectMenu(false); }}
                                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "#E8E1DA", width: "100%", textAlign: "left" }}
                                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                    >
                                      {allVisible ? <EyeOff style={{ width: 13, height: 13, flexShrink: 0 }} /> : <Eye style={{ width: 13, height: 13, flexShrink: 0 }} />}
                                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#D4B88B" }}>{allVisible ? "Sembunyikan" : "Tampilkan"}</span>
                                    </button>
                                  );
                                })()}
                                {/* Toggle lock */}
                                {(() => {
                                  const fc = fabricCanvasRef.current;
                                  if (!fc) return null;
                                  const activeObjects = fc.getActiveObjects();
                                  if (activeObjects.length === 0) return null;

                                  const anyLocked = activeObjects.some(obj => !obj.selectable);

                                  return (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleLayerLock(null); setShowObjectMenu(false); }}
                                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "#E8E1DA", width: "100%", textAlign: "left" }}
                                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                    >
                                      {anyLocked ? <Unlock style={{ width: 13, height: 13, flexShrink: 0 }} /> : <Lock style={{ width: 13, height: 13, flexShrink: 0 }} />}
                                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#D4B88B" }}>{anyLocked ? "Buka kunci" : "Kunci layer"}</span>
                                    </button>
                                  );
                                })()}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}

                    {/* Right-click context menu */}
                    <AnimatePresence>
                      {contextMenu && selectedObject && (
                        <motion.div
                          data-object-toolbar
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.12 }}
                          style={{
                            position: "absolute",
                            left: contextMenu.x,
                            top: contextMenu.y,
                            zIndex: 60,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            padding: "6px",
                            borderRadius: 10,
                            background: "rgba(30,20,10,0.92)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                            minWidth: 168,
                            pointerEvents: "auto",
                          }}
                        >
                          {[
                            { icon: Copy, label: "Duplikat", action: () => { duplicateLayer(); } },
                            { icon: Trash2, label: "Hapus", action: () => { deleteSelectedLayer(); }, danger: true },
                            null,
                            { icon: FlipHorizontal, label: "Balik Horizontal", action: () => { flipLayer(null, "x"); } },
                            { icon: FlipVertical, label: "Balik Vertikal", action: () => { flipLayer(null, "y"); } },
                            null,
                            { icon: ArrowUp, label: "Pindah ke Depan", action: () => { moveLayer(null, "up"); } },
                            { icon: ArrowDown, label: "Pindah ke Belakang", action: () => { moveLayer(null, "down"); } },
                          ].map((item, i) => {
                            if (item === null) return <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "2px 0" }} />;
                            const Icon = item.icon;
                            return (
                              <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); item.action(); setContextMenu(null); }}
                                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: item.danger ? "#F87171" : "#E8E1DA", width: "100%", textAlign: "left" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                              >
                                <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />
                                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: item.danger ? "#F87171" : "#D4B88B" }}>{item.label}</span>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Horizontal scrollbar */}
                    <div
                      ref={horizontalScrollTrackRef}
                      className="hidden sm:block absolute bottom-2 left-2 right-10 h-2.5 rounded-full cursor-pointer bg-neutral-400/20 hover:bg-neutral-400/30 transition-all z-[110]"
                      style={{ backdropFilter: "blur(4px)" }}
                    >
                      <div
                        ref={horizontalScrollThumbRef}
                        className="absolute top-0 bottom-0 rounded-full bg-neutral-400/70 hover:bg-neutral-500/90 active:bg-neutral-600 transition-colors border border-black/5"
                        style={{ left: "0%", width: "100%" }}
                      />
                    </div>

                    {/* Vertical scrollbar */}
                    <div
                      ref={verticalScrollTrackRef}
                      className="hidden sm:block absolute top-2 bottom-10 right-2 w-2.5 rounded-full cursor-pointer bg-neutral-400/20 hover:bg-neutral-400/30 transition-all z-[110]"
                      style={{ backdropFilter: "blur(4px)" }}
                    >
                      <div
                        ref={verticalScrollThumbRef}
                        className="absolute left-0 right-0 rounded-full bg-neutral-400/70 hover:bg-neutral-500/90 active:bg-neutral-600 transition-colors border border-black/5"
                        style={{ top: "0%", height: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Bar */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: "linear-gradient(to right, #FAF8F5, #FFFFFF)", borderTop: "1px solid rgba(212,184,139,0.18)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#A89B8F] mb-0.5">Simpan atau Unduh</p>
                  <p className="text-xs sm:text-sm font-semibold text-[#3D2B1F] leading-snug">Simpan desain ke histori untuk dipesan nanti, atau unduh sebagai gambar.</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button onClick={downloadDesign} disabled={isDownloading || (layers.length === 0 && !hasOffscreenContent)}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 h-10 rounded-2xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 cursor-pointer border hover:shadow-sm active:scale-95"
                    style={{ color: "#5A3D2B", background: "#FFFFFF", borderColor: "rgba(139,111,71,0.3)" }}>
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>Unduh</span>
                  </button>
                  <button onClick={handleSaveAndShowModal} disabled={isSaving || (layers.length === 0 && !hasOffscreenContent)}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-5 h-10 rounded-2xl font-bold text-sm text-white transition-all duration-200 disabled:opacity-50 cursor-pointer hover:brightness-110 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #8B6F47 0%, #6B4F2F 100%)", boxShadow: "0 4px 16px rgba(139,111,71,0.35), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 h-full min-w-0">
            <div className="rounded-[32px] shadow-[0_20px_50px_rgba(61,43,31,0.06)] overflow-hidden border bg-white flex flex-col h-full max-h-[45vh] lg:max-h-none" style={{ borderColor: "rgba(212,184,139,0.3)" }}>
              {/* [OPT-6] SidebarTabs component */}
              <SidebarTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                patterns={patterns}
                loading={loading}
                selectedPreset={sidebarPreset}
                setSelectedPreset={setSidebarPreset}
                customColor={sidebarCustomColor}
                onCustomColorCommit={handleSidebarCustomColorCommit}
                addItemToCanvas={addItemToCanvas}
                renderMiniPattern={renderMiniPattern}
                layers={layers}
                selectedLayerId={selectedLayerId}
                setSelectedLayerId={setSelectedLayerId}
                setSelectedObject={setSelectedObject}
                setSelectedObjectType={setSelectedObjectType}
                fabricCanvasRef={fabricCanvasRef}
                moveLayer={moveLayer}
                toggleLayerVisibility={toggleLayerVisibility}
                toggleLayerLock={toggleLayerLock}
                duplicateLayer={duplicateLayer}
                deleteSelectedLayer={deleteSelectedLayer}
                layerItemRefs={layerItemRefs}
                addUploadedImageToCanvas={addUploadedImageToCanvas}
                flipLayer={flipLayer}
                isMultiSelectMode={isMultiSelectMode}
                toggleMultiSelectMode={toggleMultiSelectMode}
                selectedPatternIds={selectedPatternIds}
                togglePatternSelection={togglePatternSelection}
                onAddSelectedPatterns={addSelectedPatternsToCanvas}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSuccessModal(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-8 text-center shadow-2xl" style={{ border: "1px solid rgba(212,184,139,0.3)" }}>
              <button onClick={() => setShowSuccessModal(null)} className="absolute top-4 right-4 p-2 text-[#A89B8F] hover:bg-stone-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}>
                {showSuccessModal === "cart" ? <ShoppingCart className="w-10 h-10 text-white" /> : <CheckCircle2 className="w-10 h-10 text-white" />}
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                {showSuccessModal === "cart" ? "Berhasil!" : "Disimpan!"}
              </h3>
              <p className="text-[#7A6B5E] mb-8 text-sm">
                {showSuccessModal === "cart" ? "Desain kustom Anda berhasil ditambahkan ke keranjang belanja." : "Desain Anda berhasil disimpan di koleksi profil."}
              </p>
              <div className="space-y-3">
                {showSuccessModal === "cart" && (
                  <button onClick={() => navigate("/cart")} className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-95" style={{ background: "linear-gradient(135deg, #3D2B1F, #5A3D2B)" }}>Lihat Keranjang</button>
                )}
                <button onClick={() => setShowSuccessModal(null)} className="w-full py-3.5 rounded-xl font-bold transition-all" style={{ color: "#8B6F47", border: "1.5px solid rgba(139,111,71,0.2)", background: "rgba(139,111,71,0.04)" }}>Tutup</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Info Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProjectModal(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-8 shadow-2xl" style={{ border: "1px solid rgba(212,184,139,0.3)" }}>
              <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Detail Proyek Batik</h3>
              <p className="text-[#7A6B5E] mb-6 text-sm">Lengkapi informasi desain kustom Anda sebelum melanjutkan.</p>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">Nama Desain</label>
                  <input type="text" placeholder="Contoh: Batik Sarimbit Keluarga" value={projectInfo.name} onChange={(e) => setProjectInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all focus:border-[#8B6F47] focus:ring-1 focus:ring-[#8B6F47]" style={{ borderColor: "rgba(212,184,139,0.3)", background: "#FAF9F6" }} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">Deskripsi / Tujuan</label>
                  <textarea placeholder="Contoh: Untuk seragam pernikahan bulan depan" value={projectInfo.description} onChange={(e) => setProjectInfo(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all focus:border-[#8B6F47] focus:ring-1 focus:ring-[#8B6F47] resize-none h-24" style={{ borderColor: "rgba(212,184,139,0.3)", background: "#FAF9F6" }} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3D2B1F] mb-1.5">Pilihan Kain Dasar</label>
                  <select value={projectInfo.fabric} onChange={(e) => setProjectInfo(prev => ({ ...prev, fabric: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all focus:border-[#8B6F47] focus:ring-1 focus:ring-[#8B6F47]" style={{ borderColor: "rgba(212,184,139,0.3)", background: "#FAF9F6" }}>
                    <option value="Katun Primisima">Katun Primisima (Rekomendasi)</option>
                    <option value="Katun Dobby">Katun Dobby</option>
                    <option value="Sutra ATBM">Sutra ATBM</option>
                    <option value="Viscose">Viscose</option>
                  </select>
                </div>
              </div>
              <button onClick={confirmProjectInfo} disabled={!projectInfo.name.trim() || isSaving}
                className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-95"
                style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)" }}>
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {showProjectModal === "save" ? "Simpan Desain" : showProjectModal === "cart" ? "Simpan & Masukkan Keranjang" : "Simpan & Pesan Sekarang"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Canvas Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirmModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowClearConfirmModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-8 text-center shadow-2xl" style={{ border: "1px solid rgba(212,184,139,0.3)" }}>
              <button onClick={() => setShowClearConfirmModal(false)} className="absolute top-4 right-4 p-2 text-[#A89B8F] hover:bg-stone-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #DC2626, #EF4444)" }}>
                <Trash2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                Bersihkan Kanvas?
              </h3>
              <p className="text-[#7A6B5E] mb-8 text-sm">
                Semua desain, layer, dan riwayat edit akan dihapus. Tindakan ini tidak bisa dibatalkan.
              </p>
              <div className="space-y-3">
                <button onClick={confirmClearAll} className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-95" style={{ background: "linear-gradient(135deg, #DC2626, #EF4444)" }}>Ya, Bersihkan</button>
                <button onClick={() => setShowClearConfirmModal(false)} className="w-full py-3.5 rounded-xl font-bold transition-all" style={{ color: "#8B6F47", border: "1.5px solid rgba(139,111,71,0.2)", background: "rgba(139,111,71,0.04)" }}>Batal</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Navigation Blocker Confirmation Modal */}
      {blocker.state === "blocked" && (
        <AlertDialog
          open={true}
          onOpenChange={(open) => {
            if (!open && !isProceeding) {
              blocker.reset?.();
            }
          }}
        >
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                Tinggalkan Halaman?
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: "#7A6B5E" }}>
                Desain kustom Anda belum disimpan. Jika Anda keluar sekarang, seluruh perubahan yang belum disimpan akan hilang selamanya.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel onClick={() => blocker.reset?.()} className="rounded-xl">
                Lanjutkan Mengedit
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsProceeding(true);
                  // Immediate proceed now that isProceeding is true
                  blocker.proceed?.();
                }}
                className="rounded-xl"
                style={{ background: "#C0392B" }}
              >
                Ya, Tinggalkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
