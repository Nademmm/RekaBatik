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
} from "lucide-react";
import { useNavigate, useSearchParams, useBlocker } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
  eager: true,
}) as Record<string, string>;

const batikAssetSvgMap = Object.fromEntries(
  Object.entries(batikSvgModules).map(([path, svg]) => {
    const fileName = path.split("/").pop() ?? "";
    return [normalizeStyleType(fileName), svg];
  }),
);

const batikSvgMap: Record<string, string> = Object.fromEntries(
  Object.entries({
    ...batikAssetSvgMap,
    parang: batikAssetSvgMap["parang-batik"],
    "parang-new": batikAssetSvgMap.parang,
    mega: batikAssetSvgMap["mega-mendung"],
    "sido-mukti": batikAssetSvgMap.sidomukti,
  }).filter(([, svg]) => Boolean(svg)),
) as Record<string, string>;

const getBatikSvg = (styleType?: string) => {
  if (!styleType) return undefined;
  return batikSvgMap[normalizeStyleType(styleType)];
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

const batikAssetPatterns: BatikItem[] = Object.keys(batikAssetSvgMap)
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
    if (!styleType || !getBatikSvg(styleType)) return;

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

// [OPT-2] detectObjectType — centralized helper, defined once outside the component
function detectObjectType(target: fabric.Object): "pattern" | "shape" | "text" | null {
  if (!target) return null;
  const ctorName = target.constructor?.name?.toLowerCase() ?? "";
  if (ctorName.includes("text") || target.type === "i-text" || target.type === "text") return "text";
  if (ctorName.includes("image") || target.type === "image") return "pattern";
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
  renderMiniPattern: (pattern: BatikItem, presetName?: string) => React.ReactNode;
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
}: SidebarTabsProps) => {
  // [OPT-1b] Local refs for the custom color input — uncontrolled, so dragging
  // the picker never triggers a SidebarTabs (or parent) re-render. Only the
  // DOM text/swatch preview update on every drag tick; the actual commit
  // (which updates React state, regenerates the preset, and triggers recolor)
  // happens once on mouse-release via the input's onChange.
  const customColorInputRef = useRef<HTMLInputElement>(null);
  const customColorTextRef = useRef<HTMLSpanElement>(null);

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
        <div className="flex items-center gap-2 mb-4 px-1">
          <Palette className="w-4 h-4 text-[#8B6F47]" />
          <p style={{ color: "#7A6B5E", fontSize: "0.8rem", fontWeight: 500 }}>Pilih motif untuk diletakkan di kanvas:</p>
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
            patterns.map((pattern) => (
              <button
                key={pattern.id + "-" + selectedPreset.name}
                onClick={() => addItemToCanvas(pattern)}
                draggable
                onDragStart={(e) => {
                  // [DRAG] Store the pattern id so the canvas drop handler can
                  // look it up and spawn it exactly where the user dropped it.
                  e.dataTransfer.setData("application/x-batik-pattern-id", String(pattern.id));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200 text-left flex flex-col items-stretch cursor-grab active:cursor-grabbing bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#8B6F47]/40 hover:shadow-sm group"
                style={{ borderColor: "rgba(139,111,71,0.12)" }}
              >
                <div className="w-full aspect-square rounded-xl mb-3 overflow-hidden flex items-center justify-center p-2 transition-all bg-[#FAF8F5] group-hover:bg-[#FFFFFF] border"
                  style={{ borderColor: "rgba(139,111,71,0.06)", boxShadow: "inset 0 1px 3px rgba(139,111,71,0.02)" }}>
                  {renderMiniPattern(pattern)}
                </div>
                <div style={{ color: "#3D2B1F", fontSize: "0.85rem", fontWeight: 700, marginBottom: "2px" }} className="group-hover:text-[#8B6F47] transition-colors">
                  {pattern.name}
                </div>
                <div style={{ color: "#8E7F72", fontSize: "0.725rem", lineHeight: 1.4, flex: 1 }} className="line-clamp-2">
                  {pattern.description}
                </div>
                <div className="mt-2 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 text-[#8B6F47]">
                  <Plus className="w-3 h-3" /> Tambah atau seret ke kanvas
                </div>
              </button>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="color" className="p-5 m-0 max-h-[420px] sm:max-h-[520px] lg:max-h-[650px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: "#FFFFFF" }}>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Palette className="w-4 h-4 text-[#8B6F47]" />
          <p style={{ color: "#7A6B5E", fontSize: "0.8rem", fontWeight: 500 }}>Pilih palet warna (klik motif di kanvas dulu):</p>
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
                  // [OPT-1b] onChange fires once on mouse-release — commit to React state here
                  onChange={(e) => onCustomColorCommit(e.target.value)}
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
                            (layer.fabricObject as any)?.data?.colorPresetName
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
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname;
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(colorPresets[0]);
  const [customColor, setCustomColor] = useState(colorPresets[0].colors.primary);
  const [activeTab, setActiveTab] = useState("pattern");

  const [canvasBackground, setCanvasBackground] = useState("#ffffff");
  const [committedBg, setCommittedBg] = useState("#ffffff");
  const [shapeType, setShapeType] = useState<ShapeType>("rect");
  const [shapeFill, setShapeFill] = useState("#8B6F47");
  const [shapeStroke, setShapeStroke] = useState("#3D2B1F");
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2);
  const [shapeOpacity, setShapeOpacity] = useState(100);
  const [textColor, setTextColor] = useState("#3D2B1F");
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("serif");
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<"pattern" | "shape" | "text" | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showFloatingSidebar, setShowFloatingSidebar] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ width: 0, height: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isFullMode) setShowFloatingSidebar(true);
  }, [isFullMode]);

  // [BOTTOMSHEET] Drag controls for the mobile floating-sidebar bottom sheet —
  // started manually from the handle/header (dragListener=false on the panel),
  // so swiping inside the tab content (pattern grid, layer list, etc.) keeps
  // scrolling normally instead of being hijacked by the sheet drag gesture.
  const sidebarDragControls = useDragControls();

  const toggleFloatingSidebar = useCallback(() => {
    setShowFloatingSidebar((prev) => {
      const next = !prev;
      if (!next) setIsSidebarExpanded(false);
      return next;
    });
  }, []);

  const closeFloatingSidebar = useCallback(() => {
    setShowFloatingSidebar(false);
    setIsSidebarExpanded(false);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isRestoringRef = useRef(false);
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
  const shapeStrokeWidthRef = useRef(2);
  const shapeOpacityRef = useRef(100);
  const textColorRef = useRef("#3D2B1F");
  const fontSizeRef = useRef(32);
  const fontFamilyRef = useRef("serif");
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
  const bgColorInputRefFull = useRef<HTMLInputElement>(null);
  const bgColorSwatchRefFull = useRef<HTMLDivElement>(null);
  const isApplyingBgUndoRef = useRef(false);
  // [DRAG] Ref to addItemToCanvas so handleCanvasDrop (defined earlier in source
  // order) can call the latest version without a temporal-dead-zone issue.
  const addItemToCanvasRef = useRef<((pattern: BatikItem, dropCoords?: { x: number; y: number }) => void) | null>(null);

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
  useEffect(() => { isFullModeRef.current = isFullMode; }, [isFullMode]);
  // resetZoomRef allows the isFullMode useEffect below to call resetZoom
  // before the resetZoom useCallback is declared (forward reference pattern).
  const resetZoomRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (isFullMode) {
      // Save current scroll position, lock page scroll
      const scrollY = window.scrollY;
      document.documentElement.dataset.scrollY = String(scrollY);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      // Reset zoom to 100% so canvas fills full width — prevents the user seeing
      // the outside-canvas white area that looks drawable but has an invisible wall
      requestAnimationFrame(() => { requestAnimationFrame(() => { resetZoomRef.current?.(); }); });
    } else {
      // Restore page scroll
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const savedY = Number(document.documentElement.dataset.scrollY || 0);
      window.scrollTo({ top: savedY, behavior: 'instant' as ScrollBehavior });
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isFullMode]);

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
      if (typeof textObj.fill === 'string') setTextColor(textObj.fill);
      if (typeof textObj.fontSize === 'number') setFontSize(textObj.fontSize);
      if ((textObj as any).fontFamily) setFontFamily((textObj as any).fontFamily);
    }
  }, [selectedObject, selectedObjectType]);

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

  // Update selected text when text state changes
  useEffect(() => {
    if (!selectedObject || selectedObjectType !== "text") return;
    const textObj = selectedObject as fabric.IText;
    let needsRender = false;
    if (typeof textObj.fill === 'string' && textObj.fill !== textColor) { textObj.set("fill", textColor); needsRender = true; }
    if (typeof textObj.fontSize === 'number' && textObj.fontSize !== fontSize) { textObj.set("fontSize", fontSize); needsRender = true; }
    if ((textObj as any).fontFamily !== fontFamily) { textObj.set("fontFamily", fontFamily); needsRender = true; }
    if (needsRender) { textObj.setCoords(); fabricCanvasRef.current?.requestRenderAll(); }
  }, [textColor, fontSize, fontFamily, selectedObject, selectedObjectType]);

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
      const fc = fabricCanvasRef.current;
      if (fc) {
        fc.setBackgroundColor(canvasBackground, () => { fc.requestRenderAll(); });
      }
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

  const isImageDataEqual = (img1: ImageData, img2: ImageData) => {
    if (img1.width !== img2.width || img1.height !== img2.height) return false;
    for (let i = 0; i < img1.data.length; i++) {
      if (img1.data[i] !== img2.data[i]) return false;
    }
    return true;
  };

  const checkOffscreenHasContent = () => {
    const offscreen = offscreenRef.current;
    const initial = initialOffscreenImageDataRef.current;
    if (!offscreen || !initial) return false;
    const ctx = offscreen.getContext("2d")!;
    // Only check the center 800x600 region which is what gets exported
    const current = ctx.getImageData(1600, 1200, 800, 600);
    return !isImageDataEqual(initial, current);
  };

  const syncDisplay = useCallback(() => {
    const display = displayCanvasRef.current;
    const offscreen = offscreenRef.current;
    const fc = fabricCanvasRef.current;
    if (!display || !offscreen || !fc) return;

    const ctx = display.getContext("2d")!;
    ctx.clearRect(0, 0, 800, 600);

    const vpt = fc.viewportTransform;
    if (!vpt) return;

    const zoom = fc.getZoom() || 1;
    const baseScale = baseScaleRef.current || 1;
    const extraScale = zoom / baseScale;

    // Calculate source rect from offscreen canvas (4000x3000)
    // Center point is (2000, 1500), which represents the center of the 800x600 logical workspace (400, 300)
    // Thus, logical (0, 0) corresponds to virtual (1600, 1200)
    const srcW = 800 / extraScale;
    const srcH = 600 / extraScale;
    const srcX = 1600 - (vpt[4] / zoom);
    const srcY = 1200 - (vpt[5] / zoom);

    ctx.drawImage(offscreen, srcX, srcY, srcW, srcH, 0, 0, 800, 600);
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
    const baseScale = baseScaleRef.current || 1;
    const extraScale = zoom / baseScale;

    // Total virtual bounds: 4000 x 3000
    const virtualW = 4000;
    const virtualH = 3000;

    // Visible logical bounds: 800 / extraScale, 600 / extraScale
    const visibleW = 800 / extraScale;
    const visibleH = 600 / extraScale;

    // Current logical top-left:
    const leftX = 1600 - (vpt[4] / zoom);
    const topY = 1200 - (vpt[5] / zoom);

    // Thumb width & height percentages (clamped between 10% and 100%)
    const hThumbWidthPct = Math.max(10, Math.min(100, (visibleW / virtualW) * 100));
    const vThumbHeightPct = Math.max(10, Math.min(100, (visibleH / virtualH) * 100));

    // Thumb positions percentages relative to scrollable area
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
      vpt[4] = (w - 800 * zoom) / 2;
    } else {
      vpt[4] = Math.max(minVpt4, Math.min(maxVpt4, vpt[4]));
    }

    let minVpt5 = h - 1800 * zoom;
    let maxVpt5 = 1200 * zoom;
    if (minVpt5 > maxVpt5) {
      vpt[5] = (h - 600 * zoom) / 2;
    } else {
      vpt[5] = Math.max(minVpt5, Math.min(maxVpt5, vpt[5]));
    }
    return vpt;
  }, []);

  const onHorizontalScrollDrag = useCallback((e: any) => {
    const track = horizontalScrollTrackRef.current;
    const fc = fabricCanvasRef.current;
    if (!track || !fc) return;

    const rect = track.getBoundingClientRect();
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clickPct = (clientX - rect.left) / rect.width;

    const zoom = fc.getZoom() || 1;
    const baseScale = baseScaleRef.current || 1;
    const extraScale = zoom / baseScale;

    const virtualW = 4000;
    const visibleW = 800 / extraScale;

    const leftX = (clickPct * virtualW) - (visibleW / 2);
    const clampedLeftX = Math.max(0, Math.min(4000 - visibleW, leftX));
    const nextPanX = (1600 - clampedLeftX) * zoom;

    const vpt = fc.viewportTransform;
    if (vpt) {
      vpt[4] = nextPanX;
      fc.setViewportTransform(clampViewport(vpt));
      fc.requestRenderAll();
    }
  }, [clampViewport]);

  const onVerticalScrollDrag = useCallback((e: any) => {
    const track = verticalScrollTrackRef.current;
    const fc = fabricCanvasRef.current;
    if (!track || !fc) return;

    const rect = track.getBoundingClientRect();
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
    const clickPct = (clientY - rect.top) / rect.height;

    const zoom = fc.getZoom() || 1;
    const baseScale = baseScaleRef.current || 1;
    const extraScale = zoom / baseScale;

    const virtualH = 3000;
    const visibleH = 600 / extraScale;

    const topY = (clickPct * virtualH) - (visibleH / 2);
    const clampedTopY = Math.max(0, Math.min(3000 - visibleH, topY));
    const nextPanY = (1200 - clampedTopY) * zoom;

    const vpt = fc.viewportTransform;
    if (vpt) {
      vpt[5] = nextPanY;
      fc.setViewportTransform(clampViewport(vpt));
      fc.requestRenderAll();
    }
  }, [clampViewport]);

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
    const json = JSON.stringify(fc.toJSON(["data"]));
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
    const queue: number[] = [];
    const enqueue = (x: number, y: number) => {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const pos = y * W + x;
      if (filled[pos] || !colorMatch(x, y)) return;
      filled[pos] = 1;
      queue.push(x, y);
    };
    enqueue(vStartX, vStartY);
    while (queue.length > 0) {
      const x = queue.shift()!;
      const y = queue.shift()!;
      const i = idx(x, y);
      data[i] = fr; data[i + 1] = fg; data[i + 2] = fb; data[i + 3] = fa;
      enqueue(x + 1, y); enqueue(x - 1, y); enqueue(x, y + 1); enqueue(x, y - 1);
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
    fc.requestRenderAll();
  }, [getEffectiveZoom, clampViewport]);

  const zoomIn = useCallback(() => applyZoom(zoomLevelRef.current + 25), [applyZoom]);
  const zoomOut = useCallback(() => applyZoom(zoomLevelRef.current - 25), [applyZoom]);
  const resetZoom = useCallback(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const scale = getEffectiveZoom(100);
    fc.setViewportTransform(clampViewport([scale, 0, 0, scale, 0, 0]));
    zoomLevelRef.current = 100;
    setZoomLevel(100);
    fc.requestRenderAll();
  }, [getEffectiveZoom, clampViewport]);
  // Keep resetZoomRef in sync so the isFullMode useEffect can call it
  resetZoomRef.current = resetZoom;

  const restoreSnapshot = useCallback((index: number) => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    isRestoringRef.current = true;
    const json = historyRef.current[index];
    fc.loadFromJSON(JSON.parse(json), () => {
      fc.renderAll();
      isRestoringRef.current = false;
      const currentBg = fc.backgroundColor;
      if (typeof currentBg === "string" && currentBg !== canvasBackground) {
        isApplyingBgUndoRef.current = true;
        setCanvasBackground(currentBg);
      }
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
  }, [applyBrushSnapshot]);

  const redoBrush = useCallback(() => {
    if (offscreenHistoryIndexRef.current >= offscreenHistoryRef.current.length - 1) return;
    offscreenHistoryIndexRef.current++;
    applyBrushSnapshot(offscreenHistoryRef.current[offscreenHistoryIndexRef.current]);
    setHistoryIndex(offscreenHistoryIndexRef.current);
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
      const prevColor = bgColorHistoryRef.current[bgColorHistoryIndexRef.current];
      setCommittedBg(prevColor);
      setCanvasBackground(prevColor);
    } else {
      offscreenHistoryIndexRef.current--;
      applyBrushSnapshot(offscreenHistoryRef.current[offscreenHistoryIndexRef.current]);
      setHistoryIndex(offscreenHistoryIndexRef.current);
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
        const nextColor = bgColorHistoryRef.current[bgColorHistoryIndexRef.current];
        setCommittedBg(nextColor);
        setCanvasBackground(nextColor);
      }
    } else {
      if (offscreenHistoryIndexRef.current < offscreenHistoryRef.current.length - 1) {
        offscreenHistoryIndexRef.current++;
        applyBrushSnapshot(offscreenHistoryRef.current[offscreenHistoryIndexRef.current]);
        setHistoryIndex(offscreenHistoryIndexRef.current);
      }
    }
    setCanUndo(actionStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, [restoreSnapshot, syncDisplay]);

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
    } else {
      ctx.globalCompositeOperation = "source-over";
      const r = parseInt(brushColorRef.current.slice(1, 3), 16);
      const g = parseInt(brushColorRef.current.slice(3, 5), 16);
      const b = parseInt(brushColorRef.current.slice(5, 7), 16);
      ctx.strokeStyle = `rgba(${r},${g},${b},${brushOpacityRef.current / 100})`;
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
        setPatterns(mergePatternsWithAssets(data || []));
      } catch (err: any) {
        handleSupabaseError(err, "CustomBatikPage.fetchPatterns");
        setPatterns(batikAssetPatterns);
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
      backgroundColor: canvasBackground,
      selection: true,
      preserveObjectStacking: true,
      targetFindTolerance: 10,
    });
    fabricCanvasRef.current = canvas;
    canvas.on("after:render", () => {
      syncDisplayTransformRef.current?.();
    });

    // Custom delete control
    fabric.Object.prototype.controls.deleteControl = new fabric.Control({
      x: 0.5, y: -0.5, offsetY: -16, cursorStyle: "pointer",
      mouseUpHandler: () => {
        const active = canvas.getActiveObjects();
        if (active.length > 0) {
          active.forEach((obj) => {
            if ((obj as any).data?.layerId) { canvas.remove(obj); setLayers((prev) => prev.filter((l) => l.id !== (obj as any).data.layerId)); }
          });
          canvas.discardActiveObject();
          setSelectedLayerId(null);
        }
        return true;
      },
      render: (ctx, left, top, _style, fabricObject) => {
        ctx.save(); ctx.translate(left, top); ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0));
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, 2 * Math.PI); ctx.fillStyle = "#ef4444"; ctx.fill();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, 5); ctx.moveTo(5, -5); ctx.lineTo(-5, 5);
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.stroke(); ctx.restore();
      },
    });

    canvas.on("object:selected", (e) => {
      const target = (e as any).target;
      if (!target) { setSelectedObject(null); setSelectedObjectType(null); return; }
      setSelectedObject(target);
      setSelectedObjectType(detectObjectType(target)); // [OPT-2]
      if (target?.data?.layerId) {
        setSelectedLayerId(target.data.layerId);
        setActiveTab("layer");
        if (target.data.colorPresetName) {
          const foundPreset = colorPresets.find((p) => p.name === target.data.colorPresetName);
          if (foundPreset) setSelectedPreset(foundPreset);
        }
      }
    });

    canvas.on("selection:updated", (e) => {
      const target = (e as any).target;
      if (!target) { setSelectedObject(null); setSelectedObjectType(null); return; }
      setSelectedObject(target);
      setSelectedObjectType(detectObjectType(target)); // [OPT-2]
      if (target?.data?.layerId) {
        setSelectedLayerId(target.data.layerId);
        setActiveTab("layer");
        if (target.data.colorPresetName) {
          const foundPreset = colorPresets.find((p) => p.name === target.data.colorPresetName);
          if (foundPreset) setSelectedPreset(foundPreset);
        }
      }
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
      setSelectedObjectType(null);
      if (lastMousedownInCanvasRef.current) setSelectedLayerId(null);
    });

    // [OPT-5-FIX] mouse:down — still needed alongside object:selected/selection:updated.
    // Fabric does NOT re-fire object:selected/selection:updated when clicking an object
    // that is already the active object (e.g. switching tool back to "select" and
    // clicking the same already-selected item). Without this, selectedObjectType can
    // go stale/null and the edit panel (fill/stroke/text controls) stops appearing.
    // Kept thin: just syncs state via the centralized detectObjectType helper (OPT-2),
    // no redefinition of detection logic like the old version had.
    canvas.on("mouse:down", (e) => {
      if (e.target) {
        setSelectedObject(e.target);
        setSelectedObjectType(detectObjectType(e.target));
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
      else if (shapeTypeRef.current === "star") { const cx = (start.x + pos.x) / 2; const cy = (start.y + pos.y) / 2; const r = Math.max(Math.max(Math.abs(pos.x - start.x), Math.abs(pos.y - start.y)) / 2, 15); finalShape = new fabric.Polygon(makeStarPoints(cx, cy, 5, r, r * 0.45), { ...common, left: cx - r, top: cy - r }); }
      else { finalShape = new fabric.Line([start.x, start.y, pos.x, pos.y], { stroke: shapeStrokeRef.current, strokeWidth: Math.max(shapeStrokeWidthRef.current, 2), selectable: true, evented: true, fill: "", opacity: shapeOpacityRef.current / 100, objectCaching: false, hasControls: true }); }
      const newLayerId = Date.now().toString();
      const shapeLabel = shapeTypeRef.current === "rect" ? "Kotak" : shapeTypeRef.current === "circle" ? "Lingkaran" : shapeTypeRef.current === "star" ? "Bintang" : "Garis";
      (finalShape as any).data = { layerId: newLayerId, layerName: shapeLabel };
      fc.add(finalShape); fc.setActiveObject(finalShape); fc.requestRenderAll();
      setLayers((prev) => [...prev, { id: newLayerId, type: "drawing" as const, name: shapeLabel, visible: true, locked: false, fabricObject: finalShape }]);
      setSelectedLayerId(newLayerId);
      setActiveTab("layer");
      saveSnapshot();
    };

    const handleWheel = (opt: any) => {
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
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      fc.selection = false;
      fc.defaultCursor = "grabbing";
    };
    const onPanMouseMove = (opt: any) => {
      if (!isPanningRef.current || !panStartRef.current) return;
      const e = opt.e as MouseEvent;
      const vpt = fc.viewportTransform;
      if (!vpt) return;
      vpt[4] += e.clientX - panStartRef.current.x;
      vpt[5] += e.clientY - panStartRef.current.y;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      fc.setViewportTransform(clampViewport(vpt));
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
    };
  }, [saveSnapshot, applyZoom, clampViewport]);

  // Text tool event listener
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const onMouseDown = (e: any) => {
      if (activeToolRef.current !== "text") return;
      if (e.target) return;
      const pointer = fc.getPointer(e.e);
      const text = new fabric.IText("Ketik teks di sini", { left: pointer.x, top: pointer.y, fontFamily: fontFamilyRef.current, fontSize: fontSizeRef.current, fill: textColorRef.current, selectable: true, evented: true, hasControls: true, editable: true, objectCaching: false });
      const newLayerId = Date.now().toString();
      (text as any).data = { layerId: newLayerId, layerName: "Teks" };
      fc.add(text); fc.setActiveObject(text); text.enterEditing(); text.selectAll(); fc.requestRenderAll();
      setLayers((prev) => [...prev, { id: newLayerId, type: "drawing" as const, name: "Teks", visible: true, locked: false, fabricObject: text }]);
      setSelectedLayerId(newLayerId);
      setActiveTab("layer");
      text.on("editing:exited", () => {
        if (!text.text?.trim()) { fc.remove(text); setLayers((prev) => prev.filter((l) => l.id !== newLayerId)); setSelectedLayerId(null); }
        else { saveSnapshot(); }
      });
    };
    fc.on("mouse:down", onMouseDown);
    return () => { fc.off("mouse:down", onMouseDown); };
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
      canvas.isDrawingMode = false; canvas.selection = true; canvas.defaultCursor = "default"; canvas.hoverCursor = "move";
      canvas.forEachObject((obj) => { const layerId = (obj as any).data?.layerId; if (!layerId) return; obj.evented = true; obj.selectable = true; });
      canvas.renderAll();
      display.style.position = "absolute"; display.style.top = `${canvasOffsetRef.current.y}px`; display.style.left = `${canvasOffsetRef.current.x}px`; display.style.pointerEvents = "none"; display.style.zIndex = "2"; display.style.width = sizeStyle.width; display.style.height = sizeStyle.height;
      fabricWrapper.style.position = "absolute"; fabricWrapper.style.top = `${canvasOffsetRef.current.y}px`; fabricWrapper.style.left = `${canvasOffsetRef.current.x}px`; fabricWrapper.style.zIndex = "1"; fabricWrapper.style.width = sizeStyle.width; fabricWrapper.style.height = sizeStyle.height;
    } else if (activeTool === "text") {
      canvas.isDrawingMode = false; canvas.selection = true; canvas.defaultCursor = "text"; canvas.hoverCursor = "text";
      canvas.forEachObject((obj) => { obj.evented = true; obj.selectable = true; }); canvas.renderAll();
      display.style.position = "absolute"; display.style.top = `${canvasOffsetRef.current.y}px`; display.style.left = `${canvasOffsetRef.current.x}px`; display.style.pointerEvents = "none"; display.style.zIndex = "2"; display.style.width = sizeStyle.width; display.style.height = sizeStyle.height;
      fabricWrapper.style.position = "absolute"; fabricWrapper.style.top = `${canvasOffsetRef.current.y}px`; fabricWrapper.style.left = `${canvasOffsetRef.current.x}px`; fabricWrapper.style.zIndex = "1"; fabricWrapper.style.width = sizeStyle.width; fabricWrapper.style.height = sizeStyle.height;
    } else if (activeTool === "shape") {
      canvas.isDrawingMode = false; canvas.selection = false; canvas.defaultCursor = "crosshair"; canvas.hoverCursor = "crosshair";
      canvas.forEachObject((obj) => { obj.evented = false; obj.selectable = false; }); canvas.renderAll();
      display.style.position = "absolute"; display.style.top = `${canvasOffsetRef.current.y}px`; display.style.left = `${canvasOffsetRef.current.x}px`; display.style.pointerEvents = "none"; display.style.zIndex = "2"; display.style.width = sizeStyle.width; display.style.height = sizeStyle.height;
      fabricWrapper.style.position = "absolute"; fabricWrapper.style.top = `${canvasOffsetRef.current.y}px`; fabricWrapper.style.left = `${canvasOffsetRef.current.x}px`; fabricWrapper.style.zIndex = "1"; fabricWrapper.style.width = sizeStyle.width; fabricWrapper.style.height = sizeStyle.height;
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
      display.style.position = "absolute"; display.style.top = `${canvasOffsetRef.current.y}px`; display.style.left = `${canvasOffsetRef.current.x}px`; display.style.pointerEvents = "auto"; display.style.zIndex = "2"; display.style.cursor = cursor; display.style.width = sizeStyle.width; display.style.height = sizeStyle.height;
      fabricWrapper.style.position = "absolute"; fabricWrapper.style.top = `${canvasOffsetRef.current.y}px`; fabricWrapper.style.left = `${canvasOffsetRef.current.x}px`; fabricWrapper.style.zIndex = "1"; fabricWrapper.style.width = sizeStyle.width; fabricWrapper.style.height = sizeStyle.height;
    }
  }, [activeTool, brushSize, brushColor, syncDisplay]);

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    const display = displayCanvasRef.current;
    const fc = fabricCanvasRef.current;
    if (!container || !fc || !display) return;
    const { width: containerWidth } = container.getBoundingClientRect();
    if (containerWidth <= 0) return; // container not laid out yet (e.g. mid fullmode transition)

    const fitWidth = containerWidth;
    const fitHeight = containerWidth * 0.75;

    const newBaseScale = fitWidth / 800;
    const oldBaseScale = baseScaleRef.current || newBaseScale;
    const oldVpt = fc.viewportTransform || [oldBaseScale, 0, 0, oldBaseScale, 0, 0];

    fc.setWidth(fitWidth);
    fc.setHeight(fitHeight);

    const ratio = newBaseScale / oldBaseScale;
    const newScale = (oldVpt[0] || oldBaseScale) * ratio;
    const newPanX = (oldVpt[4] || 0) * ratio;
    const newPanY = (oldVpt[5] || 0) * ratio;
    baseScaleRef.current = newBaseScale;
    fc.setViewportTransform(clampViewport([newScale, 0, 0, newScale, newPanX, newPanY]));

    display.style.width = `${fitWidth}px`; display.style.height = `${fitHeight}px`;
    display.style.left = "0px"; display.style.top = "0px";
    const fabricWrapper = (fabricCanvasRef as any).wrapper;
    if (fabricWrapper) { fabricWrapper.style.left = "0px"; fabricWrapper.style.top = "0px"; }
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

  const renderMiniPattern = useCallback((pattern: BatikItem, presetName?: string) => {
    const preset = presetName ? colorPresets.find(p => p.name === presetName) || selectedPreset : selectedPreset;
    const svgSource = getBatikSvg(pattern.style_type);
    if (svgSource) {
      const svgString = recolorSVG(svgSource, preset);
      return (
        <div className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
          dangerouslySetInnerHTML={{ __html: svgString }} />
      );
    }
    return (
      <div className="w-full h-full">
        <svg width="100%" height="100%" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#FAF8F5" width="20" height="20" />
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
      </div>
    );
  }, [selectedPreset]);

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
    const displayX = clientX - rect.left;
    const displayY = clientY - rect.top;
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
    const svg = renderPatternSVGString(pattern);
    const fc = fabricCanvasRef.current;
    const spawnPoint = getSpawnPoint(dropCoords);

    svgStringToPngDataUrl(svg).then((pngUrl) => {
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
        (img as any).data = { layerId: newLayerId, patternId: pattern.id, layerName: pattern.name || 'Motif', styleType: pattern.style_type, colorPresetName: selectedPreset.name, customColor: customColor, originalSvg: getBatikSvg(pattern.style_type) || null, originalScale: scale, originalWidth: rawW, originalHeight: rawH };
        fc.add(img); img.setCoords(); fc.setActiveObject(img); fc.requestRenderAll();
        setLayers((prev) => [...prev, { id: newLayerId, type: 'pattern', name: pattern.name || 'Motif', visible: true, locked: false, fabricObject: img }]);
        setSelectedLayerId(newLayerId);
        setActiveTab("layer");
        saveSnapshot();
      });
    }).catch(() => { toast.error('Gagal memuat motif SVG'); });
  }, [saveSnapshot, renderPatternSVGString, selectedPreset, customColor, getSpawnPoint]);

  useEffect(() => { addItemToCanvasRef.current = addItemToCanvas; }, [addItemToCanvas]);
  const handleCustomColorCommit = useCallback((newColor: string, skipPresetRegen?: boolean) => {
    setCustomColor(newColor);
    if (!skipPresetRegen) {
      setSelectedPreset(generatePresetFromPrimary(newColor));
    }
  }, []);

  const recolorActiveObject = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (!activeObj) return;
    const data = (activeObj as any).data;
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
        fabricCanvasRef.current?.requestRenderAll();
        setLayers((prev) => [...prev]);
        saveSnapshot();
      });
    }).catch(() => { /* silent */ });
  }, [selectedPreset, customColor, saveSnapshot, renderPatternSVGString, patterns]);

  useEffect(() => {
    recolorActiveObject();
  }, [selectedPreset, recolorActiveObject]);
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
    if (direction === "up" && index === layers.length - 1) return;
    if (direction === "down" && index === 0) return;
    if (direction === "up") { fc.bringForward(layer.fabricObject, false); }
    else { fc.sendBackwards(layer.fabricObject, false); }
    fc.requestRenderAll();
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
      const fc = fabricCanvasRef.current;
      if (!fc) return;

      clonedObj.set({
        left: (clonedObj.left || 0) + 20,
        top: (clonedObj.top || 0) + 20,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
      });

      const newLayerId = Date.now().toString();
      const layerName = `${layer.name} (Salinan)`;
      (clonedObj as any).data = {
        ...(layer.fabricObject as any).data,
        layerId: newLayerId,
        layerName: layerName,
      };

      fc.add(clonedObj);
      clonedObj.setCoords();
      fc.setActiveObject(clonedObj);
      fc.requestRenderAll();

      setLayers((prev) => [
        ...prev,
        {
          id: newLayerId,
          type: layer.type,
          name: layerName,
          visible: true,
          locked: false,
          fabricObject: clonedObj,
        },
      ]);
      setSelectedLayerId(newLayerId);
      setActiveTab("layer");
      saveSnapshot();
    });
  }, [layers, saveSnapshot]);

  const flipLayer = useCallback((layerId: string, axis: "x" | "y") => {
    setLayers((prev) => prev.map((layer) => {
      if (layer.id === layerId && layer.fabricObject) {
        if (axis === "x") {
          layer.fabricObject.set("flipX", !layer.fabricObject.flipX);
        } else {
          layer.fabricObject.set("flipY", !layer.fabricObject.flipY);
        }
        fabricCanvasRef.current?.requestRenderAll();
        return { ...layer };
      }
      return layer;
    }));
    saveSnapshot();
  }, [saveSnapshot]);

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
      setActiveTab("layer");
      saveSnapshot();
    });
  }, [saveSnapshot, getSpawnPoint]);

  // Build final canvas for download/save
  const buildFinalCanvas = async (): Promise<HTMLCanvasElement> => {
    const fc = fabricCanvasRef.current!;
    const offscreen = offscreenRef.current!;
    const final = document.createElement("canvas");
    final.width = 800; final.height = 600;
    const ctx = final.getContext("2d")!;
    ctx.fillStyle = canvasBackground || "#ffffff";
    ctx.fillRect(0, 0, 800, 600);
    const fabricDataUrl = fc.toDataURL({ format: "png", multiplier: 1 });
    await new Promise<void>((res, rej) => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, 800, 600); res(); };
      img.onerror = rej;
      img.src = fabricDataUrl;
    });
    // Draw the center 800x600 region of the 4000x3000 offscreen canvas
    ctx.drawImage(offscreen, 1600, 1200, 800, 600, 0, 0, 800, 600);
    // [#28b] Watermark besar diagonal di tengah
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.font = "bold 80px 'Playfair Display', serif";
    ctx.fillStyle = "#4A2F1A";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(400, 300);
    ctx.rotate(-25 * Math.PI / 180);
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 8;
    ctx.fillText("RekaBatik", 0, 0);
    ctx.restore();
    // [#28b] Watermark kecil di pojok kanan bawah
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.font = "bold 20px 'Playfair Display', serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 5; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillText("RekaBatik", 780, 580);
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

              {/* Toolbar — hidden in fullmode */}
              {!isFullMode && (
                <div style={{ background: "linear-gradient(to bottom, #FDFCFA 0%, #FFFFFF 100%)", borderBottom: "1px solid rgba(212,184,139,0.2)" }}>
                  {/* Row 1: Tool selector + global actions */}
                  <div
                    className="px-3 py-2 flex items-center gap-2 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{ borderBottom: "1px solid rgba(212,184,139,0.12)" }}
                  >
                    <div className="flex items-center p-0.5 rounded-xl gap-0.5 flex-shrink-0" style={{ background: "rgba(139,111,71,0.06)", border: "1px solid rgba(212,184,139,0.2)" }}>
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
                          <button key={tool} onClick={() => setActiveTool(tool)} title={label}
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

                        {/* [OPT-1] Uncontrolled color picker — no setState on drag, only DOM updates */}
                        <div className="relative flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer hover:bg-white transition-all" title="Warna latar kanvas">
                          {/* Swatch updated directly via ref */}
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
                              const fc = fabricCanvasRef.current;
                              if (fc) {
                                fc.setBackgroundColor(color, () => { fc.requestRenderAll(); });
                              }
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

                        <div className="h-4 w-px mx-0.5" style={{ background: "rgba(212,184,139,0.35)" }} />

                        <button onClick={() => setIsFullMode(true)} title="Mode Layar Penuh" className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer hover:bg-white hover:shadow-sm" style={{ color: "#8B6F47" }}>
                          <Maximize2 style={{ width: "13px", height: "13px" }} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Contextual tool options */}
                  <div
                    className="px-4 flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 min-h-[52px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{ background: "#FAF9F6" }}
                  >

                    {activeTool === "select" && (
                      <div className="flex items-center gap-2 py-2.5">
                        {!selectedObject ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: "rgba(139,111,71,0.07)", border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}>
                            <MousePointer2 style={{ width: "12px", height: "12px", flexShrink: 0 }} />
                            <span>Klik objek di kanvas untuk memilih, lalu geser, putar, atau ubah ukurannya</span>
                          </div>
                        ) : selectedObjectType === "shape" ? (
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
                          <div className="flex items-center gap-3">
                            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="h-8 px-2 rounded-lg text-xs font-semibold border cursor-pointer" style={{ borderColor: "rgba(212,184,139,0.3)", color: "#3D2B1F", background: "#FAF9F6" }}>
                              <option value="serif">Serif</option>
                              <option value="sans-serif">Sans-serif</option>
                              <option value="'Playfair Display', serif">Playfair Display</option>
                              <option value="monospace">Monospace</option>
                            </select>
                            <div className="flex items-center gap-1.5">
                              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Ukuran</span>
                              <button onClick={() => setFontSize(s => Math.max(8, s - 4))} className="w-6 h-6 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-white" style={{ borderColor: "rgba(212,184,139,0.25)", color: "#8B6F47" }}><Minus style={{ width: "10px", height: "10px" }} /></button>
                              <span className="text-xs font-bold font-mono w-8 text-center" style={{ color: "#3D2B1F" }}>{fontSize}</span>
                              <button onClick={() => setFontSize(s => Math.min(120, s + 4))} className="w-6 h-6 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-white" style={{ borderColor: "rgba(212,184,139,0.25)", color: "#8B6F47" }}><Plus style={{ width: "10px", height: "10px" }} /></button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Warna</span>
                              <div className="relative rounded-lg cursor-pointer hover:scale-105 transition-all" style={{ background: textColor, width: "26px", height: "26px", border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4)" }}>
                                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                              </div>
                              <div className="flex gap-1.5">
                                {["#3D2B1F", "#8B6F47", "#D4B88B", "#2A4B7C", "#2D5A2D", "#8B2A2A", "#ffffff"].map((c) => (
                                  <button key={c} onClick={() => setTextColor(c)} className="rounded-full transition-all hover:scale-110 cursor-pointer" style={{ width: textColor === c ? "20px" : "16px", height: textColor === c ? "20px" : "16px", background: c, border: `${textColor === c ? "2.5" : "1.5"}px solid ${textColor === c ? "#3D2B1F" : "rgba(0,0,0,0.12)"}` }} />
                                ))}
                              </div>
                            </div>
                            <span className="hidden sm:inline text-[10px] text-[#A89B8F] italic flex-shrink-0">Klik 2x untuk edit teks</span>
                          </div>
                        ) : selectedObjectType === "pattern" ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: "rgba(139,111,71,0.07)", border: "1px solid rgba(212,184,139,0.25)", color: "#8B6F47" }}>
                            <Palette style={{ width: "12px", height: "12px", flexShrink: 0 }} />
                            <span>Motif dipilih — ganti warna via tab Preset di sidebar kanan</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {activeTool === "brush" && (
                      <div className="flex items-center gap-2 sm:gap-3 py-2">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F] select-none whitespace-nowrap">Warna</span>
                          <div className="relative p-0.5 rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: brushColor, border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4), 0 2px 6px rgba(0,0,0,0.12)", width: "26px", height: "26px", borderRadius: "8px" }}>
                            <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            {["#3D2B1F", "#8B6F47", "#D4B88B", "#2A4B7C", "#2D5A2D", "#8B2A2A", "#6B3A1F", "#ffffff"].map((c, idx) => (
                              <button key={c} onClick={() => setBrushColor(c)} title={c} className={`${idx >= 6 ? "hidden sm:inline-flex" : ""} transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer flex-shrink-0`} style={{ width: brushColor === c ? "20px" : "16px", height: brushColor === c ? "20px" : "16px", borderRadius: "50%", background: c, border: brushColor === c ? "2.5px solid #3D2B1F" : "1.5px solid rgba(0,0,0,0.12)", boxShadow: brushColor === c ? "0 2px 6px rgba(0,0,0,0.15)" : "none" }} />
                            ))}
                          </div>
                        </div>
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
                          {["#3D2B1F", "#8B6F47", "#D4B88B", "#2A4B7C", "#2D5A2D", "#8B2A2A", "#6B3A1F", "#ffffff"].map((c, idx) => (
                            <button key={c} onClick={() => setBrushColor(c)} title={c} className={`${idx >= 6 ? "hidden sm:inline-flex" : ""} transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer flex-shrink-0`} style={{ width: brushColor === c ? "20px" : "16px", height: brushColor === c ? "20px" : "16px", borderRadius: "50%", background: c, border: brushColor === c ? "2.5px solid #3D2B1F" : "1.5px solid rgba(0,0,0,0.12)", boxShadow: brushColor === c ? "0 2px 6px rgba(0,0,0,0.15)" : "none" }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTool === "shape" && (
                      <div className="flex items-center gap-2 sm:gap-3 py-2">
                        <div className="flex-shrink-0">
                          <div className="flex items-center p-0.5 rounded-xl gap-0.5" style={{ background: "rgba(139,111,71,0.08)", border: "1px solid rgba(212,184,139,0.2)" }}>
                            {(["rect", "circle", "line", "star"] as ShapeType[]).map((t) => {
                              const IconMap = { rect: Square, circle: Circle, line: Slash, star: Star };
                              const LabelMap = { rect: "Kotak", circle: "Lingkaran", line: "Garis", star: "Bintang" };
                              const Icon = IconMap[t];
                              const isActive = shapeType === t;
                              return (
                                <button key={t} onClick={() => setShapeType(t)} title={LabelMap[t]}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer"
                                  style={{ background: isActive ? "white" : "transparent", color: isActive ? "#8B6F47" : "#7A6B5E", boxShadow: isActive ? "0 1px 6px rgba(0,0,0,0.1)" : "none" }}>
                                  <Icon style={{ width: "12px", height: "12px" }} />
                                  <span className="hidden sm:inline">{LabelMap[t]}</span>
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

                    {activeTool === "text" && (
                      <div className="flex items-center gap-3 py-2">
                        <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="h-8 px-2 rounded-lg text-xs font-semibold border cursor-pointer" style={{ borderColor: "rgba(212,184,139,0.3)", color: "#3D2B1F", background: "#FAF9F6" }}>
                          <option value="serif">Serif</option>
                          <option value="sans-serif">Sans-serif</option>
                          <option value="'Playfair Display', serif">Playfair Display</option>
                          <option value="monospace">Monospace</option>
                        </select>
                        <div className="flex items-center gap-1.5">
                          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Ukuran</span>
                          <button onClick={() => setFontSize(s => Math.max(8, s - 4))} className="w-6 h-6 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-white" style={{ borderColor: "rgba(212,184,139,0.25)", color: "#8B6F47" }}><Minus style={{ width: "10px", height: "10px" }} /></button>
                          <span className="text-xs font-bold font-mono w-8 text-center" style={{ color: "#3D2B1F" }}>{fontSize}</span>
                          <button onClick={() => setFontSize(s => Math.min(120, s + 4))} className="w-6 h-6 flex items-center justify-center rounded-lg border cursor-pointer hover:bg-white" style={{ borderColor: "rgba(212,184,139,0.25)", color: "#8B6F47" }}><Plus style={{ width: "10px", height: "10px" }} /></button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-[#A89B8F]">Warna</span>
                          <div className="relative rounded-lg cursor-pointer hover:scale-105 transition-all" style={{ background: textColor, width: "26px", height: "26px", border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 0 0 1.5px rgba(139,111,71,0.4)" }}>
                            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                          </div>
                          <div className="flex gap-1.5">
                            {["#3D2B1F", "#8B6F47", "#D4B88B", "#2A4B7C", "#2D5A2D", "#8B2A2A", "#ffffff"].map((c) => (
                              <button key={c} onClick={() => setTextColor(c)} className="rounded-full border transition-all hover:scale-110 cursor-pointer" style={{ width: textColor === c ? "20px" : "16px", height: textColor === c ? "20px" : "16px", background: c, border: `${textColor === c ? "2.5" : "1.5"}px solid ${textColor === c ? "#3D2B1F" : "rgba(0,0,0,0.12)"}` }} />
                            ))}
                          </div>
                        </div>
                        <div className="h-6 w-px" style={{ background: "rgba(212,184,139,0.35)" }} />
                        <span className="hidden sm:inline text-[10px] text-[#A89B8F] italic">Klik area kosong di kanvas untuk menambah teks</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Canvas Area */}
              <div className="p-2 sm:p-4 lg:p-6 bg-[#F8F6F2]" style={{ borderTop: "1px solid rgba(212,184,139,0.12)" }}>
                <div className="relative rounded-2xl overflow-hidden shadow-inner border border-stone-200/50" style={{ boxShadow: "inset 0 4px 20px rgba(61,43,31,0.05)" }}>
                  <div
                    ref={containerRef}
                    className={isFullMode
                      ? "fixed inset-0 z-[100] overflow-hidden select-none touch-manipulation"
                      : "aspect-[4/3] relative overflow-hidden select-none touch-manipulation"}
                    style={{
                      background: canvasBackground,
                      boxShadow: isDragOverCanvas ? "inset 0 0 0 3px #8B6F47" : undefined,
                      transition: "box-shadow 0.15s ease",
                      touchAction: "manipulation",
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
                    {/* Fullmode: dark overlay covering the area BELOW the canvas so users can see the canvas boundary */}
                    {isFullMode && canvasDisplaySize.height > 0 && (
                      <div
                        className="absolute left-0 right-0 bottom-0 pointer-events-none"
                        style={{
                          top: `${canvasDisplaySize.height}px`,
                          background: "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.18) 100%)",
                          borderTop: "1.5px solid rgba(139,111,71,0.25)",
                          zIndex: 4,
                        }}
                      />
                    )}
                    {isFullMode && (
                      <div
                        className="fixed top-0 left-0 right-0 z-[99] flex items-center justify-around py-3 pointer-events-none"
                        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 100%)" }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#8B6F47" }} />
                          <span className="text-xs font-semibold tracking-wide" style={{ color: "#3D2B1F" }}>Kanvas Karya</span>
                        </div>
                        <div className="hidden lg:flex items-center gap-4 text-[11px] mr-[400px]" style={{ color: "rgba(61,43,31,0.45)" }}>
                          <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]" style={{ background: "rgba(139,111,71,0.12)", color: "#8B6F47" }}>Scroll</kbd> geser kanvas</span>
                          <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]" style={{ background: "rgba(139,111,71,0.12)", color: "#8B6F47" }}>Ctrl+Scroll</kbd> perbesar/perkecil</span>
                          <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]" style={{ background: "rgba(139,111,71,0.12)", color: "#8B6F47" }}>Space+Drag</kbd> geser kanvas</span>
                          <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]" style={{ background: "rgba(139,111,71,0.12)", color: "#8B6F47" }}>Esc</kbd> keluar</span>
                        </div>
                      </div>
                    )}

                    <canvas ref={displayCanvasRef} width={800} height={600} style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'auto', touchAction: 'manipulation' }} />
                    <div
                      ref={(el) => {
                        (fabricCanvasRef as any).wrapper = el;
                      }}
                      style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, touchAction: 'manipulation' }}
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

                    {/* Horizontal scrollbar */}
                    <div
                      ref={horizontalScrollTrackRef}
                      className="absolute bottom-2 left-2 right-6 h-2 rounded-full cursor-pointer bg-stone-500/5 hover:bg-stone-500/10 transition-colors z-[10]"
                    >
                      <div
                        ref={horizontalScrollThumbRef}
                        className="absolute top-0 bottom-0 rounded-full bg-[#8B6F47]/40 hover:bg-[#8B6F47]/75 transition-colors"
                        style={{ left: "0%", width: "100%" }}
                      />
                    </div>

                    {/* Vertical scrollbar */}
                    <div
                      ref={verticalScrollTrackRef}
                      className="absolute top-2 bottom-6 right-2 w-2 rounded-full cursor-pointer bg-stone-500/5 hover:bg-stone-500/10 transition-colors z-[10]"
                    >
                      <div
                        ref={verticalScrollThumbRef}
                        className="absolute left-0 right-0 rounded-full bg-[#8B6F47]/40 hover:bg-[#8B6F47]/75 transition-colors"
                        style={{ top: "0%", height: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Bar — hidden in fullmode */}
              {!isFullMode && (
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
              )}
            </div>
          </div>

          {/* Sidebar — hidden in fullmode */}
          {!isFullMode && (
            <div className="lg:col-span-4 h-full min-w-0">
              <div className="rounded-[32px] shadow-[0_20px_50px_rgba(61,43,31,0.06)] overflow-hidden border bg-white flex flex-col h-full max-h-[45vh] lg:max-h-none" style={{ borderColor: "rgba(212,184,139,0.3)" }}>
                {/* [OPT-6] SidebarTabs component */}
                <SidebarTabs
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  patterns={patterns}
                  loading={loading}
                  selectedPreset={selectedPreset}
                  setSelectedPreset={setSelectedPreset}
                  customColor={customColor}
                  onCustomColorCommit={handleCustomColorCommit}
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
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullmode floating toolbar */}
      <AnimatePresence>
        {isFullMode && (
          <>
            {activeTool !== "select" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="fixed bottom-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 transform-none sm:transform z-[101] flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full shadow-2xl backdrop-blur-md overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(212,184,139,0.25)" }}
              >
                {activeTool === "brush" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="hidden sm:inline text-[10px] font-bold uppercase text-[#A89B8F]">Warna</span>
                      <div className="relative rounded-lg" style={{ background: brushColor, width: 20, height: 20, border: "2px solid white", boxShadow: "0 0 0 1px rgba(139,111,71,0.4)" }}>
                        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      </div>
                    </div>
                    <div className="h-4 w-px" style={{ background: "rgba(212,184,139,0.35)" }} />
                    <div className="flex items-center gap-1.5">
                      <span className="hidden sm:inline text-[10px] font-bold uppercase text-[#A89B8F]">Ukuran</span>
                      <input type="range" min="2" max="80" step="2" value={brushSize[0]} onChange={(e) => setBrushSize([Number(e.target.value)])} style={{ width: 70, accentColor: "#8B6F47" }} />
                      <span className="text-xs font-bold font-mono" style={{ color: "#3D2B1F", minWidth: 22 }}>{brushSize[0]}</span>
                    </div>
                    <div className="h-4 w-px" style={{ background: "rgba(212,184,139,0.35)" }} />
                    <div className="flex items-center gap-1.5">
                      <span className="hidden sm:inline text-[10px] font-bold uppercase text-[#A89B8F]">Opasitas</span>
                      <input type="range" min="5" max="100" step="5" value={brushOpacity[0]} onChange={(e) => setBrushOpacity([Number(e.target.value)])} style={{ width: 60, accentColor: "#8B6F47" }} />
                      <span className="text-xs font-bold font-mono" style={{ color: "#3D2B1F", minWidth: 30 }}>{brushOpacity[0]}%</span>
                    </div>
                  </>
                )}
                {activeTool === "eraser" && (
                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline text-[10px] font-bold uppercase text-[#A89B8F]">Ukuran Hapus</span>
                    <input type="range" min="2" max="80" step="2" value={brushSize[0]} onChange={(e) => setBrushSize([Number(e.target.value)])} style={{ width: 90, accentColor: "#8B6F47" }} />
                    <span className="text-xs font-bold font-mono" style={{ color: "#3D2B1F", minWidth: 22 }}>{brushSize[0]}</span>
                  </div>
                )}
                {activeTool === "fill" && (
                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline text-[10px] font-bold uppercase text-[#A89B8F]">Warna Isi</span>
                    <div className="relative rounded-lg" style={{ background: brushColor, width: 20, height: 20, border: "2px solid white", boxShadow: "0 0 0 1px rgba(139,111,71,0.4)" }}>
                      <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    </div>
                  </div>
                )}
                {activeTool === "shape" && (
                  <>
                    <div className="flex items-center gap-1">
                      {(["rect", "circle", "line", "star"] as ShapeType[]).map((t) => {
                        const IconMap = { rect: Square, circle: Circle, line: Slash, star: Star };
                        const Icon = IconMap[t];
                        return (
                          <button key={t} onClick={() => setShapeType(t)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ background: shapeType === t ? "#8B6F47" : "transparent", color: shapeType === t ? "white" : "#7A6B5E" }}>
                            <Icon style={{ width: 13, height: 13 }} />
                          </button>
                        );
                      })}
                    </div>
                    <div className="h-4 w-px" style={{ background: "rgba(212,184,139,0.35)" }} />
                    {shapeType !== "line" && (
                      <div className="relative rounded-lg" style={{ background: shapeFill, width: 20, height: 20, border: "2px solid white", boxShadow: "0 0 0 1px rgba(139,111,71,0.4)" }}>
                        <input type="color" value={shapeFill} onChange={(e) => setShapeFill(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      </div>
                    )}
                    <div className="relative rounded-lg" style={{ background: shapeStroke, width: 20, height: 20, border: "2px solid white", boxShadow: "0 0 0 1px rgba(139,111,71,0.4)" }}>
                      <input type="color" value={shapeStroke} onChange={(e) => setShapeStroke(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    </div>
                  </>
                )}
                {activeTool === "text" && (
                  <>
                    <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="h-7 px-2 rounded-lg text-xs font-semibold border cursor-pointer" style={{ borderColor: "rgba(212,184,139,0.3)", color: "#3D2B1F", background: "#FAF9F6" }}>
                      <option value="serif">Serif</option>
                      <option value="sans-serif">Sans-serif</option>
                      <option value="'Playfair Display', serif">Playfair Display</option>
                      <option value="monospace">Monospace</option>
                    </select>
                    <div className="h-4 w-px" style={{ background: "rgba(212,184,139,0.35)" }} />
                    <div className="relative rounded-lg" style={{ background: textColor, width: 20, height: 20, border: "2px solid white", boxShadow: "0 0 0 1px rgba(139,111,71,0.4)" }}>
                      <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 transform-none sm:transform z-[101] flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-full shadow-2xl backdrop-blur-md overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(212,184,139,0.25)" }}
            >
              <div className="flex items-center gap-0.5 p-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(139,111,71,0.06)" }}>
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
                    <button key={tool} onClick={() => setActiveTool(tool)} title={label}
                      className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-full transition-all cursor-pointer"
                      style={{ background: isActive ? "linear-gradient(135deg, #8B6F47 0%, #A0845E 100%)" : "transparent", color: isActive ? "#FFFFFF" : "#7A6B5E" }}>
                      <Icon style={{ width: 14, height: 14 }} />
                      <span className="text-[9px] font-semibold leading-none">{label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
              <button
                onClick={zoomOut} disabled={zoomLevel <= 50} title="Perkecil"
                className="w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-30 cursor-pointer hover:bg-stone-100 flex-shrink-0"
                style={{ color: "#8B6F47" }}
              ><ZoomOut style={{ width: 14, height: 14 }} /></button>
              <button
                onClick={resetZoom}
                title={zoomLevel === 100 ? "Tampilan sesuai layar" : "Klik untuk kembali ke 100%"}
                className="px-2 h-8 rounded-full text-[11px] font-bold font-mono cursor-pointer hover:bg-stone-100 transition-colors flex-shrink-0"
                style={{
                  color: zoomLevel !== 100 ? "#8B6F47" : "#A89B8F",
                  background: zoomLevel !== 100 ? "rgba(139,111,71,0.08)" : "transparent",
                  minWidth: 46,
                }}
              >{zoomLevel}%</button>
              <button
                onClick={zoomIn} disabled={zoomLevel >= 300} title="Perbesar"
                className="w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-30 cursor-pointer hover:bg-stone-100 flex-shrink-0"
                style={{ color: "#8B6F47" }}
              ><ZoomIn style={{ width: 14, height: 14 }} /></button>
              <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
              {/* Background color picker for full mode */}
              <div className="relative flex items-center gap-1.5 px-2 py-1.5 rounded-full cursor-pointer hover:bg-stone-100 transition-all flex-shrink-0" title="Warna latar kanvas">
                <div
                  ref={bgColorSwatchRefFull}
                  className="w-4 h-4 rounded-full border"
                  style={{ background: canvasBackground, borderColor: "rgba(0,0,0,0.1)" }}
                />
                <input
                  type="color"
                  ref={bgColorInputRefFull}
                  defaultValue={canvasBackground}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  title="Ubah warna latar kanvas"
                  onInput={(e) => {
                    const color = (e.target as HTMLInputElement).value;
                    bgColorRef.current = color;
                    if (containerRef.current) containerRef.current.style.background = color;
                    if (bgColorSwatchRef.current) bgColorSwatchRef.current.style.background = color;
                    if (bgColorSwatchRefFull.current) bgColorSwatchRefFull.current.style.background = color;
                  }}
                  onChange={(e) => {
                    const color = e.target.value;
                    bgColorRef.current = color;
                    const fc = fabricCanvasRef.current;
                    if (fc) {
                      fc.setBackgroundColor(color, () => { fc.requestRenderAll(); });
                    }
                    setCanvasBackground(color);
                    setCommittedBg(color);
                  }}
                />
              </div>
              <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
              <button onClick={undoAll} disabled={!canUndo} title="Undo (Ctrl+Z)" className="w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-30 cursor-pointer hover:bg-stone-100 flex-shrink-0" style={{ color: "#8B6F47" }}><RotateCcw style={{ width: 14, height: 14 }} /></button>
              <button onClick={redoAll} disabled={!canRedo} title="Redo (Ctrl+Y)" className="w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-30 cursor-pointer hover:bg-stone-100 flex-shrink-0" style={{ color: "#8B6F47" }}><RotateCw style={{ width: 14, height: 14 }} /></button>
              <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
              <button onClick={toggleFloatingSidebar} title={showFloatingSidebar ? "Sembunyikan Panel" : "Tampilkan Panel"}
                className="flex items-center gap-1.5 px-3 h-8 rounded-full font-semibold text-xs cursor-pointer transition-all flex-shrink-0"
                style={{ background: showFloatingSidebar ? "rgba(139,111,71,0.14)" : "transparent", color: "#8B6F47" }}>
                <Layers style={{ width: 13, height: 13 }} />
                <span className="hidden sm:inline">Panel</span>
              </button>
              <div className="h-6 w-px flex-shrink-0" style={{ background: "rgba(212,184,139,0.35)" }} />
              <button onClick={() => setIsFullMode(false)} title="Keluar Layar Penuh (Esc)"
                className="flex items-center gap-1.5 px-3 h-8 rounded-full font-semibold text-xs cursor-pointer hover:opacity-90 flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #3D2B1F, #8B6F47)", color: "white" }}>
                <Minimize2 style={{ width: 13, height: 13 }} />
              </button>
            </motion.div>

            {/* Floating sidebar — always mounted, slides via y so drag+close animates smoothly */}
              <motion.div
                drag="y"
                dragControls={sidebarDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.12, bottom: 0.6 }}
                animate={{ y: showFloatingSidebar ? "0%" : "150%", opacity: showFloatingSidebar ? 1 : 0 }}
                transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.9 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 110 || info.velocity.y > 450) {
                    closeFloatingSidebar();
                  } else if (info.offset.y < -60 || info.velocity.y < -350) {
                    setIsSidebarExpanded(true);
                  } else if (info.offset.y > 30 && isSidebarExpanded) {
                    setIsSidebarExpanded(false);
                  }
                }}
                className={`fixed inset-x-0 bottom-0 top-auto ${isSidebarExpanded ? "max-h-[92vh]" : "max-h-[60vh]"} rounded-t-[28px] rounded-b-none sm:top-6 sm:right-6 sm:left-auto sm:bottom-28 sm:max-h-none sm:rounded-[28px] z-[101] sm:w-[380px] sm:max-w-[90vw] shadow-2xl backdrop-blur-md overflow-hidden flex flex-col touch-none sm:touch-auto`}
                style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(212,184,139,0.25)", transition: "max-height 0.3s ease-out", pointerEvents: showFloatingSidebar ? "auto" : "none" }}
              >
                <div
                  className="flex flex-col items-center pt-3 pb-1 sm:hidden flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
                  style={{ touchAction: "none" }}
                  onPointerDown={(e) => { if (window.innerWidth < 640) sidebarDragControls.start(e); }}
                >
                  <div className="w-10 h-1.5 rounded-full mb-1" style={{ background: "rgba(139,111,71,0.35)" }} />
                  <span className="text-[10px] text-[#A89B8F] font-medium">Geser untuk menutup</span>
                </div>
                <div
                  className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0 cursor-grab active:cursor-grabbing sm:cursor-default select-none"
                  style={{ borderColor: "rgba(139,111,71,0.1)" }}
                  onPointerDown={(e) => { if (window.innerWidth < 640) sidebarDragControls.start(e); }}
                >
                  <p className="text-sm font-bold" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>Panel Desain</p>
                  <button onClick={closeFloatingSidebar} title="Tutup panel" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 cursor-pointer" style={{ color: "#A89B8F" }}>
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden touch-auto">
                  {/* [OPT-6] Reuse SidebarTabs component in fullmode floating panel */}
                  <SidebarTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    patterns={patterns}
                    loading={loading}
                    selectedPreset={selectedPreset}
                    setSelectedPreset={setSelectedPreset}
                    customColor={customColor}
                    onCustomColorCommit={handleCustomColorCommit}
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
                  />
                </div>
              </motion.div>
          </>
        )}
      </AnimatePresence>

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
        <AlertDialog open={true} onOpenChange={() => blocker.reset?.()}>
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
                onClick={() => blocker.proceed?.()}
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
