import { Activity } from "lucide-react";
import { MODE_META, useWorkspaceMode, type WorkspaceMode } from "@/lib/workspace-mode";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Header() {
  const { mode, setMode } = useWorkspaceMode();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-md bg-[image:var(--gradient-hero)] grid place-items-center glow-primary">
            <Activity className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider text-glow">NEO ANALYTICS</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">v1.0 · sub-second engine</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-[var(--neon-cyan)] animate-pulse" />
            <span>Engine online · WebGL 2.0</span>
          </div>
          <Select value={mode} onValueChange={(v) => setMode(v as WorkspaceMode)}>
            <SelectTrigger className="w-[260px] neon-border bg-card/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MODE_META) as WorkspaceMode[]).map((m) => (
                <SelectItem key={m} value={m}>
                  <span className="mr-2">{MODE_META[m].emoji}</span>
                  <span className="font-medium">{MODE_META[m].label}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{MODE_META[m].tagline}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}