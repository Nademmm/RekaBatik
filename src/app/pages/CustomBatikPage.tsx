import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import html2canvas from "html2canvas";
import {
  Palette, Download, Save, RotateCcw, Layers, Brush,
  Eraser, Minus, Plus, Trash2, ZoomOut, Loader2,
  CheckCircle2, GripVertical, RotateCw, Maximize2
} from "lucide-react";
import { Slider } from "../components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BatikBackground } from "../components/BatikBackground";
import { supabase, handleSupabaseError } from "../../lib/supabase";
import { BatikItem } from "../../types/database";
import { toast } from "sonner";
import { Skeleton } from "../components/ui/skeleton";

// Tipe data untuk item di canvas (motif)
interface CanvasItem {
  id: string;
  patternId: number;
  type: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  zIndex: number;
  borderRadius: number; // in px
  width: number;
  height: number;
  layerType: "pattern";
}

// Tipe data untuk layer gambar (kuas)
interface DrawingLayer {
  id: string;
  zIndex: number;
  layerType: "drawing";
  imageData: ImageData | null; // Data gambar untuk layer ini
  color: string; // Warna kuas untuk layer ini
  size: number; // Ukuran kuas untuk layer ini
  name: string; // Nama layer (untuk ditampilkan di panel layer)
}

// Tipe layer gabungan
type Layer = CanvasItem | DrawingLayer;

type Tool = "select" | "brush" | "eraser";

