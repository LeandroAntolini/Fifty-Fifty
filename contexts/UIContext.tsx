import React, { createContext, useState, useContext, ReactNode } from 'react';

interface UIContextType {
  isImovelModalOpen: boolean;
  openImovelModal: () => void;
  closeImovelModal: () => void;
  isClienteModalOpen: boolean;
  openClienteModal: () => void;
  closeClienteModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isImovelModalOpen, setIsImovelModalOpen] = useState(false);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);

  const openImovelModal = () => setIsImovelModalOpen(true);
  const closeImovelModal = () => setIsImovelModalOpen(false);

  const openClienteModal = () => setIsClienteModalOpen(true);
  const closeClienteModal = () => setIsClienteModalOpen(false);

  return (
    <UIContext.Provider value={{
      isImovelModalOpen,
      openImovelModal,
      closeImovelModal,
      isClienteModalOpen,
      openClienteModal,
      closeClienteModal,
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
