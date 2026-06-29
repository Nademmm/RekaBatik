import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Minus, Plus, Loader2, ShoppingBag } from "lucide-react";
import { BatikItem } from "../../types/database";
import { ImageWithFallback } from "./ImageWithFallback";

// ── Pattern Renderer ────────────────────────────────────────────────────────
export function PatternMini({ primary, secondary, bg, type }: { primary: string; secondary: string; bg: string; type: string }) {
  const id = `cat-${type}-${Math.random().toString(36).substr(2, 5)}`;
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect fill={bg} width="40" height="40" />
          {type === "diagonal" && (<><path d="M0,20 Q10,10 20,20 Q30,30 40,20" stroke={primary} strokeWidth="2.5" fill="none" /><path d="M0,30 Q10,20 20,30 Q30,40 40,30" stroke={secondary} strokeWidth="1.5" fill="none" /><path d="M0,10 Q10,0 20,10 Q30,20 40,10" stroke={secondary} strokeWidth="1.5" fill="none" /></>)}
          {type === "kawung" && (<><ellipse cx="20" cy="11" rx="5" ry="8" fill="none" stroke={primary} strokeWidth="1.5" /><ellipse cx="20" cy="29" rx="5" ry="8" fill="none" stroke={primary} strokeWidth="1.5" /><ellipse cx="11" cy="20" rx="8" ry="5" fill="none" stroke={primary} strokeWidth="1.5" /><ellipse cx="29" cy="20" rx="8" ry="5" fill="none" stroke={primary} strokeWidth="1.5" /><circle cx="20" cy="20" r="2.5" fill={secondary} /></>)}
          {type === "cloud" && (<><path d="M0,20 Q10,8 20,20 Q30,32 40,20" stroke={primary} strokeWidth="3" fill="none" /><path d="M0,20 Q10,8 20,20 Q30,32 40,20" stroke={secondary} strokeWidth="1.5" fill="none" transform="translate(0,-7)" /></>)}
          {type === "star" && (<polygon points="20,6 23,14 32,14 25,20 28,28 20,22 12,28 15,20 8,14 17,14" fill={primary} stroke={secondary} strokeWidth="1" />)}
          {type === "flower" && (<><circle cx="20" cy="20" r="3.5" fill={secondary} /><circle cx="20" cy="9" r="5" fill={primary} opacity="0.85" /><circle cx="31" cy="20" r="5" fill={primary} opacity="0.85" /><circle cx="20" cy="31" r="5" fill={primary} opacity="0.85" /><circle cx="9" cy="20" r="5" fill={primary} opacity="0.85" /></>)}
          {type === "geo" && (<><rect x="8" y="8" width="24" height="24" fill="none" stroke={primary} strokeWidth="2" /><rect x="14" y="14" width="12" height="12" fill="none" stroke={secondary} strokeWidth="1.5" /><rect x="17" y="17" width="6" height="6" fill={secondary} opacity="0.6" /></>)}
          {type === "default" && (<><path d="M0,20 Q10,10 20,20 Q30,30 40,20" stroke={primary} strokeWidth="2" fill="none" /><circle cx="10" cy="20" r="3" fill={secondary} opacity="0.6" /><circle cx="30" cy="20" r="3" fill={secondary} opacity="0.6" /></>)}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function getPatternType(styleType: string | undefined): string {
  const map: Record<string, string> = { 
    "parang": "diagonal", 
    "parang-new": "diagonal", 
    "mega": "cloud", 
    "sido-mukti": "geo", 
    "bunga1": "flower", 
    "bunga2": "flower", 
    "ceplok": "geo" 
  };
  return styleType ? (map[styleType] || "default") : "default";
}

// ── Detail Modal Component ──────────────────────────────────────────────────
export function BatikDetailModal({ 
  item, 
  onClose,
  onAddToCart,
  isAdding 
}: { 
  item: BatikItem; 
  onClose: () => void;
  onAddToCart: (item: BatikItem, qty: number) => void;
  isAdding: boolean;
}) {
  const [qty, setQty] = useState(1);
  const patternType = getPatternType(item.style_type);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
      style={{ background: "rgba(30, 20, 10, 0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-5xl max-h-[90dvh] overflow-hidden flex flex-col md:flex-row relative min-h-0"
        style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button (Absolute Top Right) */}
        <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 z-50 w-8 h-8 md:w-10 md:h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center shadow-sm transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-600 hover:text-gray-900" />
        </button>

        {/* Left Side: Big Pattern Visual */}
        <div
          className="w-full md:w-1/2 relative flex-shrink-0 overflow-hidden h-[clamp(11rem,32dvh,15rem)] sm:h-[clamp(12rem,34dvh,16rem)] md:h-auto md:min-h-0 md:self-stretch"
          style={{ background: item.bg_color }}
        >
          {item.image_url ? (
            <ImageWithFallback
              src={item.image_url} 
              alt={item.name} 
              className="w-full h-full object-cover md:absolute md:inset-0"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <PatternMini primary={item.primary_color} secondary={item.secondary_color} bg={item.bg_color} type={patternType} />
          )}
          
          {item.category && (
            <div className="absolute top-3 left-3 sm:top-6 sm:left-6 flex flex-col gap-2 z-10">
              <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-white/90 text-gray-800 shadow-sm backdrop-blur-md">
                {item.category}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Details & Actions */}
        <div className="w-full md:w-1/2 flex flex-col flex-1 min-h-0 bg-white md:min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 pr-8 sm:pr-10 md:pr-0" style={{ color: "#A89B8F" }}>
              {item.category && (
                <>
                  <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">{item.category}</span>
                  <span className="text-xs sm:text-sm">•</span>
                </>
              )}
              <span className="text-xs sm:text-sm">Motif Eksklusif</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 pr-6 sm:pr-8 md:pr-0" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>
              {item.name}
            </h2>

            <div className="flex flex-wrap items-center gap-4 mb-5 sm:mb-8">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Pengerjaan</span>
                <span className="font-bold text-gray-800 text-sm sm:text-base">3-5 Hari</span>
              </div>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base" style={{ color: "#3D2B1F" }}>Deskripsi Filosofi</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  {item.description}
                  <br/><br/>
                  Dibuat oleh pengrajin terbaik dari {item.origin}, motif ini membawa doa dan harapan bagi pemakainya. Perpaduan warna yang dipilih ({item.primary_color} dan {item.secondary_color}) menggambarkan keseimbangan dan harmoni.
                </p>
              </div>

              {/* Color Palette Display */}
              <div>
                <h3 className="font-semibold mb-3 text-sm" style={{ color: "#3D2B1F" }}>Palet Warna Utama</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { c: item.primary_color, l: "Utama" },
                    { c: item.secondary_color, l: "Aksen" },
                    { c: item.bg_color, l: "Dasar" }
                  ].map((color, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border shadow-sm flex items-center justify-center" style={{ backgroundColor: color.c, borderColor: "rgba(0,0,0,0.1)" }}>
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white/40 mix-blend-overlay" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{color.l}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Sticky Footer: Price & Add to Cart */}
          <div className="p-4 sm:p-5 md:p-6 bg-white border-t z-10 flex-shrink-0" style={{ borderColor: "rgba(212,184,139,0.2)" }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              
              <div className="min-w-0 sm:min-w-[120px]">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#A89B8F" }}>Total Harga</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: "#3D2B1F" }}>
                  Rp {(item.price * qty).toLocaleString("id-ID")}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto sm:flex-1 sm:justify-end">
                {/* Qty Control */}
                <div className="flex items-center rounded-xl bg-gray-50 border border-gray-200 flex-shrink-0">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2 sm:p-2.5 md:p-3 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-30" disabled={qty <= 1}>
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 md:w-8 text-center font-bold text-gray-800 text-sm sm:text-base">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(10, q + 1))} className="p-2 sm:p-2.5 md:p-3 text-gray-500 hover:text-gray-800 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add Button */}
                <motion.button
                  whileHover={{ scale: isAdding ? 1 : 1.02 }}
                  whileTap={{ scale: isAdding ? 1 : 0.98 }}
                  onClick={() => onAddToCart(item, qty)}
                  disabled={isAdding}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:px-5 md:px-6 md:py-3.5 rounded-xl font-semibold text-white shadow-lg disabled:opacity-70 text-sm md:text-base min-w-0"
                  style={{ background: "linear-gradient(135deg, #3D2B1F, #5A3D2B)" }}
                >
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingBag className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /> <span className="truncate">Masukkan Keranjang</span></>}
                </motion.button>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
