import { useEffect, useRef, useState } from "react";
import { useDataset, COUNTRIES, type CountryCode } from "@/lib/dataset-store";
import { DEMO_DATASETS } from "@/lib/data/demo";
import { parseFile } from "@/lib/data/parse";
import { IntroGalaxy } from "./IntroGalaxy";
import { Upload, Sparkles, Zap, ArrowRight, Globe2, ChevronRight, Database, MousePointerClick } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Stage = "splash" | "setup" | "loading";

export function Intro({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const { setDataset, country, setCountry } = useDataset();
  const [stage, setStage] = useState<Stage>("splash");
  const [loadingLabel, setLoadingLabel] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // lock body scroll while intro is mounted (prevents scrollbar gap behind fixed overlay)
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prev = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prev;
    };
  }, []);

  const runLoading = async (label: string, work: () => Promise<void> | void) => {
    setStage("loading");
    setLoadingLabel(label);
    setLoadingProgress(0);
    const steps = [
      "Allocating WebGL buffers",
      "Spinning vector engine",
      "Indexing columns",
      "Profiling distributions",
      "Calibrating AI persona",
      "Materializing workspace",
    ];
    for (let i = 0; i < steps.length; i++) {
      setLoadingLabel(steps[i]);
      setLoadingProgress(((i + 1) / steps.length) * 100);
      await new Promise((r) => setTimeout(r, 220));
    }
    await work();
    onEnterDashboard();
  };

  const startDemo = (id: string) => {
    const d = DEMO_DATASETS.find((x) => x.id === id) ?? DEMO_DATASETS[0];
    runLoading(d.label, () => setDataset(d.build()));
  };

  const onFile = async (file: File) => {
    await runLoading(`Parsing ${file.name}`, async () => {
      try {
        const ds = await parseFile(file);
        setDataset(ds);
        toast.success(`Parsed ${ds.rows.length.toLocaleString()} rows × ${ds.columns.length} cols`);
      } catch (e) {
        toast.error("Parse failed: " + (e as Error).message);
        setStage("setup");
      }
    });
  };

  const startManual = () => {
    // jump into workspace with an empty editable scaffold dataset
    runLoading("Opening blank ledger", () => {
      setDataset({
        name: "manual_entry.csv",
        columns: [
          { name: "Label", type: "categorical" },
          { name: "Value", type: "numeric" },
        ],
        rows: Array.from({ length: 6 }, (_, i) => ({ Label: `Item ${i + 1}`, Value: 0 })),
      });
    });
  };

  return (
    <div
      className="absolute left-0 top-0 z-50 bg-background text-foreground"
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      {stage === "splash" && <SplashStage onContinue={() => setStage("setup")} onPickDemo={startDemo} />}
      {stage === "setup" && (
        <SetupStage
          country={country}
          onCountry={setCountry}
          onUpload={() => fileRef.current?.click()}
          onManual={startManual}
          onDemo={startDemo}
        />
      )}
      {stage === "loading" && <LoadingStage label={loadingLabel} progress={loadingProgress} />}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}

