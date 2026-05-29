import { createContext, useContext, useState, type ReactNode } from "react";

export type WorkspaceMode = "household" | "research" | "developer";

export const MODE_META: Record<WorkspaceMode, { label: string; tagline: string; emoji: string }> = {
  household: { label: "Household & Budget", tagline: "Personal finance · friendly", emoji: "🏠" },
  research: { label: "Research & Analytics", tagline: "Academic · rigorous", emoji: "🔬" },
  developer: { label: "Developer & Systems", tagline: "Engineering · raw metrics", emoji: "⚡" },
};

interface Ctx {
  mode: WorkspaceMode;
  setMode: (m: WorkspaceMode) => void;
}
const ModeContext = createContext<Ctx | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<WorkspaceMode>("research");
  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useWorkspaceMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useWorkspaceMode must be used inside ModeProvider");
  return ctx;
}