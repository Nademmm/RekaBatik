import { useRouteError, Link } from "react-router";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { BatikBackground } from "./BatikBackground";

export function ErrorPage() {
  const error: any = useRouteError();
  console.error(error);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: "linear-gradient(135deg, #FBF5E6, #F5E6C0)" }}>
      <BatikBackground opacity={0.05} patternType="kawung" />
      
      <div className="max-w-md w-full text-center relative z-10 p-8 rounded-3xl bg-white/80 backdrop-blur-sm shadow-2xl border border-amber-100">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D1C02" }}>
          Ups! Terjadi Kesalahan
        </h1>
        
        <p className="text-muted-foreground mb-8" style={{ color: "#6B4226" }}>
          {error.statusText || error.message || "Terjadi kesalahan sistem yang tidak terduga. Silakan coba segarkan halaman."}
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all font-medium"
            style={{ background: "linear-gradient(135deg, #C9960C, #D4AF37)", color: "#3D1C02" }}
          >
            <RotateCcw className="w-4 h-4" />
            Segarkan Halaman
          </button>
          
          <Link 
            to="/"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all font-medium border border-amber-200"
            style={{ background: "white", color: "#6B4226" }}
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t border-dashed border-amber-100">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest" style={{ color: "#9A6B4B" }}>
            REKABATIK ERROR LOG SYSTEM
          </p>
        </div>
      </div>
    </div>
  );
}
