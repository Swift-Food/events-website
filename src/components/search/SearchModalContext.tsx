"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import SearchModal from "./SearchModal";

interface SearchModalContextType {
  openSearchModal: () => void;
  closeSearchModal: () => void;
}

const SearchModalContext = createContext<SearchModalContextType | null>(null);

export function useSearchModal() {
  const context = useContext(SearchModalContext);
  if (!context) {
    throw new Error("useSearchModal must be used within SearchModalProvider");
  }
  return context;
}

export function SearchModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSearchModal = () => setIsOpen(true);
  const closeSearchModal = () => setIsOpen(false);

  return (
    <SearchModalContext.Provider value={{ openSearchModal, closeSearchModal }}>
      {children}
      <SearchModal isOpen={isOpen} onClose={closeSearchModal} />
    </SearchModalContext.Provider>
  );
}
