import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Panel({ title, subtitle, children, className, action }: {
  title?: string; subtitle?: string; children: ReactNode; className?: string; action?: ReactNode;
}) {
  return (
    <section className={cn("panel p-5 animate-glitch-in", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3 relative">
          <div>
            {title && <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-glow text-foreground">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="relative">{children}</div>
    </section>
  );
}