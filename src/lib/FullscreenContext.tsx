import { createContext, useContext, useState, ReactNode } from "react";

interface FullscreenContextType {
  isFullMode: boolean;
  setIsFullMode: (value: boolean) => void;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const [isFullMode, setIsFullMode] = useState(false);

  return (
    <FullscreenContext.Provider value={{ isFullMode, setIsFullMode }}>
      {children}
    </FullscreenContext.Provider>
  );
}

export function useFullscreen() {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error("useFullscreen must be used within a FullscreenProvider");
  }
  return context;
}