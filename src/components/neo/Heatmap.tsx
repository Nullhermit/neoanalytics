export function Heatmap({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const cols = Math.min(8, data.length);
  return (
    <div className="grid gap-1 h-full" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {data.slice(0, 64).map((d) => {
        const t = (d.value - min) / range;
        const hue = 280 - t * 80;
        return (
          <div
            key={d.name}
            className="rounded flex flex-col items-center justify-center p-1 text-[10px] font-mono"
            style={{ background: `hsl(${hue} 70% ${30 + t * 30}%)`, boxShadow: `inset 0 0 8px hsl(${hue} 80% 60% / ${t})` }}
            title={`${d.name}: ${d.value}`}
          >
            <div className="truncate w-full text-center text-white/90">{d.name}</div>
            <div className="text-white font-bold">{d.value.toFixed(0)}</div>
          </div>
        );
      })}
    </div>
  );
}