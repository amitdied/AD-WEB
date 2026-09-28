'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface OSBootContextType {
  isBooted: boolean;
  bootProgress: number;
  skipBoot: () => void;
}

const OSBootContext = createContext<OSBootContextType | undefined>(undefined);

export function OSBootProvider({ children }: { children: React.ReactNode }) {
  const [isBooted, setIsBooted] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);

  useEffect(() => {
    // Check if user has already visited in this session
    const hasBooted = sessionStorage.getItem('amitdied_booted');
    if (hasBooted) {
      setIsBooted(true);
      setBootProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsBooted(true);
            sessionStorage.setItem('amitdied_booted', 'true');
          }, 300);
          return 100;
        }
        return prev + 15;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  const skipBoot = () => {
    setIsBooted(true);
    setBootProgress(100);
    sessionStorage.setItem('amitdied_booted', 'true');
  };

  return (
    <OSBootContext.Provider value={{ isBooted, bootProgress, skipBoot }}>
      {children}
    </OSBootContext.Provider>
  );
}

export function useOSBoot() {
  const context = useContext(OSBootContext);
  if (!context) {
    throw new Error('useOSBoot must be used within an OSBootProvider');
  }
  return context;
}
