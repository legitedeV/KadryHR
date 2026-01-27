"use client";

import { ReactNode, createContext, useContext, useState } from "react";

type TopbarActionsContextType = {
  actionsSlot: ReactNode;
  setActionsSlot: (actions: ReactNode) => void;
};

const TopbarActionsContext = createContext<TopbarActionsContextType | null>(null);

export function TopbarActionsProvider({ children }: { children: ReactNode }) {
  const [actionsSlot, setActionsSlot] = useState<ReactNode>(null);

  return (
    <TopbarActionsContext.Provider value={{ actionsSlot, setActionsSlot }}>
      {children}
    </TopbarActionsContext.Provider>
  );
}

export function useTopbarActions() {
  const context = useContext(TopbarActionsContext);
  if (!context) {
    throw new Error("useTopbarActions must be used within TopbarActionsProvider");
  }
  return context;
}