export function CustomBatikPage() {
  const [patterns, setPatterns] = useState<BatikItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeDrawingLayerId, setActiveDrawingLayerId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [brushSize, setBrushSize] = useState([16]);
  const [brushColor, setBrushColor] = useState("#8B6F47");
  const [brushOpacity, setBrushOpacity] = useState([80]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(1);
  
  // Refs for drawing canvas
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  
  // History for undo/redo
  const [history, setHistory] = useState<{
    layers: Layer[];
  }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryRecordingPaused = useRef(false);

  // Initialize history with empty state
  useEffect(() => {
    setHistory([{
      layers: [],
    }]);
    setHistoryIndex(0);
  }, []);

  // Ref to keep track of current canvas for drawing
  const currentDrawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragItemStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const lastSyncedImageData = useRef<{ [key: string]: string }>({});

  // Fetch patterns dari database
  useEffect(() => {
    async function fetchPatterns() {
      try {
        const { data, error } = await supabase
          .from("batik_items")
          .select("*")
          .order("id", { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setPatterns(data);
        }
      } catch (err: any) {
        handleSupabaseError(err, "CustomBatikPage.fetchPatterns");
      } finally {
        setLoading(false);
      }
    }
    fetchPatterns();
  }, []);

  const colorPresets = [
    { name: "Klasik Sogan", colors: { primary: "#8B6F47", secondary: "#D4B88B", accent: "#E8E1DA", background: "transparent" } },
    { name: "Emas Kerajaan", colors: { primary: "#6B3A1F", secondary: "#D4B88B", accent: "#E8DCC8", background: "transparent" } },
    { name: "Biru Nusantara", colors: { primary: "#2A4B7C", secondary: "#5A8AC6", accent: "#B8D4F0", background: "transparent" } },
    { name: "Merah Meriah", colors: { primary: "#8B2A2A", secondary: "#C64F4F", accent: "#F0B8B8", background: "transparent" } },
    { name: "Hijau Alam", colors: { primary: "#2D5A2D", secondary: "#5A9C5A", accent: "#B8E0B8", background: "transparent" } },
    { name: "Ungu Mewah", colors: { primary: "#5A2D7C", secondary: "#8B5AB8", accent: "#D4B8E0", background: "transparent" } },
  ];

  const brushPresets = [
    { name: "Canting Halus", size: 4, opacity: 90, color: "#8B6F47" },
    { name: "Kuas Sedang", size: 12, opacity: 75, color: "#D4B88B" },
    { name: "Kuas Tebal", size: 24, opacity: 65, color: "#6B3A1F" },
    { name: "Sapuan Lebar", size: 40, opacity: 40, color: "#D4B88B" },
  ];

  // Function to save state to history
  const saveToHistory = useCallback(() => {
    if (isHistoryRecordingPaused.current) return;

    // To save ImageData, we need to convert to serializable format
    const serializeLayers = (layersToSerialize: Layer[]) => {
      return layersToSerialize.map(layer => {
        if (layer.layerType === "drawing" && layer.imageData) {
          // Convert ImageData to serializable object
          return {
            ...layer,
            imageData: {
              data: Array.from(layer.imageData.data),
              width: layer.imageData.width,
              height: layer.imageData.height,
            },
          };
        }
        return layer;
      });
    };

    const newEntry = {
      layers: JSON.parse(JSON.stringify(serializeLayers(layers))), // deep copy
    };

    // Remove any future history if we're not at the latest index
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);

    // Keep history limited to last 50 entries
    let finalHistory = newHistory;
    let finalIndex = historyIndex + 1;
    if (finalHistory.length > 50) {
      finalHistory = finalHistory.slice(-50);
      finalIndex = 49; // since we have 50 entries (indices 0-49)
    }

    setHistory(finalHistory);
    setHistoryIndex(finalIndex);
  }, [layers, history, historyIndex]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    isHistoryRecordingPaused.current = true;
    const newIndex = historyIndex - 1;
    const previousState = history[newIndex];

    // Deserialize layers
    const deserializeLayers = (serializedLayers: any[]): Layer[] => {
      return serializedLayers.map(layer => {
        if (layer.layerType === "drawing" && layer.imageData) {
          return {
            ...layer,
            imageData: new ImageData(
              new Uint8ClampedArray(layer.imageData.data),
              layer.imageData.width,
              layer.imageData.height
            ),
          };
        }
        return layer;
      });
    };

    setLayers(deserializeLayers(previousState.layers));

    setHistoryIndex(newIndex);

    setTimeout(() => {
      isHistoryRecordingPaused.current = false;
    }, 100);
  }, [history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    isHistoryRecordingPaused.current = true;
    const newIndex = historyIndex + 1;
    const nextState = history[newIndex];

    // Deserialize layers
    const deserializeLayers = (serializedLayers: any[]): Layer[] => {
      return serializedLayers.map(layer => {
        if (layer.layerType === "drawing" && layer.imageData) {
          return {
            ...layer,
            imageData: new ImageData(
              new Uint8ClampedArray(layer.imageData.data),
              layer.imageData.width,
              layer.imageData.height
            ),
          };
        }
        return layer;
      });
    };

    setLayers(deserializeLayers(nextState.layers));

    setHistoryIndex(newIndex);

    setTimeout(() => {
      isHistoryRecordingPaused.current = false;
    }, 100);
  }, [history, historyIndex]);



  // Fungsi untuk menambah item ke canvas
  const addItemToCanvas = (pattern: BatikItem) => {
    const newItem: CanvasItem = {
      id: Date.now().toString(),
      patternId: pattern.id,
      type: pattern.style_type || pattern.category || "default",
      position: { x: 200, y: 150 },
      scale: 100,
      rotation: 0,
      colors: {
        primary: "#8B6F47",
        secondary: "#D4B88B",
        accent: "#E8E1DA",
        background: "transparent",
      },
      zIndex: nextZIndex,
      borderRadius: 0, // default: no rounded corners
      width: 200,
      height: 200,
      layerType: "pattern",
    };
    // First update the state
    setLayers([...layers, newItem]);
    setSelectedLayerId(newItem.id);
    setNextZIndex(nextZIndex + 1);
    // Then save to history AFTER the state updates (using a timeout)
    setTimeout(saveToHistory, 0);
  };

  // Fungsi untuk menambah layer gambar baru
  const addDrawingLayer = (skipHistory = false) => {
    const newLayer: DrawingLayer = {
      id: Date.now().toString(),
      zIndex: nextZIndex,
      layerType: "drawing",
      imageData: null,
      color: brushColor,
      size: brushSize[0],
      name: `Layer Kuas ${brushColor}`,
    };
    setLayers([...layers, newLayer]);
    setActiveDrawingLayerId(newLayer.id);
    setSelectedLayerId(newLayer.id);
    setNextZIndex(nextZIndex + 1);
    if (!skipHistory) {
      setTimeout(saveToHistory, 0);
    }
  };

  // Fungsi untuk mengupdate layer
  const updateLayer = (id: string, updates: Partial<Layer>, skipHistory = false) => {
    setLayers(layers.map(layer => {
      if (layer.id === id) {
        return { ...layer, ...updates };
      }
      return layer;
    }));
    if (!skipHistory) {
      setTimeout(saveToHistory, 0);
    }
  };

  // Fungsi untuk menghapus layer
  const deleteSelectedLayer = () => {
    if (!selectedLayerId) return;
    setLayers(layers.filter(layer => layer.id !== selectedLayerId));
    setSelectedLayerId(null);
    if (activeDrawingLayerId === selectedLayerId) {
      setActiveDrawingLayerId(null);
    }
    setTimeout(saveToHistory, 0);
  };

  // Fungsi untuk memindahkan layer ke atas
  const moveLayerUp = (id: string) => {
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const index = sortedLayers.findIndex(layer => layer.id === id);
    if (index >= sortedLayers.length - 1) return; // Sudah di paling atas

    const currentLayer = sortedLayers[index];
    const nextLayer = sortedLayers[index + 1];

    // Swap zIndex
    const newLayers = sortedLayers.map(layer => {
      if (layer.id === id) return { ...layer, zIndex: nextLayer.zIndex };
      if (layer.id === nextLayer.id) return { ...layer, zIndex: currentLayer.zIndex };
      return layer;
    });

    setLayers(newLayers);
    setTimeout(saveToHistory, 0);
  };

  // Fungsi untuk memindahkan layer ke bawah
  const moveLayerDown = (id: string) => {
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const index = sortedLayers.findIndex(layer => layer.id === id);
    if (index <= 0) return; // Sudah di paling bawah

    const currentLayer = sortedLayers[index];
    const prevLayer = sortedLayers[index - 1];

    // Swap zIndex
    const newLayers = sortedLayers.map(layer => {
      if (layer.id === id) return { ...layer, zIndex: prevLayer.zIndex };
      if (layer.id === prevLayer.id) return { ...layer, zIndex: currentLayer.zIndex };
      return layer;
    });

    setLayers(newLayers);
    setTimeout(saveToHistory, 0);
  };

  // Fungsi untuk mendapatkan item yang terpilih
  const selectedItemRaw = layers.find(item => item.id === selectedLayerId && item.layerType === "pattern") as CanvasItem | undefined;
  const selectedItem = selectedItemRaw ? {
    borderRadius: 0,
    width: 200,
    height: 200,
    ...selectedItemRaw,
  } : undefined;

  // Render SVG pattern untuk satu item
  const renderItemSVG = (item: CanvasItem) => {
    const id = `item-pattern-${item.id}`;
    const { primary, secondary, background } = item.colors;

    const renderPat = () => {
      if (item.type === "diagonal-lines" || item.type === "traditional" || item.type === "parang") return (
        <pattern id={id} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect fill={background} width="100" height="100" />
          <path d="M0,50 Q25,25 50,50 Q75,75 100,50" stroke={primary} strokeWidth="6" fill="none" />
          <path d="M0,80 Q25,55 50,80 Q75,105 100,80" stroke={secondary} strokeWidth="3" fill="none" />
          <path d="M0,20 Q25,-5 50,20 Q75,45 100,20" stroke={secondary} strokeWidth="3" fill="none" />
        </pattern>
      );
      if (item.type === "circles" || item.type === "kawung") return (
        <pattern id={id} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect fill={background} width="80" height="80" />
          <ellipse cx="40" cy="22" rx="10" ry="18" fill="none" stroke={primary} strokeWidth="2.5" />
          <ellipse cx="40" cy="58" rx="10" ry="18" fill="none" stroke={primary} strokeWidth="2.5" />
          <ellipse cx="22" cy="40" rx="18" ry="10" fill="none" stroke={primary} strokeWidth="2.5" />
          <ellipse cx="58" cy="40" rx="18" ry="10" fill="none" stroke={primary} strokeWidth="2.5" />
          <circle cx="40" cy="40" r="5" fill={secondary} />
        </pattern>
      );
      if (item.type === "clouds" || item.type === "regional" || item.type === "mega") return (
        <pattern id={id} x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse">
          <rect fill={background} width="120" height="60" />
          <path d="M0,30 Q15,10 30,30 Q45,50 60,30 Q75,10 90,30 Q105,50 120,30" stroke={primary} strokeWidth="5" fill="none" />
          <path d="M0,30 Q15,10 30,30 Q45,50 60,30 Q75,10 90,30 Q105,50 120,30" stroke={secondary} strokeWidth="2.5" fill="none" transform="translate(0,-10)" />
        </pattern>
      );
      if (item.type === "stars" || item.type === "truntum") return (
        <pattern id={id} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect fill={background} width="60" height="60" />
          <polygon points="30,10 34,22 46,22 36,30 40,42 30,34 20,42 24,30 14,22 26,22" fill={primary} stroke={secondary} strokeWidth="1" />
          <circle cx="30" cy="30" r="4" fill={secondary} />
        </pattern>
      );
      if (item.type === "flowers" || item.type === "sekar") return (
        <pattern id={id} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect fill={background} width="80" height="80" />
          <circle cx="40" cy="40" r="7" fill={secondary} />
          <circle cx="40" cy="20" r="10" fill={primary} opacity="0.8" />
          <circle cx="60" cy="40" r="10" fill={primary} opacity="0.8" />
          <circle cx="40" cy="60" r="10" fill={primary} opacity="0.8" />
          <circle cx="20" cy="40" r="10" fill={primary} opacity="0.8" />
        </pattern>
      );
      return (
        <pattern id={id} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect fill={background} width="50" height="50" />
          <rect x="10" y="10" width="30" height="30" fill="none" stroke={primary} strokeWidth="2" />
          <rect x="18" y="18" width="14" height="14" fill="none" stroke={secondary} strokeWidth="1.5" />
        </pattern>
      );
    };

    return (
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>{renderPat()}</defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    );
  };

  // Fungsi untuk handle mouse event pada canvas area
  const getCanvasMousePos = (e: React.MouseEvent) => {
    const canvas = previewRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Track if a drag occurred
  const hasDragged = useRef(false);
  const isResizing = useRef(false);
  const resizeHandle = useRef<string | null>(null);
  const itemStartSize = useRef<{ width: number; height: number } | null>(null);
  const isRotating = useRef(false);
  const itemStartRotation = useRef(0);

  // Handle drag start
  const handleItemMouseDown = (e: React.MouseEvent, item: CanvasItem) => {
    e.stopPropagation();
    e.preventDefault();
    // Automatically switch to select mode when interacting with a pattern layer
    if (activeTool !== "select") setActiveTool("select");
    
    hasDragged.current = false;
    setSelectedLayerId(item.id);
    // Naikkan z-index ketika dipilih (don't save to history yet)
    updateLayer(item.id, { zIndex: nextZIndex }, true);
    setNextZIndex(nextZIndex + 1);

    isDragging.current = true;
    dragStartPos.current = getCanvasMousePos(e);
    dragItemStartPos.current = { ...item.position };
  };

  // Handle resize start
  const handleResizeMouseDown = (e: React.MouseEvent, item: CanvasItem, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    // Automatically switch to select mode when interacting with a pattern layer
    if (activeTool !== "select") setActiveTool("select");

    isResizing.current = true;
    resizeHandle.current = handle;
    dragStartPos.current = getCanvasMousePos(e);
    itemStartSize.current = { width: item.width, height: item.height };
    dragItemStartPos.current = { ...item.position };
  };

  // Handle rotation start
  const handleRotationMouseDown = (e: React.MouseEvent, item: CanvasItem) => {
    e.stopPropagation();
    e.preventDefault();
    // Automatically switch to select mode when interacting with a pattern layer
    if (activeTool !== "select") setActiveTool("select");

    isRotating.current = true;
    itemStartRotation.current = item.rotation;
    dragStartPos.current = getCanvasMousePos(e);
    setSelectedLayerId(item.id);
    updateLayer(item.id, { zIndex: nextZIndex }, true);
    setNextZIndex(nextZIndex + 1);
  };

  // Handle item click
  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // Handle mouse move di canvas
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if ((isDragging.current || isResizing.current || isRotating.current) && selectedLayerId && dragStartPos.current) {
      const currentPos = getCanvasMousePos(e);
      const dx = currentPos.x - dragStartPos.current.x;
      const dy = currentPos.y - dragStartPos.current.y;
      
      // Set hasDragged if we moved more than 3px
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDragged.current = true;
      }

      if (isDragging.current && dragItemStartPos.current) {
        // Move the item
        updateLayer(selectedLayerId, {
          position: {
            x: dragItemStartPos.current.x + dx,
            y: dragItemStartPos.current.y + dy
          }
        }, true);
      } else if (isResizing.current && resizeHandle.current && itemStartSize.current && dragItemStartPos.current) {
        // Resize the item
        let newWidth = itemStartSize.current.width;
        let newHeight = itemStartSize.current.height;
        let newX = dragItemStartPos.current.x;
        let newY = dragItemStartPos.current.y;

        switch (resizeHandle.current) {
          case "bottom-right":
            newWidth = Math.max(50, itemStartSize.current.width + dx);
            newHeight = Math.max(50, itemStartSize.current.height + dy);
            break;
          case "bottom-left":
            newWidth = Math.max(50, itemStartSize.current.width - dx);
            newHeight = Math.max(50, itemStartSize.current.height + dy);
            newX = dragItemStartPos.current.x + dx;
            break;
          case "top-right":
            newWidth = Math.max(50, itemStartSize.current.width + dx);
            newHeight = Math.max(50, itemStartSize.current.height - dy);
            newY = dragItemStartPos.current.y + dy;
            break;
          case "top-left":
            newWidth = Math.max(50, itemStartSize.current.width - dx);
            newHeight = Math.max(50, itemStartSize.current.height - dy);
            newX = dragItemStartPos.current.x + dx;
            newY = dragItemStartPos.current.y + dy;
            break;
          case "right":
            newWidth = Math.max(50, itemStartSize.current.width + dx);
            break;
          case "left":
            newWidth = Math.max(50, itemStartSize.current.width - dx);
            newX = dragItemStartPos.current.x + dx;
            break;
          case "bottom":
            newHeight = Math.max(50, itemStartSize.current.height + dy);
            break;
          case "top":
            newHeight = Math.max(50, itemStartSize.current.height - dy);
            newY = dragItemStartPos.current.y + dy;
            break;
        }

        updateLayer(selectedLayerId, {
          width: newWidth,
          height: newHeight,
          position: { x: newX, y: newY }
        }, true);
      } else if (isRotating.current) {
        // Rotate the item
        const item = layers.find(i => i.id === selectedLayerId && i.layerType === "pattern") as CanvasItem | undefined;
        if (item) {
          const centerX = item.position.x + item.width / 2;
          const centerY = item.position.y + item.height / 2;
          
          // Calculate angle from center to start pos
          const startAngle = Math.atan2(
            dragStartPos.current.y - centerY,
            dragStartPos.current.x - centerX
          );
          
          // Calculate angle from center to current pos
          const currentAngle = Math.atan2(
            currentPos.y - centerY,
            currentPos.x - centerX
          );
          
          // Calculate delta in degrees
          const deltaDegrees = ((currentAngle - startAngle) * 180) / Math.PI;
          
          // Update the item's rotation
          updateLayer(selectedLayerId, {
            rotation: itemStartRotation.current + deltaDegrees
          }, true);
        }
      }
    }
  };

  // Handle mouse up
  const handleCanvasMouseUp = () => {
    // Save history if we were dragging/resizing/rotating
    if (isDragging.current || isResizing.current || isRotating.current) {
      setTimeout(saveToHistory, 0);
    }
    
    isDragging.current = false;
    isResizing.current = false;
    isRotating.current = false;
    resizeHandle.current = null;
    dragStartPos.current = null;
    dragItemStartPos.current = null;
    itemStartSize.current = null;
  };

  // Handle klik canvas kosong untuk deselect
  const handleCanvasClick = () => {
    if (activeTool === "select" && !hasDragged.current) {
      setSelectedLayerId(null);
    }
    hasDragged.current = false;
  };

  // --- Drawing functions ---
  const getCanvasPos = (e: any) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    let clientX = 0;
    let clientY = 0;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: any) => {
    console.log("=== startDrawing ===");
    console.log("activeTool:", activeTool);
    console.log("activeDrawingLayerId:", activeDrawingLayerId);
    console.log("canvasRefs.current:", canvasRefs.current);
    
    if (activeTool === "select") {
      console.log("In select mode, ignoring");
      return;
    }
    e.preventDefault();
    
    // Step 1: Check if we need a new drawing layer
    let needNewLayer = false;
    if (activeDrawingLayerId) {
      const currentLayer = layers.find(l => l.id === activeDrawingLayerId && l.layerType === "drawing") as DrawingLayer | undefined;
      if (currentLayer) {
        // Check if current layer has drawing or wrong color/size
        const hasDrawing = currentLayer.imageData !== null;
        const wrongColor = currentLayer.color !== brushColor;
        const wrongSize = currentLayer.size !== brushSize[0];
        
        if (hasDrawing || wrongColor || wrongSize) {
          needNewLayer = true;
        }
      }
    }
    
    // Step 2: Ensure we have an active drawing layer
    let targetLayerId = activeDrawingLayerId;
    if (!targetLayerId || needNewLayer) {
      console.log("Creating new drawing layer");
      targetLayerId = Date.now().toString();
      const newLayer: DrawingLayer = {
        id: targetLayerId,
        zIndex: nextZIndex,
        layerType: "drawing",
        imageData: null,
        color: brushColor,
        size: brushSize[0],
        name: `Layer Kuas ${brushColor}`,
      };
      
      // Update state
      setLayers(prevLayers => [...prevLayers, newLayer]);
      setActiveDrawingLayerId(targetLayerId);
      setSelectedLayerId(targetLayerId);
      setNextZIndex(nextZIndex + 1);
      
      // Update last refs
      lastBrushColorRef.current = brushColor;
      lastBrushSizeRef.current = brushSize[0];
      
      // Poll for canvas to be ready
      let attempts = 0;
      const checkCanvas = setInterval(() => {
        attempts++;
        const canvas = canvasRefs.current[targetLayerId];
        if (canvas) {
          clearInterval(checkCanvas);
          console.log("Canvas ready, starting drawing");
          currentDrawingCanvasRef.current = canvas;
          setIsDrawing(true);
          const pos = getCanvasPos(e);
          lastPos.current = pos;
          draw(pos);
        } else if (attempts > 30) {
          clearInterval(checkCanvas);
          console.error("Canvas failed to render after 30 attempts");
        }
      }, 50);
      
      return;
    }
    
    // Step 2: Ensure we have a canvas reference
    let canvas = currentDrawingCanvasRef.current;
    if (!canvas) {
      canvas = canvasRefs.current[targetLayerId];
      if (canvas) {
        currentDrawingCanvasRef.current = canvas;
      }
    }
    if (!canvas) {
      console.log("No canvas found for existing layer, checking canvasRefs.current again...");
      return;
    }
    
    // Step 3: Start drawing!
    console.log("Starting drawing on existing layer");
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    draw(pos);
  };

  const draw = (pos: { x: number; y: number }) => {
    const canvas = currentDrawingCanvasRef.current;
    if (!canvas || !activeDrawingLayerId) {
      return;
    }
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

  const continueDrawing = (e: any) => {
    if (!isDrawing || activeTool === "select") return;
    e.preventDefault();
    draw(getCanvasPos(e));
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
    // Update layer's image data when drawing stops
    if (activeDrawingLayerId) {
      const canvas = currentDrawingCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          updateLayer(activeDrawingLayerId, { imageData }, true);
        }
      }
    }
    // Save state AFTER drawing is complete
    setTimeout(saveToHistory, 0);
  };

  // Set currentDrawingCanvasRef when activeDrawingLayerId changes
  useEffect(() => {
    console.log("activeDrawingLayerId changed:", activeDrawingLayerId);
    console.log("canvasRefs.current:", canvasRefs.current);
    if (activeDrawingLayerId && canvasRefs.current[activeDrawingLayerId]) {
      currentDrawingCanvasRef.current = canvasRefs.current[activeDrawingLayerId];
      console.log("Set currentDrawingCanvasRef:", currentDrawingCanvasRef.current);
    }
  }, [activeDrawingLayerId, layers]);

  // Ref to track last color and size for detecting changes
  const lastBrushColorRef = useRef(brushColor);
  const lastBrushSizeRef = useRef(brushSize[0]);

  // Ensure we have an active drawing layer if we're in brush/eraser mode
  useEffect(() => {
    console.log("activeTool changed:", activeTool);
    if ((activeTool === "brush" || activeTool === "eraser") && !activeDrawingLayerId) {
      console.log("Need to create or set active drawing layer for brush/eraser mode");
      // Check if we already have a drawing layer
      const existingDrawingLayer = layers.find(l => l.layerType === "drawing");
      if (existingDrawingLayer) {
        console.log("Found existing drawing layer, setting as active:", existingDrawingLayer.id);
        setActiveDrawingLayerId(existingDrawingLayer.id);
        setSelectedLayerId(existingDrawingLayer.id);
        // Set brush color/size to match the layer
        if (existingDrawingLayer.layerType === "drawing") {
          setBrushColor(existingDrawingLayer.color);
          setBrushSize([existingDrawingLayer.size]);
        }
      }
      // Don't create a new layer until user actually draws!
    }
  }, [activeTool, layers]);



  // Sync layer image data to canvas when layer changes
  useEffect(() => {
    layers.forEach(layer => {
      if (layer.layerType === "drawing") {
        const canvas = canvasRefs.current[layer.id];
        if (canvas) {
          // Convert image data to a string for comparison
          let imageDataStr = "empty";
          if (layer.imageData) {
            imageDataStr = layer.imageData.data.join(",");
          }
          
          // Only sync if the image data has changed
          if (lastSyncedImageData.current[layer.id] !== imageDataStr) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              if (layer.imageData) {
                ctx.putImageData(layer.imageData, 0, 0);
              }
            }
            lastSyncedImageData.current[layer.id] = imageDataStr;
          }
        }
      }
    });
  }, [layers]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setShowPresetsDropdown(false);
    };
    if (showPresetsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPresetsDropdown]);

  const clearCanvas = () => {
    saveToHistory();
    setLayers([]);
    setSelectedLayerId(null);
    setActiveDrawingLayerId(null);
  };

  const downloadDesign = async () => {
    try {
      const element = previewRef.current;
      if (!element) return;

      setIsDownloading(true);
      toast.info("Mempersiapkan unduhan...");

      // Temporarily save the selected layer ID to hide selection UI
      const prevSelectedLayerId = selectedLayerId;
      setSelectedLayerId(null);

      // Wait for React to update the DOM
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        backgroundColor: "#FFFFFF",
        scale: 2,
        useCORS: true,
      });

      // Restore the selected layer
      setSelectedLayerId(prevSelectedLayerId);
      setIsDownloading(false);

      const link = document.createElement("a");
      link.download = `desain-batik-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("Desain berhasil diunduh!");
    } catch (err) {
      console.error("Error downloading design:", err);
      setIsDownloading(false);
      // Restore selection even if there's an error
      setSelectedLayerId(selectedLayerId);
      toast.error("Gagal mengunduh desain. Silakan coba lagi.");
    }
  };

  const saveDesign = async () => {
    setIsSaving(true);
    try {
      // Convert drawing layers' ImageData to base64 or something serializable
      const serializableLayers = layers.map(layer => {
        if (layer.layerType === "drawing" && layer.imageData) {
          return {
            ...layer,
            imageData: {
              data: Array.from(layer.imageData.data),
              width: layer.imageData.width,
              height: layer.imageData.height
            }
          };
        }
        return layer;
      });
      
      const { error } = await supabase
        .from("custom_designs")
        .insert([{
          layers: serializableLayers,
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

  const toolConfig = {
    select: { cursor: "default" },
    brush: { cursor: "crosshair" },
    eraser: { cursor: "cell" },
  };

  // Mini pattern render untuk sidebar
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
              <>
                <circle cx="10" cy="6" r="4" fill="none" stroke="#8B6F47" strokeWidth="1" />
                <circle cx="10" cy="14" r="4" fill="none" stroke="#8B6F47" strokeWidth="1" />
              </>
            )}
            {(pattern.style_type === "mega" || pattern.style_type === "clouds" || pattern.style_type === "regional") && (
              <path d="M0,10 Q5,4 10,10 Q15,16 20,10" stroke="#8B6F47" strokeWidth="2" fill="none" />
            )}
            {(pattern.style_type === "truntum" || pattern.style_type === "stars") && (
              <polygon points="10,3 12,8 17,8 13,11 15,16 10,13 5,16 7,11 3,8 8,8" fill="#8B6F47" />
            )}
            {(pattern.style_type === "sekar" || pattern.style_type === "flowers") && (
              <>
                <circle cx="10" cy="10" r="2.5" fill="#D4B88B" />
                <circle cx="10" cy="4" r="3" fill="#8B6F47" opacity="0.8" />
                <circle cx="16" cy="10" r="3" fill="#8B6F47" opacity="0.8" />
                <circle cx="10" cy="16" r="3" fill="#8B6F47" opacity="0.8" />
                <circle cx="4" cy="10" r="3" fill="#8B6F47" opacity="0.8" />
              </>
            )}
            {(pattern.style_type === "sidomukti" || pattern.style_type === "geometric" || pattern.category === "wedding") && (
              <>
                <rect x="4" y="4" width="12" height="12" fill="none" stroke="#8B6F47" strokeWidth="1.5" />
                <rect x="7" y="7" width="6" height="6" fill="#D4B88B" opacity="0.5" />
              </>
            )}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#FAF8F5" }}>
      <BatikBackground opacity={0.03} patternType="kawung" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-4 pointer-events-none" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-4 pointer-events-none" style={{ background: "radial-gradient(circle, #8B6F47 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      <div className="container mx-auto px-4 py-10 relative z-10">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
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
          {/* ======= MAIN CANVAS AREA ======= */}
          <div className="lg:col-span-8 space-y-6">
            {/* Preview Canvas */}
            <div 
              className="rounded-3xl shadow-xl"
              style={{ border: "1px solid rgba(232, 225, 218, 0.8)", background: "#FFFFFF" }}
            >
              {/* Toolbar */}
              <div
                className="px-3 py-2 flex items-center justify-between gap-2"
                style={{ 
                  background: "#FFFFFF", 
                  borderBottom: "1px solid #E8E1DA",
                  position: "relative",
                  zIndex: 10000 
                }}
              >
                {/* Left: Tools */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {/* Tool Selector */}
                  <div className="flex items-center gap-0.5 p-1 rounded-lg" style={{ background: "#FAF8F5" }}>
                    {[
                      { tool: "select" as Tool, icon: ZoomOut, label: "Pilih" },
                      { tool: "brush" as Tool, icon: Brush, label: "Kuas" },
                      { tool: "eraser" as Tool, icon: Eraser, label: "Hapus" },
                    ].map(({ tool, icon: Icon, label }) => (
                      <motion.button
                        key={tool}
                        whileHover={{ scale: activeTool === tool ? 1 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          console.log("Tool clicked!", tool);
                          if (tool === "brush" || tool === "eraser") {
                            // Auto create drawing layer if none exists
                            if (!activeDrawingLayerId) {
                              console.log("Creating new drawing layer");
                              addDrawingLayer(true);
                            } else {
                              // Make sure currentDrawingCanvasRef is set
                              const existingCanvas = canvasRefs.current[activeDrawingLayerId];
                              if (existingCanvas) {
                                currentDrawingCanvasRef.current = existingCanvas;
                              }
                            }
                          }
                          setActiveTool(tool);
                        }}
                        className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-md transition-all duration-200"
                        style={{
                          background: activeTool === tool ? "#FFFFFF" : "transparent",
                          color: activeTool === tool ? "#8B6F47" : "#7A6B5E",
                          boxShadow: activeTool === tool ? "0 1px 3px rgba(61,43,31,0.1)" : "none",
                        }}
                        title={label}
                      >
                        <Icon className="w-4 h-4" />
                      </motion.button>
                    ))}
                  </div>

                  {/* Divider */}
                  {activeTool !== "select" && (
                    <div className="w-px h-7" style={{ background: "#E8E1DA" }} />
                  )}

                  {/* Brush Options (only show when brush/eraser is selected) */}
                  {activeTool !== "select" && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Color Picker */}
                      {activeTool === "brush" && (
                        <div className="flex items-center gap-1.5">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            style={{ padding: "1.5px", background: "linear-gradient(135deg, #8B6F47, #D4B88B)", borderRadius: "8px" }}
                          >
                            <input
                              type="color"
                              value={brushColor}
                              onChange={(e) => setBrushColor(e.target.value)}
                              className="w-7 h-7 rounded-md cursor-pointer border-0"
                            />
                          </motion.div>
                          <div className="flex gap-0.5">
                            {["#8B6F47", "#D4B88B", "#3D2B1F", "#6B3A1F", "#2A4B7C", "#2D5A2D"].map((c, idx) => (
                              <motion.button
                                key={idx}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setBrushColor(c)}
                                className="w-5 h-5 rounded-md border-2 transition-all"
                                style={{
                                  background: c,
                                  borderColor: brushColor === c ? "#8B6F47" : "transparent",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Size Slider */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Minus className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#7A6B5E" }} />
                        <input
                          type="range"
                          min="2"
                          max="80"
                          step="2"
                          value={brushSize[0]}
                          onChange={(e) => setBrushSize([Number(e.target.value)])}
                          className="w-20 h-1 rounded-md appearance-none cursor-pointer flex-shrink-0"
                          style={{
                            background: "rgba(139,111,71,0.2)",
                          }}
                        />
                        <Plus className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#7A6B5E" }} />
                        <span className="text-[10px] font-medium w-6 flex-shrink-0" style={{ color: "#3D2B1F" }}>{brushSize[0]}px</span>
                      </div>

                      {/* Opacity (only for brush) */}
                      {activeTool === "brush" && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs flex-shrink-0" style={{ color: "#7A6B5E" }}>Op:</span>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            step="5"
                            value={brushOpacity[0]}
                            onChange={(e) => setBrushOpacity([Number(e.target.value)])}
                            className="w-16 h-1 rounded-md appearance-none cursor-pointer flex-shrink-0"
                            style={{
                              background: "rgba(139,111,71,0.2)",
                            }}
                          />
                          <span className="text-xs font-medium flex-shrink-0" style={{ color: "#3D2B1F" }}>{brushOpacity[0]}%</span>
                        </div>
                      )}

                      {/* Brush Presets Dropdown (only for brush) */}
                      {activeTool === "brush" && (
                        <div className="relative flex-shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPresetsDropdown(!showPresetsDropdown);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-xs"
                            style={{ background: "#FAF8F5", color: "#8B6F47", border: "1px solid #E8E1DA" }}
                          >
                            <Palette className="w-3.5 h-3.5" />
                            Preset
                            <svg
                              className="w-3 h-3 transition-transform"
                              style={{ transform: showPresetsDropdown ? "rotate(180deg)" : "rotate(0deg)" }}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </motion.button>

                          {/* Dropdown Content */}
                          {showPresetsDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute top-full left-0 mt-2 w-60 p-3 rounded-xl shadow-xl"
                              style={{ 
                                background: "#FFFFFF", 
                                border: "1px solid #E8E1DA",
                                zIndex: 99999 
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-xs font-medium mb-2" style={{ color: "#7A6B5E" }}>Preset Kuas Batik</p>
                              <div className="space-y-1.5">
                                {brushPresets.map((preset, i) => (
                                  <motion.button
                                    key={i}
                                    whileHover={{ backgroundColor: "rgba(139,111,71,0.1)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      setBrushSize([preset.size]);
                                      setBrushOpacity([preset.opacity]);
                                      setBrushColor(preset.color);
                                      setShowPresetsDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all"
                                  >
                                    <div
                                      className="rounded-full"
                                      style={{
                                        width: Math.min(preset.size / 2, 14),
                                        height: Math.min(preset.size / 2, 14),
                                        background: preset.color,
                                        opacity: preset.opacity / 100,
                                        minWidth: 7,
                                        minHeight: 7,
                                        border: "2px solid rgba(139,111,71,0.2)",
                                      }}
                                    />
                                    <span className="text-xs font-medium" style={{ color: "#3D2B1F" }}>{preset.name}</span>
                                  </motion.button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    style={{ background: "#FAF8F5", color: "#8B6F47", border: "1px solid #E8E1DA" }}
                    title="Undo (Ctrl+Z)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    style={{ background: "#FAF8F5", color: "#8B6F47", border: "1px solid #E8E1DA" }}
                    title="Redo (Ctrl+Y)"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      clearCanvas();
                      setTimeout(saveToHistory, 0);
                    }}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all flex-shrink-0"
                    style={{ background: "#FAF8F5", color: "#dc2626", border: "1px solid #E8E1DA" }}
                    title="Clear Canvas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {activeTool === "select" && (
                    <>
                      <div className="w-px h-7" style={{ background: "#E8E1DA" }} />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={saveDesign}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-md transition-all text-xs disabled:opacity-50 font-medium flex-shrink-0"
                        style={{ background: "#FAF8F5", color: "#8B6F47", border: "1px solid #E8E1DA" }}
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Simpan
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={downloadDesign}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-md transition-all text-xs font-semibold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #8B6F47, #A88967)", color: "#FFFFFF" }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              {/* Canvas Layer */}
              <div
                ref={previewRef}
                className="aspect-[4/3] relative overflow-hidden select-none group"
                style={{ background: "#FFFFFF" }}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onClick={handleCanvasClick}
              >
                {/* Render semua layer di canvas */}
                {[...layers]
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((layer) => {
                    if (layer.layerType === "pattern") {
                      // Add default properties if missing
                      const itemWithDefaults = {
                        borderRadius: 0,
                        width: 200,
                        height: 200,
                        ...layer,
                      };

                      return (
                        <div
                                key={itemWithDefaults.id}
                                className="absolute"
                                style={{
                                  width: itemWithDefaults.width,
                                  height: itemWithDefaults.height,
                                  transformOrigin: "center",
                                  zIndex: itemWithDefaults.zIndex,
                                  transform: `translate(${itemWithDefaults.position.x}px, ${itemWithDefaults.position.y}px) rotate(${itemWithDefaults.rotation}deg)`,
                                  pointerEvents: (activeTool === "select" || !isDrawing) ? "auto" : "none",
                                  transition: "none",
                                }}
                                onMouseDown={(e) => handleItemMouseDown(e, itemWithDefaults)}
                                onClick={handleItemClick}
                              >
                          {/* Selected border and handles (rotate with item) */}
                          {selectedLayerId === itemWithDefaults.id && (
                            <>
                              {/* Selection border */}
                              <div 
                                className="absolute inset-0 border-2 border-dashed rounded-xl pointer-events-none"
                                style={{ borderColor: "#8B6F47", borderRadius: `${itemWithDefaults.borderRadius}px` }}
                              />

                              {/* Rotation handle */}
                              <div
                                className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full cursor-grab pointer-events-auto flex items-center justify-center"
                                style={{
                                  background: "#8B6F47",
                                  border: "2px solid white",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                  zIndex: 1001,
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleRotationMouseDown(e, itemWithDefaults);
                                }}
                              >
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  xmlns="http://www.w3.org/2000/svg"
                                  style={{ pointerEvents: "none" }}
                                >
                                  <path 
                                    d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07" 
                                    stroke="white" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>

                          {/* Resize handles */}
                          {[
                            { pos: "top-left", cursor: "nwse-resize", style: { top: -6, left: -6 } },
                            { pos: "top-right", cursor: "nesw-resize", style: { top: -6, right: -6 } },
                            { pos: "bottom-left", cursor: "nesw-resize", style: { bottom: -6, left: -6 } },
                            { pos: "bottom-right", cursor: "nwse-resize", style: { bottom: -6, right: -6 } },
                            { pos: "top", cursor: "ns-resize", style: { top: -6, left: "50%", transform: "translateX(-50%)" } },
                            { pos: "bottom", cursor: "ns-resize", style: { bottom: -6, left: "50%", transform: "translateX(-50%)" } },
                            { pos: "left", cursor: "ew-resize", style: { left: -6, top: "50%", transform: "translateY(-50%)" } },
                            { pos: "right", cursor: "ew-resize", style: { right: -6, top: "50%", transform: "translateY(-50%)" } },
                          ].map(({ pos, cursor, style }) => (
                            <div
                              key={pos}
                              className="absolute w-3 h-3 rounded-full cursor-pointer pointer-events-auto"
                              style={{
                                ...style,
                                background: "#8B6F47",
                                border: "2px solid white",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                zIndex: 1000,
                                cursor: cursor,
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleResizeMouseDown(e, itemWithDefaults, pos);
                              }}
                            />
                          ))}

                          {/* Floating toolbar (does NOT rotate with item) */}
                          <div 
                            className="absolute inset-0 pointer-events-none"
                          >
                            <div
                              className="absolute -top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg pointer-events-auto"
                              style={{
                                background: "#FFFFFF",
                                border: "1px solid rgba(139,111,71,0.2)",
                                zIndex: 1000,
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                            >
                              {/* Corner radius slider */}
                              <div className="flex items-center gap-2">
                                <Maximize2 className="w-3 h-3" style={{ color: "#8B6F47" }} />
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="2"
                                  value={itemWithDefaults.borderRadius}
                                  onInput={(e) => updateLayer(itemWithDefaults.id, { borderRadius: Number(e.target.value) })}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                  }}
                                  onMouseMove={(e) => {
                                    e.stopPropagation();
                                  }}
                                  onMouseUp={(e) => {
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                  style={{
                                    width: 80,
                                    height: 12,
                                    appearance: "none",
                                    background: "rgba(139,111,71,0.2)",
                                    borderRadius: 6,
                                    cursor: "grab",
                                  }}
                                />
                                <style>{`
                                  input[type="range"]::-webkit-slider-thumb {
                                    appearance: none;
                                    width: 16px;
                                    height: 16px;
                                    border-radius: 50%;
                                    background: #8B6F47;
                                    cursor: grab;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                  }
                                  input[type="range"]::-moz-range-thumb {
                                    width: 16px;
                                    height: 16px;
                                    border-radius: 50%;
                                    background: #8B6F47;
                                    cursor: grab;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                    border: none;
                                  }
                                `}</style>
                              </div>

                              {/* Divider */}
                              <div className="w-px h-6 mx-1" style={{ background: "rgba(139,111,71,0.2)" }} />

                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  deleteSelectedLayer();
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* The pattern SVG */}
                      <div 
                        className="w-full h-full overflow-hidden"
                        style={{ 
                          borderRadius: `${itemWithDefaults.borderRadius}px`,
                          boxShadow: selectedLayerId === itemWithDefaults.id ? "0 0 0 3px rgba(139,111,71,0.2)" : "none"
                        }}
                      >
                        {renderItemSVG(itemWithDefaults)}
                      </div>
                    </div>
                  );
                    } else if (layer.layerType === "drawing") {
                      // Render only if active OR has image data
                      const shouldRender = activeDrawingLayerId === layer.id || layer.imageData !== null;
                      if (!shouldRender) {
                        return null;
                      }
                      
                      return (
                        <canvas
                              key={layer.id}
                              ref={(el) => {
                                if (el) {
                                  canvasRefs.current[layer.id] = el;
                                  if (activeDrawingLayerId === layer.id) {
                                    currentDrawingCanvasRef.current = el;
                                  }
                                }
                              }}
                              width={800}
                              height={600}
                              className="absolute inset-0 w-full h-full"
                              style={{
                                cursor: activeDrawingLayerId === layer.id && activeTool !== "select" ? toolConfig[activeTool].cursor : "default",
                                touchAction: "none",
                                zIndex: layer.zIndex,
                                pointerEvents: (activeTool === "select") ? "none" : (activeDrawingLayerId === layer.id ? "auto" : "none"),
                              }}
                              onMouseDown={startDrawing}
                              onMouseMove={continueDrawing}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={continueDrawing}
                              onTouchEnd={stopDrawing}
                            />
                      );
                    }
                  })}

                {/* Tool indicator */}
                {activeTool !== "select" && !isDownloading && (
                  <div
                    className="absolute bottom-5 left-5 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                    style={{ background: "rgba(61,43,31,0.9)", color: "#D4B88B", fontSize: "0.8rem", backdropFilter: "blur(10px)", border: "1px solid rgba(212,184,139,0.3)", zIndex: 1000 }}
                  >
                    {activeTool === "brush" ? <Brush className="w-4 h-4" /> : <Eraser className="w-4 h-4" />}
                    <span className="font-medium">{activeTool === "brush" ? "Mode Kuas Aktif" : "Mode Hapus Aktif"}</span>
                    <span className="h-4 w-px" style={{ background: "rgba(212,184,139,0.4)" }}></span>
                    <span style={{ color: "rgba(212,184,139,0.8)" }}>Ukuran: {brushSize[0]}px</span>
                  </div>
                )}

                {/* Empty state */}
                {layers.length === 0 && !isDownloading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ color: "#A89B8F" }}>
                    <Layers className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Kanvas Kosong</p>
                    <p className="text-sm opacity-70">Klik motif di sidebar untuk memulai</p>
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* ======= SIDEBAR ======= */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-3xl shadow-xl overflow-hidden"
              style={{ border: "1px solid #E8E1DA", background: "#FFFFFF" }}
            >
              <Tabs defaultValue="pattern">
                <div className="p-5 pb-0" style={{ background: "#FFFFFF" }}>
                  <TabsList className="grid w-full grid-cols-3 p-1 rounded-2xl" style={{ background: "rgba(139,111,71,0.08)" }}>
                    <TabsTrigger value="pattern" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                      Tambah Motif
                    </TabsTrigger>
                    <TabsTrigger value="color" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                      Preset
                    </TabsTrigger>
                    <TabsTrigger value="layer" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                      Layer
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="pattern" className="p-5 m-0" style={{ background: "#FFFFFF" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-4 h-4" style={{ color: "#8B6F47" }} />
                    <p style={{ color: "#7A6B5E", fontSize: "0.8rem" }}>Klik untuk menambah motif ke kanvas</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
                    {loading ? (
                      [...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-36 rounded-2xl" />
                      ))
                    ) : patterns.map((pattern) => (
                      <motion.button
                        key={pattern.id}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => addItemToCanvas(pattern)}
                        className="p-3 rounded-2xl border-2 transition-all text-left"
                        style={{
                          borderColor: "rgba(139,111,71,0.15)",
                          background: "rgba(250,248,245,0.8)",
                        }}
                      >
                        {/* Mini pattern preview */}
                        <div
                          className="w-full h-12 rounded-xl mb-3 overflow-hidden"
                          style={{ background: "#FAF8F5", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)" }}
                        >
                          {renderMiniPattern(pattern)}
                        </div>
                        <div style={{ color: "#3D2B1F", fontSize: "0.85rem", fontWeight: 600, marginBottom: "2px" }}>{pattern.name}</div>
                        <div style={{ color: "#A89B8F", fontSize: "0.75rem" }}>{pattern.description}</div>
                        <div className="mt-2 text-xs font-medium" style={{ color: "#8B6F47" }}>
                          + Tambah ke kanvas
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="color" className="p-5 m-0" style={{ background: "#FFFFFF" }}>
                  {/* Global Color Presets */}
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-4 h-4" style={{ color: "#8B6F47" }} />
                    <p style={{ color: "#7A6B5E", fontSize: "0.8rem" }}>Preset palet warna batik</p>
                  </div>
                  <div className="space-y-3">
                    {colorPresets.map((preset, i) => {
                      const selectedLayer = layers.find(layer => layer.id === selectedLayerId && layer.layerType === "pattern");
                      const isActive = selectedLayer && 
                        Object.keys(preset.colors).every(key => 
                          preset.colors[key as keyof typeof preset.colors] === 
                          selectedLayer.colors[key as keyof typeof selectedLayer.colors]
                        );
                      
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (selectedLayerId) {
                              updateLayer(selectedLayerId, { colors: preset.colors });
                            }
                          }}
                          className="w-full p-3 rounded-2xl border text-left"
                          style={{ 
                            border: isActive 
                              ? "2px solid #8B6F47" 
                              : "1px solid rgba(139,111,71,0.15)", 
                            background: isActive 
                              ? "rgba(139,111,71,0.1)" 
                              : "rgba(250,248,245,0.6)",
                            cursor: selectedLayerId ? "pointer" : "not-allowed",
                            opacity: selectedLayerId ? 1 : 0.5
                          }}
                        >
                          <div className="flex gap-1 mb-2">
                            {Object.values(preset.colors).map((c, ci) => (
                              <div key={ci} className="w-8 h-8 rounded-xl" style={{ background: c, border: "1px solid rgba(0,0,0,0.05)" }} />
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <div style={{ color: "#3D2B1F", fontSize: "0.85rem", fontWeight: 600 }}>{preset.name}</div>
                            {isActive && (
                              <div className="flex items-center gap-1" style={{ color: "#8B6F47" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M5 13l4 4L19 7" stroke="#8B6F47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>Terpilih</span>
                              </div>
                            )}
                          </div>
                          <div style={{ color: "#A89B8F", fontSize: "0.75rem" }}>
                            {selectedLayerId ? "Klik untuk terapkan ke layer terpilih" : "Pilih layer terlebih dahulu"}
                          </div>
                        </button>
                      );
                    })}
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
                      {[...layers]
                        .sort((a, b) => b.zIndex - a.zIndex)
                        .map((layer) => {
                          const pattern = layer.layerType === "pattern" ? patterns.find(p => p.id === layer.patternId) : null;
                          return (
                            <motion.div
                              key={layer.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              whileHover={{ scale: 1.01 }}
                              onClick={() => {
                                setSelectedLayerId(layer.id);
                                if (layer.layerType === "pattern") {
                                  setActiveTool("select");
                                } else {
                                  setActiveDrawingLayerId(layer.id);
                                  setBrushColor(layer.color);
                                  setBrushSize([layer.size]);
                                  // Set the drawing layer to top z‑index
                                  updateLayer(layer.id, { zIndex: nextZIndex });
                                  setNextZIndex(nextZIndex + 1);
                                  // Also set the last refs so we don't trigger a new layer creation
                                  lastBrushColorRef.current = layer.color;
                                  lastBrushSizeRef.current = layer.size;
                                }
                              }}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                                selectedLayerId === layer.id
                                  ? "border-[#8B6F47] bg-[rgba(139,111,71,0.08)]"
                                  : "border-[rgba(139,111,71,0.15)] bg-[rgba(250,248,245,0.6)]"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Mini preview */}
                                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#FAF8F5", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)" }}>
                                  {layer.layerType === "pattern" ? (() => {
                                    const id = `layer-preview-${layer.id}`;
                                    return (
                                      <svg width="100%" height="100%">
                                        <defs>
                                          <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <rect fill={layer.colors.background || "#FAF8F5"} width="20" height="20" />
                                            {(layer.type === "parang" || layer.type === "traditional" || layer.type === "diagonal-lines") && (
                                              <path d="M0,10 Q5,5 10,10 Q15,15 20,10" stroke={layer.colors.primary} strokeWidth="1.5" fill="none" />
                                            )}
                                            {(layer.type === "kawung" || layer.type === "circles") && (
                                              <>
                                                <circle cx="10" cy="6" r="4" fill="none" stroke={layer.colors.primary} strokeWidth="1" />
                                                <circle cx="10" cy="14" r="4" fill="none" stroke={layer.colors.primary} strokeWidth="1" />
                                              </>
                                            )}
                                            {(layer.type === "mega" || layer.type === "clouds" || layer.type === "regional") && (
                                              <path d="M0,10 Q5,4 10,10 Q15,16 20,10" stroke={layer.colors.primary} strokeWidth="2" fill="none" />
                                            )}
                                            {(layer.type === "truntum" || layer.type === "stars") && (
                                              <polygon points="10,3 12,8 17,8 13,11 15,16 10,13 5,16 7,11 3,8 8,8" fill={layer.colors.primary} />
                                            )}
                                            {(layer.type === "sekar" || layer.type === "flowers") && (
                                              <>
                                                <circle cx="10" cy="10" r="2.5" fill={layer.colors.secondary} />
                                                <circle cx="10" cy="4" r="3" fill={layer.colors.primary} opacity="0.8" />
                                                <circle cx="16" cy="10" r="3" fill={layer.colors.primary} opacity="0.8" />
                                                <circle cx="10" cy="16" r="3" fill={layer.colors.primary} opacity="0.8" />
                                                <circle cx="4" cy="10" r="3" fill={layer.colors.primary} opacity="0.8" />
                                              </>
                                            )}
                                          </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill={`url(#${id})`} />
                                      </svg>
                                    );
                                  })() : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: layer.color }}>
                                      <Brush className="w-5 h-5" style={{ color: "#FFFFFF", opacity: 0.8 }} />
                                    </div>
                                  )}
                                </div>

                                {/* Layer name & controls */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate" style={{ color: "#3D2B1F" }}>
                                    {layer.layerType === "pattern" ? (pattern?.name || `Motif ${layer.patternId}`) : layer.name}
                                  </p>
                                  {layer.layerType === "drawing" && (
                                    <p className="text-xs" style={{ color: "#7A6B5E" }}>
                                      Ukuran: {layer.size}px
                                      {activeDrawingLayerId === layer.id && (
                                        <span className="ml-2" style={{ color: "#8B6F47" }}>Aktif</span>
                                      )}
                                    </p>
                                  )}
                                </div>

                                {/* Reorder & delete buttons */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveLayerUp(layer.id);
                                    }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-[rgba(139,111,71,0.1)]"
                                    style={{ color: "#8B6F47" }}
                                    title="Pindahkan ke atas"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18 15l-6-6-6 6" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveLayerDown(layer.id);
                                    }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-[rgba(139,111,71,0.1)]"
                                    style={{ color: "#8B6F47" }}
                                    title="Pindahkan ke bawah"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M6 9l6 6 6-6" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLayers(layers.filter(i => i.id !== layer.id));
                                      if (selectedLayerId === layer.id) setSelectedLayerId(null);
                                      if (activeDrawingLayerId === layer.id) setActiveDrawingLayerId(null);
                                      setTimeout(saveToHistory, 0);
                                    }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-[rgba(220,38,38,0.1)]"
                                    style={{ color: "#dc2626" }}
                                    title="Hapus layer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Order CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="rounded-3xl p-7 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #3D2B1F 0%, #5A3E2A 100%)", boxShadow: "0 10px 40px rgba(61,43,31,0.4)" }}
            >
              <BatikBackground opacity={0.15} patternType="kawung" />
              
              {/* Decorative circle */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #D4B88B 0%, transparent 70%)" }} />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(212,184,139,0.2)", border: "1px solid rgba(212,184,139,0.3)" }}
                  >
                    <Layers className="w-6 h-6" style={{ color: "#D4B88B" }} />
                  </div>
                  <h3 style={{ color: "#D4B88B", fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 600 }}>
                    Desain Siap?
                  </h3>
                </div>
                <p className="mb-6" style={{ color: "rgba(250,248,245,0.75)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                  Wujudkan desain digital Anda menjadi kain batik asli, dikerjakan oleh pengrajin terpilih dari Desa Jetis.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-7">
                  {[
                    { label: "Bahan", value: "Katun Prima" },
                    { label: "Proses", value: "3-7 Hari" },
                    { label: "Ukuran", value: "2.5m × 1.15m" },
                    { label: "Pengrajin", value: "Desa Jetis" },
                  ].map((info, i) => (
                    <div key={i} className="p-3 rounded-2xl" style={{ background: "rgba(212,184,139,0.12)", border: "1px solid rgba(212,184,139,0.2)" }}>
                      <div style={{ color: "rgba(250,248,245,0.6)", fontSize: "0.7rem", marginBottom: "3px", fontWeight: 500 }}>{info.label}</div>
                      <div style={{ color: "#D4B88B", fontSize: "0.85rem", fontWeight: 600 }}>{info.value}</div>
                    </div>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 30px rgba(212,184,139,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl transition-all font-semibold text-lg"
                  style={{ background: "linear-gradient(135deg, #D4B88B, #E8DCC8)", color: "#3D2B1F" }}
                >
                  Pesan Sekarang
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
