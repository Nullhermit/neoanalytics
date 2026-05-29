import { useEffect, useRef, useState } from "react";
import { Panel } from "./Panel";
import { Button } from "@/components/ui/button";
import { Radio, Square } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface Tick { t: number; value: number; latency: number; }

export function LiveStream() {
  const [running, setRunning] = useState(false);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (iv.current) clearInterval(iv.current); }, []);

  const start = () => {
    if (iv.current) return;
    setRunning(true);
    let t = 0;
    iv.current = setInterval(() => {
      const value = 50 + Math.sin(t / 5) * 20 + Math.random() * 15;
      const latency = 0.4 + Math.random() * 1.6;
      setTicks((prev) => [...prev.slice(-59), { t: ++t, value: +value.toFixed(2), latency: +latency.toFixed(2) }]);
    }, 1000);
  };
  const stop = () => { if (iv.current) clearInterval(iv.current); iv.current = null; setRunning(false); };

  const last = ticks[ticks.length - 1];

  return (
    <Panel title="Live Data-Stream Simulator" subtitle="WebSocket-style · 1Hz tick rate" action={
      <Button size="sm" onClick={running ? stop : start} className={running ? "bg-destructive text-destructive-foreground" : "bg-[image:var(--gradient-hero)] text-primary-foreground glow-primary"}>
        {running ? <><Square className="size-3 mr-1" /> Stop</> : <><Radio className="size-3 mr-1" /> Connect Live Stream</>}
      </Button>
    }>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Metric label="Tick" value={last ? `#${last.t}` : "—"} />
        <Metric label="Value" value={last ? last.value.toFixed(2) : "—"} />
        <Metric label="Latency" value={last ? `${last.latency.toFixed(2)} ms` : "—"} />
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer>
          <LineChart data={ticks}>
            <CartesianGrid stroke="#2a2548" strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke="#8a87a8" fontSize={10} />
            <YAxis stroke="#8a87a8" fontSize={10} />
            <Tooltip contentStyle={{ background: "#1a1633", border: "1px solid #4c3aa8" }} />
            <Line type="monotone" dataKey="value" stroke="#5cd0ff" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-base text-glow">{value}</div>
    </div>
  );
}