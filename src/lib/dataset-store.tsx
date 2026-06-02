import { createContext, useContext, useState, type ReactNode } from "react";
import type { Dataset } from "./data/types";

export type CountryCode = "IN" | "US" | "GB" | "EU" | "JP" | "SG" | "BR" | "AE" | "AU" | "CA";
export const COUNTRIES: { code: CountryCode; name: string; currency: string; symbol: string; flag: string; note: string }[] = [
  { code: "IN", name: "India",          currency: "INR", symbol: "₹",  flag: "🇮🇳", note: "High inflation sensitivity; SIPs & PPF favored; 50/30/20 stretched by rent in metros." },
  { code: "US", name: "United States",  currency: "USD", symbol: "$",  flag: "🇺🇸", note: "401(k) match + Roth IRA culture; healthcare a major fixed cost; credit-score weighted." },
  { code: "GB", name: "United Kingdom", currency: "GBP", symbol: "£",  flag: "🇬🇧", note: "ISA wrappers + workplace pension; council tax & energy bills weigh on budgets." },
  { code: "EU", name: "Eurozone",       currency: "EUR", symbol: "€",  flag: "🇪🇺", note: "Lower personal-debt culture; strong consumer protections; VAT-inclusive pricing." },
  { code: "JP", name: "Japan",          currency: "JPY", symbol: "¥",  flag: "🇯🇵", note: "Deflationary tilt; high savings rate; NISA tax-free investment account favored." },
  { code: "SG", name: "Singapore",      currency: "SGD", symbol: "S$", flag: "🇸🇬", note: "CPF mandatory savings; housing & transport dominate; low income tax." },
  { code: "BR", name: "Brazil",         currency: "BRL", symbol: "R$", flag: "🇧🇷", note: "Volatile inflation; Selic-linked savings; informal economy share is large." },
  { code: "AE", name: "UAE",            currency: "AED", symbol: "د.إ",flag: "🇦🇪", note: "Tax-free income but high rent; remittance-heavy budgets; gold as a hedge." },
  { code: "AU", name: "Australia",      currency: "AUD", symbol: "A$", flag: "🇦🇺", note: "Superannuation 11%+; housing affordability strained; HECS student-loan drag." },
  { code: "CA", name: "Canada",         currency: "CAD", symbol: "C$", flag: "🇨🇦", note: "TFSA + RRSP tax shelters; housing cost dominant; carbon-rebate quirks." },
];

interface Ctx {
  dataset: Dataset | null;
  setDataset: (d: Dataset | null) => void;
  outlierOffset: number;
  setOutlierOffset: (n: number) => void;
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
}
const DataCtx = createContext<Ctx | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [outlierOffset, setOutlierOffset] = useState(0);
  const [country, setCountry] = useState<CountryCode>("IN");
  return (
    <DataCtx.Provider value={{ dataset, setDataset, outlierOffset, setOutlierOffset, country, setCountry }}>
      {children}
    </DataCtx.Provider>
  );
}

export function useDataset() {
  const c = useContext(DataCtx);
  if (!c) throw new Error("useDataset outside DatasetProvider");
  return c;
}

export function useCountryMeta() {
  const { country } = useDataset();
  return COUNTRIES.find((x) => x.code === country) ?? COUNTRIES[0];
}