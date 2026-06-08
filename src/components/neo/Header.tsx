import { useState } from "react";
import { Activity, Menu, HelpCircle } from "lucide-react";
import { MODE_META, useWorkspaceMode, type WorkspaceMode } from "@/lib/workspace-mode";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export function Header({ onStartTutorial }: { onStartTutorial?: () => void }) {
  const { mode, setMode } = useWorkspaceMode();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="size-8 sm:size-9 rounded-md bg-[image:var(--gradient-hero)] grid place-items-center glow-primary shrink-0">
            <Activity className="size-4 sm:size-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-wider text-glow truncate">NEO ANALYTICS</h1>
            <p className="hidden sm:block text-[10px] uppercase tracking-[0.3em] text-muted-foreground">v1.0 · sub-second engine</p>
          </div>
        </div>

        {/* Desktop controls */}
        <div className="hidden md:flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-[var(--neon-cyan)] animate-pulse" />
            <span>Engine online · WebGL 2.0</span>
          </div>
          {onStartTutorial && (
            <button
              type="button"
              onClick={onStartTutorial}
              data-tour="help"
              aria-label="Start feature walkthrough"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-xs hover:border-primary/60 transition"
            >
              <HelpCircle className="size-3.5" /> Tour
            </button>
          )}
          <Select value={mode} onValueChange={(v) => setMode(v as WorkspaceMode)}>
            <SelectTrigger data-tour="mode-select" className="w-[260px] neon-border bg-card/60">
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

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open workspace menu"
              className="md:hidden inline-flex items-center justify-center size-10 rounded-md border border-border bg-card/60 hover:border-primary/60 transition"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[88vw] sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>Workspace mode</SheetTitle>
              <SheetDescription>Switch between household, research, and developer views.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              {(Object.keys(MODE_META) as WorkspaceMode[]).map((m) => (
                <SheetClose asChild key={m}>
                  <button
                    type="button"
                    onClick={() => setMode(m)}
                    aria-current={mode === m ? "true" : undefined}
                    className={`w-full text-left rounded-lg border px-3 py-3 transition ${
                      mode === m
                        ? "border-primary bg-primary/10 glow-primary"
                        : "border-border bg-card/40 hover:border-primary/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{MODE_META[m].emoji}</span>
                      <span className="font-semibold">{MODE_META[m].label}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{MODE_META[m].tagline}</div>
                  </button>
                </SheetClose>
              ))}
            </div>
            {onStartTutorial && (
              <button
                type="button"
                onClick={() => { setOpen(false); onStartTutorial(); }}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold hover:bg-primary/20 transition"
              >
                <HelpCircle className="size-3.5" /> Start feature tour
              </button>
            )}
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-[var(--neon-cyan)] animate-pulse" />
              <span>Engine online · WebGL 2.0</span>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}