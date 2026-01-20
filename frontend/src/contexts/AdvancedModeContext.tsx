"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface AdvancedModeContextType {
  isAdvancedMode: boolean;
  toggleAdvancedMode: () => void;
}

const AdvancedModeContext = createContext<AdvancedModeContextType | undefined>(undefined);

const STORAGE_KEY = "clarity_advanced_mode";

export function AdvancedModeProvider({ children }: { children: React.ReactNode }) {
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setIsAdvancedMode(saved === "true");
      }
    }
  }, []);

  // Save to localStorage when changed
  const toggleAdvancedMode = () => {
    setIsAdvancedMode((prev) => {
      const newValue = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(newValue));
      }
      return newValue;
    });
  };

  return (
    <AdvancedModeContext.Provider value={{ isAdvancedMode, toggleAdvancedMode }}>
      {children}
    </AdvancedModeContext.Provider>
  );
}

export function useAdvancedMode() {
  const context = useContext(AdvancedModeContext);
  if (context === undefined) {
    throw new Error("useAdvancedMode must be used within an AdvancedModeProvider");
  }
  return context;
}
