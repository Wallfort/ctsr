'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type SelectorContextType = {
  selectedSection: string;
  setSelectedSection: (section: string) => void;
};

const SelectorContext = createContext<SelectorContextType | undefined>(undefined);

export function SelectorProvider({ children }: { children: ReactNode }) {
  const [selectedSection, setSelectedSection] = useState('stazioni');

  return (
    <SelectorContext.Provider value={{ selectedSection, setSelectedSection }}>
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