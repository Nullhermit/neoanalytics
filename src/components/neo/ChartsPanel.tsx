import { useMemo, useState } from "react";
import { Panel } from "./Panel";
import { useDataset } from "@/lib/dataset-store";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ScatterChart, Scatter, Legend,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { numericValues } from "@/lib/data/stats";
import { Heatmap } from "./Heatmap";
import { Viz3D, type Viz3DType } from "./Viz3D";
import { useWorkspaceMode } from "@/lib/workspace-mode";

const PALETTE = ["#7c5cff", "#c25cff", "#5cd0ff", "#5cffae", "#ffd55c", "#ff5c9d"];

export function ChartsPanel() {
  const { dataset } = useDataset();
  const { mode } = useWorkspaceMode();
  const [is3D, set3D] = useState(false);
  const [viz3d, setViz3d] = useState<Viz3DType>("bars");
  const numericCols = dataset?.columns.filter((c) => c.type === "numeric") ?? [];
  const catCols = dataset?.columns.filter((c) => c.type === "categorical") ?? [];
  const [xCol, setX] = useState("");
  const [yCol, setY] = useState("");

  const x = xCol || catCols[0]?.name || numericCols[0]?.name || "";
  const y = yCol || numericCols[0]?.name || "";

  const aggregated = useMemo(() => {
    if (!dataset || !x || !y) return [];
    const map = new Map<string, { sum: number; n: number }>();
    for (const r of dataset.rows) {
      const k = String(r[x] ?? "—");
      const v = typeof r[y] === "number" ? (r[y] as number) : NaN;
      if (!Number.isFinite(v)) continue;
      const cur = map.get(k) ?? { sum: 0, n: 0 };
      cur.sum += v; cur.n += 1; map.set(k, cur);
    }
    return Array.from(map.entries()).map(([k, v]) => ({ name: k, value: +(v.sum).toFixed(2), avg: +(v.sum / v.n).toFixed(2) })).slice(0, 30);
  }, [dataset, x, y]);

  const radarData = useMemo(() => aggregated.slice(0, 8).map((d) => ({ name: d.name, value: d.value })), [aggregated]);

  if (!dataset) return <Panel title="Visualizations"><p className="text-sm text-muted-foreground">Load a dataset to render charts.</p></Panel>;

  if (mode === "developer") {
    // Dev mode: minimize charts
    return (
      <Panel title="Throughput Metrics" subtitle="Raw aggregated view">
        <div className="h-[260px]">
          <ResponsiveContainer>
            <LineChart data={aggregated.slice(0, 60)}>
              <CartesianGrid stroke="#2a2548" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#8a87a8" fontSize={10} />
              <YAxis stroke="#8a87a8" fontSize={10} />
              <Tooltip contentStyle={{ background: "#1a1633", border: "1px solid #4c3aa8" }} />
              <Line type="monotone" dataKey="value" stroke="#5cd0ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Visualization Suite"
      subtitle="2D · 3D · WebGL-accelerated"
      action={
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            3D Engine <Switch checked={is3D} onCheckedChange={set3D} />
          </label>
          {is3D && (
            <Select value={viz3d} onValueChange={(v) => setViz3d(v as Viz3DType)}>
              <SelectTrigger className="h-8 w-[150px] bg-card/60 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bars">🧱 Glow Bars</SelectItem>
                <SelectItem value="skyline">🏙️ Skyline Ring</SelectItem>
                <SelectItem value="sphereCloud">🌌 Sphere Cloud</SelectItem>
                <SelectItem value="helix">🧬 DNA Helix</SelectItem>
                <SelectItem value="ribbon">🎗️ Neon Ribbon</SelectItem>
                <SelectItem value="rings">💫 Saturn Rings</SelectItem>
                <SelectItem value="spheres">🪐 Floating Spheres</SelectItem>
                <SelectItem value="tower">🗼 Spiral Tower</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={x} onValueChange={setX}>
            <SelectTrigger className="h-8 w-[120px] bg-card/60 text-xs"><SelectValue placeholder="X" /></SelectTrigger>
            <SelectContent>{dataset.columns.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={y} onValueChange={setY}>
            <SelectTrigger className="h-8 w-[120px] bg-card/60 text-xs"><SelectValue placeholder="Y" /></SelectTrigger>
            <SelectContent>{numericCols.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      }
    >
      {is3D ? (
        <div className="h-[420px]"><Viz3D data={aggregated} type={viz3d} /></div>
      ) : (
        <Tabs defaultValue="bar">
          <TabsList className="bg-card/60">
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="line">Line</TabsTrigger>
            <TabsTrigger value="pie">Pie</TabsTrigger>
            <TabsTrigger value="donut">Donut</TabsTrigger>
            <TabsTrigger value="radar">Radar</TabsTrigger>
            <TabsTrigger value="scatter">Scatter</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          </TabsList>
          <div className="h-[340px] mt-3">
            <TabsContent value="bar" className="h-full">
              <ResponsiveContainer>
                <BarChart data={aggregated}>
                  <CartesianGrid stroke="#2a2548" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#8a87a8" fontSize={10} />
                  <YAxis stroke="#8a87a8" fontSize={10} />
                  <Tooltip contentStyle={{ background: "#1a1633", border: "1px solid #4c3aa8" }} />
                  <Bar dataKey="value" fill="#7c5cff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="line" className="h-full">
              <ResponsiveContainer>
                <LineChart data={aggregated}>
                  <CartesianGrid stroke="#2a2548" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#8a87a8" fontSize={10} />
                  <YAxis stroke="#8a87a8" fontSize={10} />
                  <Tooltip contentStyle={{ background: "#1a1633", border: "1px solid #4c3aa8" }} />
                  <Line type="monotone" dataKey="value" stroke="#c25cff" strokeWidth={2.5} dot={{ fill: "#c25cff" }} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="pie" className="h-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={aggregated.slice(0, 8)} dataKey="value" nameKey="name" outerRadius={120} label>
                    {aggregated.slice(0, 8).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1633", border: "1px solid #4c3aa8" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="donut" className="h-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={aggregated.slice(0, 8)} dataKey="value" nameKey="name" outerRadius={120} innerRadius={70} paddingAngle={2}>
                    {aggregated.slice(0, 8).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1633", border: "1px solid #4c3aa8" }} />
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="radar" className="h-full">
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#3a2f6a" />
                  <PolarAngleAxis dataKey="name" stroke="#8a87a8" fontSize={10} />
                  <PolarRadiusAxis stroke="#8a87a8" fontSize={9} />
                  <Radar dataKey="value" stroke="#7c5cff" fill="#7c5cff" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="scatter" className="h-full">
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid stroke="#2a2548" strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="value" stroke="#8a87a8" fontSize={10} name={y} />
                  <YAxis type="number" dataKey="avg" stroke="#8a87a8" fontSize={10} name={`avg ${y}`} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#1a1633", border: "1px solid #4c3aa8" }} />
                  <Scatter data={aggregated} fill="#5cd0ff" />
                </ScatterChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="heatmap" className="h-full">
              <Heatmap data={aggregated} />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </Panel>
  );
}