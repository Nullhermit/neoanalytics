import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

export type TourStep = {
  selector: string;
  title: string;
  desc: string;
};

export function Tutorial({
  steps,
  open,
  onClose,
}: {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    let raf = 0;
    const find = () => {
      const sel = steps[i]?.selector;
      const el = sel ? (document.querySelector(sel) as HTMLElement | null) : null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // wait a frame after scroll to measure
        raf = requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
      } else {
        setRect(null);
      }
    };
    find();
    const t = setTimeout(find, 400);
    const onR = () => find();
    window.addEventListener("resize", onR);
    window.addEventListener("scroll", onR, true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "Enter") setI((p) => Math.min(p + 1, steps.length - 1));
      else if (e.key === "ArrowLeft") setI((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onR);
      window.removeEventListener("scroll", onR, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [i, open, steps, onClose]);

  if (!open) return null;
  const step = steps[i];
  if (!step) return null;

  const pad = 10;
  const r = rect
    ? { x: Math.max(0, rect.left - pad), y: Math.max(0, rect.top - pad), w: rect.width + pad * 2, h: rect.height + pad * 2 }
    : null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const bubbleW = Math.min(360, vw - 24);

  let bubbleStyle: React.CSSProperties = {
    left: Math.max(12, vw / 2 - bubbleW / 2),
    top: Math.max(12, vh / 2 - 120),
    width: bubbleW,
  };
  if (r) {
    const below = r.y + r.h + 14;
    const fitBelow = below + 240 < vh;
    bubbleStyle = {
      left: Math.min(Math.max(12, r.x + r.w / 2 - bubbleW / 2), vw - bubbleW - 12),
      top: fitBelow ? below : Math.max(12, r.y - 240),
      width: bubbleW,
    };
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Feature walkthrough">
      <svg className="absolute inset-0 h-full w-full pointer-events-auto" onClick={onClose}>
        <defs>
          <mask id="neo-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {r && <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="14" ry="14" fill="black" />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(2,4,18,0.78)" mask="url(#neo-tour-mask)" />
        {r && (
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            rx="14"
            ry="14"
            fill="none"
            stroke="hsl(270 95% 75%)"
            strokeWidth="2"
            className="animate-pulse"
            style={{ filter: "drop-shadow(0 0 14px rgba(124,92,255,0.7))" }}
          />
        )}
      </svg>

      <div
        style={bubbleStyle}
        className="absolute rounded-2xl border border-primary/50 bg-card/95 backdrop-blur-xl p-5 shadow-2xl glow-primary animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <div className="size-7 rounded-md bg-[image:var(--gradient-hero)] grid place-items-center shrink-0">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.25em] text-primary mb-0.5">
                Step {i + 1} of {steps.length}
              </div>
              <h3 className="text-base font-bold leading-tight truncate">{step.title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip tutorial"
            className="text-muted-foreground hover:text-foreground transition shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{step.desc}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Skip tutorial
          </button>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button
                type="button"
                onClick={() => setI(i - 1)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background/60 px-3 py-1.5 text-xs hover:border-primary/60 transition"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (i < steps.length - 1 ? setI(i + 1) : onClose())}
              className="inline-flex items-center gap-1 rounded-md bg-[image:var(--gradient-hero)] px-3 py-1.5 text-xs font-semibold text-primary-foreground glow-primary hover:scale-[1.02] transition"
            >
              {i < steps.length - 1 ? "Next" : "Finish"} <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1">
          {steps.map((_, idx) => (
            <span
              key={idx}
              className={`h-1 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-2 bg-muted"}`}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}