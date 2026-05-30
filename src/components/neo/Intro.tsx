import { useDataset } from "@/lib/dataset-store";
import { useWorkspaceMode } from "@/lib/workspace-mode";
import { Upload, Sparkles, BarChart3, Brain, Database, Rocket, Cpu, LineChart, ShieldCheck, Code2, Zap, Github } from "lucide-react";
import { DEMO_DATASETS } from "@/lib/data/demo";

export function Intro() {
  const { dataset, setDataset } = useDataset();
  const { mode } = useWorkspaceMode();
  if (dataset) return null;

  const features = [
    { icon: Database, title: "Universal Ingestion", body: "Drop CSV, Excel or paste a table — parsed client-side in milliseconds, never leaves your browser." },
    { icon: BarChart3, title: "2D + 3D Visuals", body: "Recharts dashboards plus a WebGL 2.0 engine for holographic point clouds and rotating scatter fields." },
    { icon: Brain, title: "Mode-Aware AI", body: "Household, Research and Developer personas — the assistant rewrites itself for your audience." },
    { icon: LineChart, title: "Live Statistics", body: "Means, medians, skew, 95% CIs, hypothesis tests and what-if outlier sliders, all re-computed on the fly." },
    { icon: Cpu, title: "On-Device ML", body: "TensorFlow.js polynomial regression trains in your tab with a live loss-curve animation." },
    { icon: Code2, title: "Dev Toolkit", body: "Auto-generated SQL, REST mocks in Python/JS/cURL, and a 1Hz live data-stream simulator." },
  ];

  const steps = [
    { n: "01", icon: Upload, title: "Load data", body: "Upload a file, paste rows into the grid, or fire Instant Simulation for a pre-warmed demo." },
    { n: "02", icon: Sparkles, title: "Pick a mode", body: "Switch persona in the header — UI and AI tone re-flow for the chosen audience." },
    { n: "03", icon: Zap, title: "Explore instantly", body: "Charts, stats and AI insights stream in with sub-second latency as you tweak filters." },
    { n: "04", icon: Rocket, title: "Export", body: "Ship lab-grade PDF reports or executive PPTX decks in a single click." },
  ];

  return (
    <section className="space-y-10 animate-glitch-in">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/40 p-8 sm:p-12">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-20 pointer-events-none" />
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-primary mb-5">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" /> Neo Analytics v1.0
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-glow leading-[1.05]">
            Ultra-fast data intelligence,<br />
            <span className="bg-clip-text text-transparent bg-[image:var(--gradient-hero)]">straight in your browser.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            A single-page analytics workspace that parses, visualises, models and explains your data in milliseconds —
            with three workspace personas, on-device ML, 3D WebGL plots, and a conversational AI that adapts to whoever's reading.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => {
                const id = mode === "household" ? "household" : "sales";
                const d = DEMO_DATASETS.find((x) => x.id === id) ?? DEMO_DATASETS[0];
                setDataset(d.build());
              }}
              className="group inline-flex items-center gap-2 rounded-md bg-[image:var(--gradient-hero)] px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-primary hover:scale-[1.02] transition"
            >
              <Zap className="size-4" /> Instant Simulation
            </button>
            <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-5 py-2.5 text-sm font-medium hover:border-primary/60 transition">
              How it works
            </a>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-[var(--neon-cyan)]" />
            100% client-side · your data never leaves the tab
          </div>
        </div>

        {/* stat strip */}
        <div className="relative mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
          {[
            ["<50ms", "Parse latency"],
            ["3", "Workspace modes"],
            ["WebGL 2", "3D engine"],
            ["0", "Servers required"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-lg border border-border bg-background/40 p-3">
              <div className="text-xl font-bold text-glow">{v}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div>
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-accent">Capabilities</div>
          <h2 className="text-2xl font-bold text-glow mt-1">Everything in one workspace</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group relative rounded-xl border border-border bg-card/40 p-5 hover:border-primary/60 transition">
              <div className="size-10 rounded-md bg-primary/10 border border-primary/30 grid place-items-center mb-3 group-hover:glow-primary transition">
                <f.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how-it-works">
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-accent">Workflow</div>
          <h2 className="text-2xl font-bold text-glow mt-1">From raw rows to insight in four steps</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative rounded-xl border border-border bg-card/40 p-5">
              <div className="absolute -top-3 left-5 text-[10px] tracking-[0.3em] font-mono text-primary bg-background px-2">{s.n}</div>
              <s.icon className="size-5 text-accent mb-3" />
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.body}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 size-3 rounded-full bg-primary/40 border border-primary" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODES */}
      <div>
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-accent">Three personas</div>
          <h2 className="text-2xl font-bold text-glow mt-1">One engine, three voices</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { emoji: "🏠", title: "Household", body: "Friendly budgeting tips, savings rates and dining-cost nudges in plain language." },
            { emoji: "🔬", title: "Research", body: "Confidence intervals, skew diagnostics, hypothesis tests and 'show-your-work' formulas." },
            { emoji: "⚙️", title: "Developer", body: "Schema reports, SQL/REST mocks, live streams and on-device ML training curves." },
          ].map((m) => (
            <div key={m.title} className="rounded-xl border border-border bg-card/40 p-5">
              <div className="text-3xl mb-2">{m.emoji}</div>
              <h3 className="font-semibold">{m.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CREATOR */}
      <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-full bg-[image:var(--gradient-hero)] grid place-items-center glow-primary font-bold text-primary-foreground">
            N
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Crafted by</div>
            <div className="text-xl font-bold text-glow">Nullhermit</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">
              Designed and engineered as a zero-server, browser-native analytics engine — built for speed, clarity and curiosity.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Github className="size-3.5" /> © {new Date().getFullYear()} Nullhermit · Neo Analytics
        </div>
      </div>
    </section>
  );
}