'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type SelectorContextType = {
  selectedMansioneId: number | null;
  setSelectedMansioneId: (mansioneId: number | null) => void;
};

const SelectorContext = createContext<SelectorContextType | undefined>(undefined);

export function SelectorProvider({ children }: { children: ReactNode }) {
  const [selectedMansioneId, setSelectedMansioneId] = useState<number | null>(() => {
    // Inizializza lo stato dal localStorage se disponibile
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedMansioneId');
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });

  // Aggiorna il localStorage quando cambia la mansione selezionata
  useEffect(() => {
    if (selectedMansioneId !== null) {
      localStorage.setItem('selectedMansioneId', selectedMansioneId.toString());
    } else {
      localStorage.removeItem('selectedMansioneId');
    }
  }, [selectedMansioneId]);

  return (
    <SelectorContext.Provider value={{ selectedMansioneId, setSelectedMansioneId }}>
      {children}
    </SelectorContext.Provider>
  );
}

export function useSelector() {
  const context = useContext(SelectorContext);
  if (context === undefined) {
    throw new Error('useSelector must be used within a SelectorProvider');
  }
  return context;
} 