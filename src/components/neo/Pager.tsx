import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useWorkspaceMode, MODE_META, type WorkspaceMode } from "@/lib/workspace-mode";

const ORDER: WorkspaceMode[] = ["household", "research", "developer"];

export function Pager({ onBackToGalaxy }: { onBackToGalaxy?: () => void }) {
  const { mode, setMode } = useWorkspaceMode();
  const idx = ORDER.indexOf(mode);
  const prev = ORDER[(idx - 1 + ORDER.length) % ORDER.length];
  const next = ORDER[(idx + 1) % ORDER.length];
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <nav
      aria-label="Workspace pagination"
      className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card/40 backdrop-blur p-3 sm:p-4"
    >
      <button
        type="button"
        onClick={() => { setMode(prev); scrollTop(); }}
        className="group flex items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-left transition hover:border-primary/60 hover:bg-primary/5"
        aria-label={`Previous page: ${MODE_META[prev].label}`}
      >
        <ChevronLeft className="size-4 text-primary shrink-0 transition group-hover:-translate-x-0.5" />
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Previous</div>
          <div className="text-sm font-semibold">{MODE_META[prev].emoji} {MODE_META[prev].label}</div>
        </div>
      </button>

      <div className="flex items-center justify-center gap-3 text-xs">
        {ORDER.map((m, i) => (
          <span
            key={m}
            aria-current={m === mode ? "page" : undefined}
            className={`size-2 rounded-full transition ${m === mode ? "bg-primary w-6 glow-primary" : "bg-muted"}`}
            title={`${i + 1}. ${MODE_META[m].label}`}
          />
        ))}
        {onBackToGalaxy && (
          <button
            type="button"
            onClick={onBackToGalaxy}
            className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] font-semibold hover:border-accent/60 transition"
            aria-label="Return to Galaxy intro"
          >
            <Home className="size-3.5" /> Galaxy
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => { setMode(next); scrollTop(); }}
        className="group flex items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-right transition hover:border-accent/60 hover:bg-accent/5 sm:flex-row-reverse"
        aria-label={`Next page: ${MODE_META[next].label}`}
      >
        <ChevronRight className="size-4 text-accent shrink-0 transition group-hover:translate-x-0.5" />
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Next</div>
          <div className="text-sm font-semibold">{MODE_META[next].emoji} {MODE_META[next].label}</div>
        </div>
      </button>
    </nav>
  );
}