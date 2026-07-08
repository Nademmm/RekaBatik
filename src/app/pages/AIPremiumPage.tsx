import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useLocation } from "react-router";
import { 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  Wand2, 
  Zap, 
  ShieldCheck, 
  Maximize2,
  RefreshCw,
  Download,
  Check,
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export function AIPremiumPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const designImage = location.state?.designImage;
  const designData = location.state?.designData;

  const [step, setStep] = useState<"analyzing" | "improving" | "result">("analyzing");
  const [progress, setProgress] = useState(0);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (!designImage) {
      toast.error("Data desain tidak ditemukan");
      navigate("/custom");
      return;
    }

    // Simulasi Alur AI
    if (step === "analyzing") {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setStep("improving");
              setProgress(0);
            }, 500);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }

    if (step === "improving") {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setStep("result");
            }, 800);
            return 100;
          }
          return prev + 1;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [step, designImage, navigate]);

  const handleApply = () => {
    toast.success("Desain premium berhasil diterapkan!");
    
    // Terapkan hasil AI (improvedDesign) ke kanvas, dan pastikan kita 
    // mengirim `designId` agar bisa menimpa desain yang sama di database.
    navigate("/custom", { 
      state: { 
        improvedDesign: designData,
        improvedDesignId: location.state?.designId 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 px-4 h-16 flex items-center justify-between">
        <button 
          onClick={() => navigate("/custom")}
          className="flex items-center gap-2 text-[#3D2B1F] font-semibold hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Kembali ke Editor</span>
        </button>
        
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8B6F47]/10 border border-[#8B6F47]/20">
          <Sparkles className="w-4 h-4 text-[#8B6F47]" />
          <span className="text-[10px] sm:text-xs font-bold text-[#8B6F47] uppercase tracking-wider">AI Premium Smart Enhance</span>
        </div>

        <div className="w-24 flex justify-end">
           <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
             <Info className="w-4 h-4 text-stone-400" />
           </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-8 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {step === "analyzing" && (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center w-full max-w-md"
            >
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-[#8B6F47]/20 animate-ping" />
                <div className="relative w-full h-full rounded-full bg-white shadow-xl flex items-center justify-center border border-[#8B6F47]/30">
                  <RefreshCw className="w-12 h-12 text-[#8B6F47] animate-spin-slow" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>Menganalisis Desain...</h2>
              <p className="text-[#7A6B5E] mb-8 text-sm sm:text-base leading-relaxed">AI sedang memindai komposisi motif, harmoni warna, dan ritme pola batik Anda untuk mencari potensi peningkatan estetika.</p>
              
              <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#8B6F47] to-[#D4B88B]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-4 text-sm font-black text-[#8B6F47]">{progress}% COMPLETE</p>
            </motion.div>
          )}

          {step === "improving" && (
            <motion.div 
              key="improving"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center w-full max-w-2xl"
            >
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl mb-10 bg-white border-4 border-white">
                <img src={designImage} alt="Original" className="w-full h-full object-contain opacity-40 grayscale blur-[1px]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#3D2B1F]/10">
                  <div className="flex gap-4">
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        animate={{ 
                          scale: [1, 1.4, 1],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{ 
                          duration: 1.2, 
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                        className="w-5 h-5 rounded-full bg-[#8B6F47] shadow-[0_0_15px_rgba(139,111,71,0.5)]"
                      />
                    ))}
                  </div>
                  <p className="mt-8 text-white font-black text-xl sm:text-2xl tracking-[0.2em] uppercase drop-shadow-lg">Optimizing Aesthetics</p>
                </div>
                
                {/* Scanning line */}
                <motion.div 
                  className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#D4B88B] to-transparent shadow-[0_0_20px_rgba(212,184,139,0.9)]"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black mb-4" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>Menyeimbangkan Karya</h2>
              <p className="text-[#7A6B5E] mb-10 max-w-lg mx-auto leading-relaxed">Menyesuaikan kontras mikro dan menghaluskan transisi antar motif untuk menciptakan alur visual yang lebih elegan.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                {[
                  { label: "Harmony Balance", icon: ShieldCheck, desc: "Menyeimbangkan saturasi warna" },
                  { label: "Rhythm Flow", icon: Zap, desc: "Mengatur ritme pengulangan motif" },
                  { label: "Contrast Map", icon: Maximize2, desc: "Mempertajam detail garis batik" },
                  { label: "Artistic Edge", icon: Wand2, desc: "Memberikan sentuhan akhir premium" },
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-stone-100 shadow-sm text-left"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#8B6F47]/5 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-[#8B6F47]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#3D2B1F]">{item.label}</p>
                      <p className="text-[10px] text-[#8E7F72]">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === "result" && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-10 order-2 lg:order-1">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 mb-6">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Optimasi Selesai</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-[1.1]" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                      Karya Batik <br />Semakin Sempurna
                    </h1>
                    <p className="text-lg text-[#7A6B5E] leading-relaxed max-w-md">AI Smart Enhance telah memberikan sentuhan profesional pada komposisi batik Anda. Siap untuk diproduksi dengan standar kualitas tertinggi.</p>
                  </div>

                  <div className="space-y-5">
                    {[
                      { title: "Motif Teroptimasi", desc: "Penyesuaian tata letak otomatis untuk keseimbangan visual" },
                      { title: "Palet Warna Premium", desc: "Kontras warna ditingkatkan sesuai standar tekstil elit" },
                      { title: "Detail Garis Tajam", desc: "Pembersihan artefak visual pada elemen kustom" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="mt-1 w-6 h-6 rounded-full bg-[#8B6F47] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#8B6F47]/30">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                           <p className="font-black text-[#3D2B1F] mb-0.5">{item.title}</p>
                           <p className="text-sm text-[#8E7F72]">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button 
                      onClick={handleApply}
                      className="h-16 px-10 rounded-[1.25rem] font-black text-lg shadow-2xl shadow-[#8B6F47]/40 bg-[#8B6F47] hover:bg-[#6B4F2F] transition-all hover:-translate-y-1"
                    >
                      Terapkan ke Editor
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/custom")}
                      className="h-16 px-10 rounded-[1.25rem] font-bold border-2 border-stone-200 hover:bg-stone-50 text-stone-600 transition-all"
                    >
                      Batal
                    </Button>
                  </div>
                </div>

                <div className="relative order-1 lg:order-2">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="relative z-10"
                  >
                    <div className="absolute -inset-6 bg-gradient-to-tr from-[#8B6F47]/30 to-transparent rounded-[3rem] blur-3xl opacity-50" />
                    <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_rgba(61,43,31,0.2)] border-[12px] border-white bg-white">
                      <img src={designImage} alt="Improved Design" className="w-full h-full object-contain" />
                      
                      <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                        <motion.div 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="px-5 py-2.5 rounded-full bg-white/95 backdrop-blur-md shadow-xl border border-white/50 flex items-center gap-3"
                        >
                          <Sparkles className="w-4 h-4 text-[#8B6F47]" />
                          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#3D2B1F]">AI Optimized Result</span>
                        </motion.div>
                        
                        <button 
                          onClick={() => setShowComparison(!showComparison)}
                          className="w-14 h-14 rounded-2xl bg-[#3D2B1F] text-white flex items-center justify-center hover:bg-black transition-all shadow-xl active:scale-95"
                        >
                          <RefreshCw className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4B88B]/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#8B6F47]/10 rounded-full blur-3xl" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
