'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface NewUploadContextValue {
  showButton: boolean;
  setShowButton: (value: boolean) => void;
  triggerHandler: () => void;
  setHandler: (fn: () => void) => void;
}

const NewUploadContext = createContext<NewUploadContextValue | null>(null);

export function NewUploadProvider({ children }: { children: ReactNode }) {
  const [showButton, setShowButton] = useState(false);
  const handlerRef = useRef<() => void>(() => {});

  const setHandler = useCallback((fn: () => void) => {
    handlerRef.current = fn;
  }, []);

  const triggerHandler = useCallback(() => {
    handlerRef.current();
  }, []);

  return (
    <NewUploadContext.Provider value={{ showButton, setShowButton, triggerHandler, setHandler }}>
      {children}
    </NewUploadContext.Provider>
  );
}

export function useNewUpload(): NewUploadContextValue {
  const ctx = useContext(NewUploadContext);
  if (!ctx) {
    throw new Error('useNewUpload must be used inside <NewUploadProvider>');
  }
  return ctx;
}
