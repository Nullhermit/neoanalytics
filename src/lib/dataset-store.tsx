import { createContext, useContext, useState, type ReactNode } from "react";
import type { Dataset } from "./data/types";

interface Ctx {
  dataset: Dataset | null;
  setDataset: (d: Dataset | null) => void;
  outlierOffset: number;
  setOutlierOffset: (n: number) => void;
}
const DataCtx = createContext<Ctx | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [outlierOffset, setOutlierOffset] = useState(0);
  return (
    <DataCtx.Provider value={{ dataset, setDataset, outlierOffset, setOutlierOffset }}>
      {children}
    </DataCtx.Provider>
  );
}

export function useDataset() {
  const c = useContext(DataCtx);
  if (!c) throw new Error("useDataset outside DatasetProvider");
  return c;
}