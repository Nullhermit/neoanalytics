import { useMemo, useState } from "react";
import type * as TF from "@tensorflow/tfjs";
import { Panel } from "./Panel";
import { useDataset } from "@/lib/dataset-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart } from "recharts";
import { Progress } from "@/components/ui/progress";

export function MlPanel() {
  const { dataset } = useDataset();
  const num = dataset?.columns.filter((c) => c.type === "numeric") ?? [];
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [degree, setDegree] = useState("1");
  const [training, setTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [coefs, setCoefs] = useState<number[] | null>(null);
  const [loss, setLoss] = useState<number | null>(null);

  const xc = x || num[0]?.name;
  const yc = y || num[1]?.name;

  const points = useMemo(() => {
    if (!dataset || !xc || !yc) return [];
    return dataset.rows
      .filter((r) => typeof r[xc] === "number" && typeof r[yc] === "number")
      .map((r) => ({ x: r[xc] as number, y: r[yc] as number }));
  }, [dataset, xc, yc]);

  const train = async () => {
    if (points.length < 2) return;
    setTraining(true); setEpoch(0); setCoefs(null); setLoss(null);
    const tf = await import("@tensorflow/tfjs");
    const d = +degree;
    const xs = tf.tensor2d(points.map((p) => Array.from({ length: d + 1 }, (_, i) => Math.pow(p.x, i))));
    const ys = tf.tensor2d(points.map((p) => [p.y]));
    const w = tf.variable(tf.zeros([d + 1, 1]));
    const lr = 0.0001;
    const opt = tf.train.adam(0.05);
    const totalEpochs = 80;
    for (let i = 0; i < totalEpochs; i++) {
      opt.minimize(() => {
        const pred = xs.matMul(w);
        return pred.sub(ys).square().mean() as TF.Scalar;
      });
      if (i % 4 === 0 || i === totalEpochs - 1) {
        const l = (xs.matMul(w).sub(ys).square().mean().dataSync()[0]);
        setLoss(l);
        setEpoch(i + 1);
        await tf.nextFrame();
      }
    }
    const c = Array.from(w.dataSync());
    setCoefs(c);
    void lr;
    xs.dispose(); ys.dispose(); w.dispose();
    setTraining(false);
  };

  const fitLine = useMemo(() => {
    if (!coefs || points.length === 0) return [];
    const min = Math.min(...points.map((p) => p.x));
    const max = Math.max(...points.map((p) => p.x));
    const steps = 40;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const xv = min + ((max - min) * i) / steps;
      const yv = coefs.reduce((acc, c, k) => acc + c * Math.pow(xv, k), 0);
      return { x: xv, fit: yv };
    });
  }, [coefs, points]);

  const merged = useMemo(() => {
    const map = new Map<number, { x: number; y?: number; fit?: number }>();
    for (const p of points) map.set(p.x, { x: p.x, y: p.y });
    for (const p of fitLine) {
      const e = map.get(p.x) ?? { x: p.x };
      e.fit = p.fit; map.set(p.x, e);
    }
    return [...map.values()].sort((a, b) => a.x - b.x);
  }, [points, fitLine]);

  if (!dataset) return null;

  return (
    <Panel title="Predictive Modeling (TensorFlow.js)" subtitle="Client-side training · live loss curve">
      <div className="grid sm:grid-cols-4 gap-2 mb-3">
        <Select value={xc} onValueChange={setX}><SelectTrigger className="bg-card/60"><SelectValue placeholder="X" /></SelectTrigger>
          <SelectContent>{num.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={yc} onValueChange={setY}><SelectTrigger className="bg-card/60"><SelectValue placeholder="Y" /></SelectTrigger>
          <SelectContent>{num.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={degree} onValueChange={setDegree}><SelectTrigger className="bg-card/60"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="1">Linear (deg 1)</SelectItem><SelectItem value="2">Quadratic (deg 2)</SelectItem><SelectItem value="3">Cubic (deg 3)</SelectItem></SelectContent></Select>
        <Button onClick={train} disabled={training || points.length < 2} className="bg-[image:var(--gradient-hero)] text-primary-foreground">
          <Brain className="size-4 mr-2" /> {training ? `epoch ${epoch}` : "Train"}
        </Button>
      </div>
      {training && <Progress value={(epoch / 80) * 100} className="mb-2" />}
      <div className="h-[260px]">
        <ResponsiveContainer>
          <ComposedChart data={merged}>
            <CartesianGrid stroke="#2a2548" strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" stroke="#8a87a8" fontSize={10} />
            <YAxis stroke="#8a87a8" fontSize={10} />
            <Tooltip contentStyle={{ background: "#1a1633", border: "1px solid #4c3aa8" }} />
            <Scatter dataKey="y" fill="#5cd0ff" />
            <Line type="monotone" dataKey="fit" stroke="#c25cff" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {coefs && (
        <div className="mt-3 text-xs font-mono text-muted-foreground">
          ŷ = {coefs.map((c, i) => `${c.toFixed(3)}·x^${i}`).join(" + ")} &nbsp; · &nbsp; MSE ≈ {loss?.toFixed(4)}
        </div>
      )}
    </Panel>
  );
}