/* ─────────────── SPLASH ─────────────── */
function SplashStage({ onContinue, onPickDemo }: { onContinue: () => void; onPickDemo: (id: string) => void }) {
  const [hint, setHint] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHint(true), 1600);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") onContinue(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [onContinue]);

  return (
    <div
      onClick={onContinue}
      className="relative cursor-pointer select-none"
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
      title="Click anywhere to continue"
    >
      {/* fullscreen 3D galaxy */}
      <div className="absolute inset-0">
        <IntroGalaxy onPickDemo={onPickDemo} />
      </div>
      {/* dim overlay so HUD reads */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80" />

      {/* Title HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center pt-10 sm:pt-16 animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-primary">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" /> Neo Analytics v1.0
        </div>
        <h1 className="mt-4 text-4xl sm:text-6xl font-bold tracking-tight text-glow text-center px-4">
          Enter the <span className="bg-clip-text text-transparent bg-[image:var(--gradient-hero)]">Data Galaxy</span>
        </h1>
        <p className="mt-3 max-w-xl text-center text-sm sm:text-base text-muted-foreground px-4">
          Drag to orbit · scroll to zoom · or pick a node to dive in.
        </p>
      </div>

      {/* Click-anywhere hint */}
      <div className={`pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center transition-opacity duration-700 ${hint ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-2 rounded-full border border-border bg-background/70 backdrop-blur px-4 py-2 text-xs uppercase tracking-[0.3em] text-foreground glow-primary animate-pulse">
          <MousePointerClick className="size-3.5" /> Click anywhere to continue
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Crafted by Nullhermit</div>
      </div>
    </div>
  );
}

/* ─────────────── SETUP ─────────────── */
function SetupStage({
  country, onCountry, onUpload, onManual, onDemo,
}: {
  country: CountryCode;
  onCountry: (c: CountryCode) => void;
  onUpload: () => void;
  onManual: () => void;
  onDemo: (id: string) => void;
}) {
  const meta = COUNTRIES.find((x) => x.code === country)!;

  return (
    <div className="relative" style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* aurora background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 size-[40rem] rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 size-[40rem] rounded-full bg-accent/20 blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,92,255,0.12),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(194,92,255,0.12),transparent_40%)]" />
      </div>

      <div className="relative z-50 pointer-events-auto mx-auto max-w-5xl px-6 py-12 sm:py-16 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-accent">
            Initialize Workspace
          </div>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-glow">
            How do you want to <span className="bg-clip-text text-transparent bg-[image:var(--gradient-hero)]">begin?</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            Choose your data source and tell us where you're operating — the AI tunes insights to your local economy.
          </p>
        </div>

        {/* Country selector */}
        <div className="mb-8 rounded-xl border border-border bg-card/50 backdrop-blur p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-2 text-sm">
              <Globe2 className="size-4 text-primary" />
              <span className="font-semibold">Region & currency</span>
            </div>
            <Select value={country} onValueChange={(v) => onCountry(v as CountryCode)}>
              <SelectTrigger className="bg-background/60 w-full sm:w-[280px]"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[320px]">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono mr-2">{c.flag}</span>
                    {c.name} · {c.currency} ({c.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground flex-1">
              <span className="text-foreground/80">{meta.flag} {meta.name}:</span> {meta.note}
            </div>
          </div>
        </div>

        {/* Two big options */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Option A */}
          <div
            role="button"
            tabIndex={0}
            onClick={onManual}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onManual(); }}
            className="group relative text-left rounded-2xl border border-border bg-card/40 backdrop-blur p-6 sm:p-8 transition-all overflow-hidden hover:scale-[1.01] cursor-pointer hover:border-primary/60"
          >
            <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-0 group-hover:opacity-10 transition" />
            <div className="size-12 rounded-lg bg-primary/15 border border-primary/40 grid place-items-center mb-4">
              <Upload className="size-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Upload Data / Manual Editor</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Drop a CSV/XLSX file, or enter rows manually in an editable grid. Stays 100% in your browser.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={(e) => { e.stopPropagation(); onUpload(); }} className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/25 transition cursor-pointer">
                <Upload className="size-3.5" /> Upload file
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onManual(); }} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold hover:border-primary/60 transition cursor-pointer">
                <Database className="size-3.5" /> Manual entry
              </button>
            </div>
          </div>

          {/* Option B */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onDemo("sales")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onDemo("sales"); }}
            className="group relative rounded-2xl border border-border bg-card/40 backdrop-blur p-6 sm:p-8 transition-all overflow-hidden cursor-pointer hover:scale-[1.01] hover:border-accent/60"
          >
            <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-0 group-hover:opacity-10 transition" />
            <div className="size-12 rounded-lg bg-accent/15 border border-accent/40 grid place-items-center mb-4">
              <Sparkles className="size-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold">Use example dataset</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Pre-warmed industry datasets — feel the speed instantly without uploading anything.
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_DATASETS.map((d) => (
                <button
                  key={d.id}
                  onClick={(e) => { e.stopPropagation(); onDemo(d.id); }}
                  className="text-left inline-flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-xs hover:border-accent/60 hover:bg-accent/10 transition"
                >
                  <span className="truncate">{d.label}</span>
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDemo("sales"); }}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[image:var(--gradient-hero)] px-4 py-2 text-xs font-semibold text-primary-foreground glow-primary hover:scale-[1.02] transition"
            >
              <Zap className="size-3.5" /> Run System Example Simulation <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-10 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Neo Analytics · crafted by Nullhermit
        </div>
      </div>
    </div>
  );
}

/* ─────────────── LOADING ─────────────── */
function LoadingStage({ label, progress }: { label: string; progress: number }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-background/95 backdrop-blur-md">
      {/* animated rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="size-[420px] rounded-full border border-primary/20 animate-[spin_18s_linear_infinite]" />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="size-[300px] rounded-full border border-accent/30 animate-[spin_9s_linear_infinite_reverse]" />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="size-[180px] rounded-full border-2 border-primary/60 animate-[spin_5s_linear_infinite] border-dashed" />
        </div>
      </div>

      <div className="relative z-10 text-center w-[min(92vw,520px)]">
        <div className="mx-auto size-20 rounded-2xl bg-[image:var(--gradient-hero)] grid place-items-center glow-primary animate-pulse">
          <Sparkles className="size-9 text-primary-foreground" />
        </div>
        <div className="mt-6 text-[10px] uppercase tracking-[0.4em] text-primary">Booting Workspace</div>
        <div className="mt-2 text-2xl font-bold text-glow">{label}…</div>

        <div className="mt-6 h-1.5 w-full rounded-full bg-card/70 overflow-hidden border border-border">
          <div
            className="h-full bg-[image:var(--gradient-hero)] transition-all duration-200 glow-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 font-mono text-[10px] text-muted-foreground">{progress.toFixed(0)}% · sub-second runtime</div>
      </div>
    </div>
  );
}