import { useState, useRef, useEffect, useCallback } from "react";
import {
  Palette, Download, Save, RotateCcw, Layers, Brush,
  Eraser, Minus, Plus, Trash2, ZoomIn, ZoomOut, Loader2
} from "lucide-react";
import { Slider } from "../components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BatikBackground } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { toast } from "sonner";

type Tool = "select" | "brush" | "eraser";

export function CustomBatikPage() {
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [selectedColors, setSelectedColors] = useState({
    primary: "#8B4513",
    secondary: "#D2691E",
    accent: "#C9960C",
    background: "#FFF8DC",
  });
  const [scale, setScale] = useState([100]);
  const [rotation, setRotation] = useState([0]);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [brushSize, setBrushSize] = useState([16]);
  const [brushColor, setBrushColor] = useState("#C9960C");
  const [brushOpacity, setBrushOpacity] = useState([80]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const patterns = [
    { id: 0, name: "Parang", desc: "Diagonal kuat", style: "diagonal-lines" },
    { id: 1, name: "Kawung", desc: "Empat kelopak", style: "circles" },
    { id: 2, name: "Megamendung", desc: "Awan berlapis", style: "clouds" },
    { id: 3, name: "Truntum", desc: "Bintang cinta", style: "stars" },
    { id: 4, name: "Sekar Jagad", desc: "Peta dunia", style: "flowers" },
    { id: 5, name: "Sido Mukti", desc: "Geometris sakral", style: "geometric" },
  ];

  const colorPresets = [
    { name: "Klasik Sogan", colors: { primary: "#8B4513", secondary: "#D2691E", accent: "#C9960C", background: "#FFF8DC" } },
    { name: "Emas Kerajaan", colors: { primary: "#6B3A1F", secondary: "#C9960C", accent: "#D4AF37", background: "#FAF0D7" } },
    { name: "Biru Nusantara", colors: { primary: "#003366", secondary: "#1E5A8E", accent: "#4A90C2", background: "#E6F2FF" } },
    { name: "Merah Meriah", colors: { primary: "#8B0000", secondary: "#DC143C", accent: "#FF6B6B", background: "#FFE6E6" } },
    { name: "Hijau Alam", colors: { primary: "#2D5016", secondary: "#4A7C28", accent: "#7CB342", background: "#F1F8E9" } },
    { name: "Ungu Mewah", colors: { primary: "#4A148C", secondary: "#7B1FA2", accent: "#BA68C8", background: "#F3E5F5" } },
  ];

  const brushPresets = [
    { name: "Canting Halus", size: 4, opacity: 90, color: "#8B4513" },
    { name: "Kuas Sedang", size: 12, opacity: 75, color: "#C9960C" },
    { name: "Kuas Tebal", size: 24, opacity: 65, color: "#6B3A1F" },
    { name: "Sapuan Lebar", size: 40, opacity: 40, color: "#D4AF37" },
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "transparent";
  }, []);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setCanvasHistory(prev => [...prev.slice(-19), imageData]);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "select") return;
    e.preventDefault();
    saveToHistory();
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    draw(pos);
  };

  const draw = (pos: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.lineWidth = brushSize[0];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      const alpha = brushOpacity[0] / 100;
      const hex = brushColor.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
    }

    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPos.current = pos;
  };

  const continueDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === "select") return;
    e.preventDefault();
    draw(getCanvasPos(e));
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const undoLast = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvasHistory.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const prev = canvasHistory[canvasHistory.length - 1];
    ctx.putImageData(prev, 0, 0);
    setCanvasHistory(h => h.slice(0, -1));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    saveToHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDesign = async () => {
    setIsSaving(true);
    try {
      const canvas = canvasRef.current;
      const drawingData = canvas ? canvas.toDataURL("image/png") : null;
      
      const { error } = await supabase
        .from("custom_designs")
        .insert([{
          pattern_id: selectedPattern,
          colors: selectedColors,
          scale: scale[0],
          rotation: rotation[0],
          drawing_data: drawingData,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      toast.success("Desain berhasil disimpan ke database!");
    } catch (err: any) {
      handleSupabaseError(err, "CustomBatikPage.saveDesign");
      toast.error("Gagal menyimpan desain. Pastikan tabel 'custom_designs' sudah dibuat.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderPatternSVG = () => {
    const pattern = patterns[selectedPattern];
    const style: React.CSSProperties = {
      transform: `scale(${scale[0] / 100}) rotate(${rotation[0]}deg)`,
      transition: "transform 0.3s ease",
      position: "absolute",
      inset: 0,
    };

    switch (pattern.style) {
      case "diagonal-lines":
        return (
          <div style={style}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="parang-p" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <rect fill={selectedColors.background} width="60" height="60" />
                  <path d="M0,30 Q15,15 30,30 Q45,45 60,30 M0,0 Q15,-15 30,0 M30,60 Q45,45 60,60" stroke={selectedColors.primary} strokeWidth="3" fill="none" />
                  <path d="M0,30 Q15,15 30,30 Q45,45 60,30" stroke={selectedColors.secondary} strokeWidth="1.5" fill="none" transform="translate(0,-10)" />
                  <circle cx="30" cy="30" r="3" fill={selectedColors.accent} opacity="0.6" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#parang-p)" />
            </svg>
          </div>
        );
      case "circles":
        return (
          <div style={style}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="kawung-p" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                  <rect fill={selectedColors.background} width="80" height="80" />
                  <ellipse cx="40" cy="24" rx="10" ry="16" fill="none" stroke={selectedColors.primary} strokeWidth="2" />
                  <ellipse cx="40" cy="56" rx="10" ry="16" fill="none" stroke={selectedColors.primary} strokeWidth="2" />
                  <ellipse cx="24" cy="40" rx="16" ry="10" fill="none" stroke={selectedColors.primary} strokeWidth="2" />
                  <ellipse cx="56" cy="40" rx="16" ry="10" fill="none" stroke={selectedColors.primary} strokeWidth="2" />
                  <circle cx="40" cy="40" r="6" fill="none" stroke={selectedColors.secondary} strokeWidth="2" />
                  <circle cx="40" cy="40" r="2.5" fill={selectedColors.accent} />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#kawung-p)" />
            </svg>
          </div>
        );
      case "clouds":
        return (
          <div style={style}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="mega-p" x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse">
                  <rect fill={selectedColors.background} width="120" height="60" />
                  <path d="M0,30 Q20,10 40,30 Q60,50 80,30 Q100,10 120,30" fill="none" stroke={selectedColors.primary} strokeWidth="4" />
                  <path d="M0,30 Q20,10 40,30 Q60,50 80,30 Q100,10 120,30" fill="none" stroke={selectedColors.secondary} strokeWidth="2.5" transform="translate(0,10)" />
                  <path d="M0,30 Q20,10 40,30 Q60,50 80,30 Q100,10 120,30" fill="none" stroke={selectedColors.accent} strokeWidth="1.5" transform="translate(0,20)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mega-p)" />
            </svg>
          </div>
        );
      case "stars":
        return (
          <div style={style}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="truntum-p" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <rect fill={selectedColors.background} width="60" height="60" />
                  <polygon points="30,8 34,22 48,22 37,31 41,45 30,36 19,45 23,31 12,22 26,22" fill={selectedColors.primary} stroke={selectedColors.secondary} strokeWidth="1.5" />
                  <circle cx="30" cy="30" r="3" fill={selectedColors.accent} />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#truntum-p)" />
            </svg>
          </div>
        );
      case "flowers":
        return (
          <div style={style}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="sekar-p" x="0" y="0" width="90" height="90" patternUnits="userSpaceOnUse">
                  <rect fill={selectedColors.background} width="90" height="90" />
                  <circle cx="45" cy="45" r="7" fill={selectedColors.accent} />
                  <circle cx="45" cy="25" r="11" fill={selectedColors.primary} opacity="0.8" />
                  <circle cx="65" cy="45" r="11" fill={selectedColors.primary} opacity="0.8" />
                  <circle cx="45" cy="65" r="11" fill={selectedColors.primary} opacity="0.8" />
                  <circle cx="25" cy="45" r="11" fill={selectedColors.primary} opacity="0.8" />
                  <circle cx="29" cy="29" r="7" fill={selectedColors.secondary} opacity="0.65" />
                  <circle cx="61" cy="29" r="7" fill={selectedColors.secondary} opacity="0.65" />
                  <circle cx="29" cy="61" r="7" fill={selectedColors.secondary} opacity="0.65" />
                  <circle cx="61" cy="61" r="7" fill={selectedColors.secondary} opacity="0.65" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#sekar-p)" />
            </svg>
          </div>
        );
      default:
        return (
          <div style={style}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="sidomukti-p" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <rect fill={selectedColors.background} width="60" height="60" />
                  <rect x="12" y="12" width="36" height="36" fill="none" stroke={selectedColors.primary} strokeWidth="2.5" />
                  <rect x="20" y="20" width="20" height="20" fill="none" stroke={selectedColors.secondary} strokeWidth="2" />
                  <rect x="25" y="25" width="10" height="10" fill={selectedColors.accent} opacity="0.6" />
                  <line x1="12" y1="12" x2="20" y2="20" stroke={selectedColors.primary} strokeWidth="1.5" />
                  <line x1="48" y1="12" x2="40" y2="20" stroke={selectedColors.primary} strokeWidth="1.5" />
                  <line x1="12" y1="48" x2="20" y2="40" stroke={selectedColors.primary} strokeWidth="1.5" />
                  <line x1="48" y1="48" x2="40" y2="40" stroke={selectedColors.primary} strokeWidth="1.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#sidomukti-p)" />
            </svg>
          </div>
        );
    }
  };

  const toolConfig = {
    select: { cursor: "default" },
    brush: { cursor: "crosshair" },
    eraser: { cursor: "cell" },
  };

  return (
    <div className="min-h-screen relative" style={{ background: "linear-gradient(135deg, #FBF5E6, #F5E6C0)" }}>
      <BatikBackground opacity={0.04} patternType="kawung" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Page Header */}
        <div className="mb-8">
          <div
            className="inline-block px-4 py-1.5 rounded-full mb-3"
            style={{ background: "rgba(201, 150, 12, 0.15)", color: "#9A6B0A" }}
          >
            <span style={{ fontSize: "0.8rem", letterSpacing: "0.12em" }}>STUDIO KREATIF</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#3D1C02", fontSize: "2rem" }}>
            Kustomisasi Batik Anda
          </h1>
          <p style={{ color: "#6B4226", fontSize: "0.9rem" }}>
            Pilih motif, atur warna, dan gunakan kuas digital untuk karya batik yang personal
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ======= CANVAS AREA ======= */}
          <div className="lg:col-span-2 space-y-4">
            {/* Preview Canvas */}
            <div
              className="rounded-2xl overflow-hidden shadow-xl"
              style={{ border: "1px solid rgba(201, 150, 12, 0.3)" }}
            >
              {/* Toolbar */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg, #6B3A1F, #3D1C02)" }}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" style={{ color: "#D4AF37" }} />
                  <span style={{ color: "#D4AF37", fontSize: "0.875rem" }}>Canvas Desain</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={undoLast}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: "rgba(201, 150, 12, 0.15)", color: "#D4AF37" }}
                    title="Undo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={clearCanvas}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: "rgba(201, 150, 12, 0.15)", color: "#D4AF37" }}
                    title="Bersihkan Kuas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={saveDesign}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg transition-all text-sm disabled:opacity-50"
                    style={{ background: "rgba(201, 150, 12, 0.2)", color: "#D4AF37" }}
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {isSaving ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg transition-all text-sm"
                    style={{ background: "linear-gradient(135deg, #C9960C, #D4AF37)", color: "#3D1C02" }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh
                  </button>
                </div>
              </div>

              {/* Pattern + Canvas Layer */}
              <div
                ref={previewRef}
                className="aspect-[4/3] relative overflow-hidden select-none"
                style={{ background: selectedColors.background }}
              >
                {/* Layer 1: SVG Pattern */}
                {renderPatternSVG()}

                {/* Layer 2: Drawing Canvas */}
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="absolute inset-0 w-full h-full"
                  style={{ cursor: toolConfig[activeTool].cursor, touchAction: "none" }}
                  onMouseDown={startDrawing}
                  onMouseMove={continueDrawing}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />

                {/* Tool indicator */}
                {activeTool !== "select" && (
                  <div
                    className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(61, 28, 2, 0.8)", color: "#D4AF37", fontSize: "0.75rem" }}
                  >
                    {activeTool === "brush" ? <Brush className="w-3.5 h-3.5" /> : <Eraser className="w-3.5 h-3.5" />}
                    {activeTool === "brush" ? "Mode Kuas Aktif" : "Mode Hapus Aktif"}
                    <span style={{ color: "rgba(212,175,55,0.6)" }}>• Ukuran: {brushSize[0]}px</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tool Controls */}
            <div
              className="rounded-2xl p-5 shadow-lg"
              style={{ background: "white", border: "1px solid rgba(201, 150, 12, 0.15)" }}
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Tool Selection */}
                <div>
                  <label className="block mb-3" style={{ color: "#3D1C02", fontSize: "0.875rem" }}>
                    <Palette className="w-4 h-4 inline mr-1.5" style={{ color: "#C9960C" }} />
                    Alat
                  </label>
                  <div className="flex gap-2">
                    {[
                      { tool: "select" as Tool, icon: ZoomIn, label: "Pilih" },
                      { tool: "brush" as Tool, icon: Brush, label: "Kuas" },
                      { tool: "eraser" as Tool, icon: Eraser, label: "Hapus" },
                    ].map(({ tool, icon: Icon, label }) => (
                      <button
                        key={tool}
                        onClick={() => setActiveTool(tool)}
                        className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl transition-all"
                        style={{
                          background: activeTool === tool ? "linear-gradient(135deg, #C9960C, #D4AF37)" : "rgba(201, 150, 12, 0.08)",
                          color: activeTool === tool ? "#3D1C02" : "#6B4226",
                          border: `1px solid ${activeTool === tool ? "#C9960C" : "rgba(201, 150, 12, 0.2)"}`,
                        }}
                      >
                        <Icon className="w-5 h-5" />
                        <span style={{ fontSize: "0.7rem" }}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brush Color */}
                {activeTool === "brush" && (
                  <div>
                    <label className="block mb-3" style={{ color: "#3D1C02", fontSize: "0.875rem" }}>
                      Warna Kuas
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border-2 cursor-pointer"
                        style={{ borderColor: "#C9960C" }}
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {["#8B4513", "#C9960C", "#D4AF37", "#3D1C02", "#6B3A1F", "#FFF8DC", "#1E4A8C", "#2D5016"].map(c => (
                          <button
                            key={c}
                            onClick={() => setBrushColor(c)}
                            className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                            style={{
                              background: c,
                              borderColor: brushColor === c ? "#C9960C" : "transparent",
                              boxShadow: brushColor === c ? "0 0 0 2px white" : "none",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Brush Size & Opacity */}
                {activeTool !== "select" && (
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block mb-2" style={{ color: "#3D1C02", fontSize: "0.875rem" }}>
                        Ukuran: {brushSize[0]}px
                      </label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setBrushSize([Math.max(2, brushSize[0] - 4)])} style={{ color: "#9A6B0A" }}>
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex-1">
                          <Slider value={brushSize} onValueChange={setBrushSize} min={2} max={80} step={2} />
                        </div>
                        <button onClick={() => setBrushSize([Math.min(80, brushSize[0] + 4)])} style={{ color: "#9A6B0A" }}>
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {activeTool === "brush" && (
                      <div>
                        <label className="block mb-2" style={{ color: "#3D1C02", fontSize: "0.875rem" }}>
                          Opasitas: {brushOpacity[0]}%
                        </label>
                        <Slider value={brushOpacity} onValueChange={setBrushOpacity} min={5} max={100} step={5} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Brush Presets */}
              {activeTool === "brush" && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(201, 150, 12, 0.1)" }}>
                  <label className="block mb-3" style={{ color: "#3D1C02", fontSize: "0.875rem" }}>
                    Preset Kuas Batik
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {brushPresets.map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setBrushSize([preset.size]);
                          setBrushOpacity([preset.opacity]);
                          setBrushColor(preset.color);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                        style={{
                          background: "rgba(201, 150, 12, 0.08)",
                          border: "1px solid rgba(201, 150, 12, 0.2)",
                          color: "#6B4226",
                        }}
                      >
                        <div
                          className="rounded-full"
                          style={{
                            width: Math.min(preset.size / 2, 16),
                            height: Math.min(preset.size / 2, 16),
                            background: preset.color,
                            opacity: preset.opacity / 100,
                            minWidth: 6,
                            minHeight: 6,
                          }}
                        />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pattern Transform */}
            <div
              className="rounded-2xl p-5 shadow-lg"
              style={{ background: "white", border: "1px solid rgba(201, 150, 12, 0.15)" }}
            >
              <h3 className="mb-4 flex items-center gap-2" style={{ color: "#3D1C02" }}>
                <ZoomOut className="w-4 h-4" style={{ color: "#C9960C" }} />
                Transformasi Pola
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2" style={{ color: "#6B4226", fontSize: "0.875rem" }}>
                    Ukuran Pola: {scale[0]}%
                  </label>
                  <Slider value={scale} onValueChange={setScale} min={30} max={300} step={5} />
                </div>
                <div>
                  <label className="block mb-2" style={{ color: "#6B4226", fontSize: "0.875rem" }}>
                    Rotasi: {rotation[0]}°
                  </label>
                  <Slider value={rotation} onValueChange={setRotation} min={0} max={360} step={5} />
                </div>
              </div>
            </div>
          </div>

          {/* ======= SIDEBAR ======= */}
          <div className="space-y-4">
            <div
              className="rounded-2xl shadow-lg overflow-hidden"
              style={{ border: "1px solid rgba(201, 150, 12, 0.2)" }}
            >
              <Tabs defaultValue="pattern">
                <div className="p-4 pb-0" style={{ background: "white" }}>
                  <TabsList className="grid w-full grid-cols-2" style={{ background: "rgba(201, 150, 12, 0.08)" }}>
                    <TabsTrigger value="pattern" style={{ fontSize: "0.875rem" }}>
                      Motif
                    </TabsTrigger>
                    <TabsTrigger value="color" style={{ fontSize: "0.875rem" }}>
                      Warna
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="pattern" className="p-4 m-0" style={{ background: "white" }}>
                  <p className="mb-3" style={{ color: "#9A6B4B", fontSize: "0.8rem" }}>
                    Pilih motif batik sebagai dasar desain Anda
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {patterns.map((pattern) => {
                      const isSelected = selectedPattern === pattern.id;
                      return (
                        <button
                          key={pattern.id}
                          onClick={() => setSelectedPattern(pattern.id)}
                          className="p-3 rounded-xl border-2 transition-all text-left hover:shadow-md"
                          style={{
                            borderColor: isSelected ? "#C9960C" : "rgba(201, 150, 12, 0.15)",
                            background: isSelected ? "rgba(201, 150, 12, 0.08)" : "rgba(251, 245, 230, 0.5)",
                          }}
                        >
                          {/* Mini pattern preview */}
                          <div
                            className="w-full h-10 rounded-lg mb-2 overflow-hidden"
                            style={{ background: selectedColors.background }}
                          >
                            <svg width="100%" height="100%">
                              <defs>
                                <pattern id={`mini-${pattern.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                  <rect fill={selectedColors.background} width="20" height="20" />
                                  {pattern.style === "diagonal-lines" && (
                                    <path d="M0,10 Q5,5 10,10 Q15,15 20,10" stroke={selectedColors.primary} strokeWidth="1.5" fill="none" />
                                  )}
                                  {pattern.style === "circles" && (
                                    <>
                                      <circle cx="10" cy="6" r="4" fill="none" stroke={selectedColors.primary} strokeWidth="1" />
                                      <circle cx="10" cy="14" r="4" fill="none" stroke={selectedColors.primary} strokeWidth="1" />
                                    </>
                                  )}
                                  {pattern.style === "clouds" && (
                                    <path d="M0,10 Q5,4 10,10 Q15,16 20,10" stroke={selectedColors.primary} strokeWidth="2" fill="none" />
                                  )}
                                  {pattern.style === "stars" && (
                                    <polygon points="10,3 12,8 17,8 13,11 15,16 10,13 5,16 7,11 3,8 8,8" fill={selectedColors.primary} />
                                  )}
                                  {pattern.style === "flowers" && (
                                    <>
                                      <circle cx="10" cy="10" r="2.5" fill={selectedColors.accent} />
                                      <circle cx="10" cy="4" r="3" fill={selectedColors.primary} opacity="0.8" />
                                      <circle cx="16" cy="10" r="3" fill={selectedColors.primary} opacity="0.8" />
                                      <circle cx="10" cy="16" r="3" fill={selectedColors.primary} opacity="0.8" />
                                      <circle cx="4" cy="10" r="3" fill={selectedColors.primary} opacity="0.8" />
                                    </>
                                  )}
                                  {pattern.style === "geometric" && (
                                    <>
                                      <rect x="4" y="4" width="12" height="12" fill="none" stroke={selectedColors.primary} strokeWidth="1.5" />
                                      <rect x="7" y="7" width="6" height="6" fill={selectedColors.secondary} opacity="0.5" />
                                    </>
                                  )}
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill={`url(#mini-${pattern.id})`} />
                            </svg>
                          </div>
                          <div style={{ color: "#3D1C02", fontSize: "0.8rem" }}>{pattern.name}</div>
                          <div style={{ color: "#9A6B4B", fontSize: "0.7rem" }}>{pattern.desc}</div>
                          {isSelected && (
                            <div className="mt-1 text-xs" style={{ color: "#C9960C" }}>✓ Dipilih</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="color" className="p-4 m-0" style={{ background: "white" }}>
                  {/* Color Presets */}
                  <p className="mb-3" style={{ color: "#9A6B4B", fontSize: "0.8rem" }}>Preset Palet Warna</p>
                  <div className="space-y-2 mb-5">
                    {colorPresets.map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColors(preset.colors)}
                        className="w-full p-2.5 rounded-xl border transition-all text-left hover:shadow-md"
                        style={{
                          border: "1px solid rgba(201, 150, 12, 0.2)",
                          background: "rgba(251, 245, 230, 0.5)",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {Object.values(preset.colors).map((c, ci) => (
                              <div key={ci} className="w-5 h-5 rounded" style={{ background: c }} />
                            ))}
                          </div>
                          <span style={{ color: "#3D1C02", fontSize: "0.8rem" }}>{preset.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Colors */}
                  <p className="mb-3" style={{ color: "#9A6B4B", fontSize: "0.8rem" }}>Warna Kustom</p>
                  <div className="space-y-3">
                    {Object.entries(selectedColors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => setSelectedColors({ ...selectedColors, [key]: e.target.value })}
                          className="w-9 h-9 rounded-lg border-2 cursor-pointer flex-shrink-0"
                          style={{ borderColor: "rgba(201, 150, 12, 0.3)" }}
                        />
                        <div>
                          <div style={{ color: "#3D1C02", fontSize: "0.8rem", textTransform: "capitalize" }}>{key}</div>
                          <div style={{ color: "#9A6B4B", fontSize: "0.7rem" }}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Order CTA */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #6B3A1F, #3D1C02)" }}
            >
              <BatikBackground opacity={0.15} patternType="kawung" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(201, 150, 12, 0.25)" }}
                  >
                    <Layers className="w-4 h-4" style={{ color: "#D4AF37" }} />
                  </div>
                  <h3 style={{ color: "#D4AF37", fontFamily: "'Playfair Display', serif" }}>
                    Desain Siap?
                  </h3>
                </div>
                <p className="mb-4" style={{ color: "rgba(251, 245, 230, 0.7)", fontSize: "0.8rem", lineHeight: "1.6" }}>
                  Wujudkan desain digital Anda menjadi kain batik asli oleh pengrajin terpilih dari Desa Jetis.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: "Bahan", value: "Katun Prima" },
                    { label: "Proses", value: "3-7 Hari" },
                    { label: "Ukuran", value: "2.5m × 1.15m" },
                    { label: "Pengrajin", value: "Desa Jetis" },
                  ].map((info, i) => (
                    <div key={i} className="p-2 rounded-lg" style={{ background: "rgba(201, 150, 12, 0.1)" }}>
                      <div style={{ color: "rgba(251,245,230,0.5)", fontSize: "0.65rem" }}>{info.label}</div>
                      <div style={{ color: "#D4AF37", fontSize: "0.75rem" }}>{info.value}</div>
                    </div>
                  ))}
                </div>
                <button
                  className="w-full py-3 rounded-xl transition-all hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, #C9960C, #D4AF37)", color: "#3D1C02" }}
                >
                  Pesan Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}