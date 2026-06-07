import { useState } from "react";
import { Panel } from "./Panel";
import { Button } from "@/components/ui/button";
import { useDataset } from "@/lib/dataset-store";
import { describe, numericValues } from "@/lib/data/stats";
import { FileDown, Presentation, Eye, Palette } from "lucide-react";
import { toast } from "sonner";
import type PptxGenJS from "pptxgenjs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";

/* ─────────────────────── Theme system ─────────────────────── */
type Hex = string;
type Theme = {
  id: "gamma" | "frutigerAero" | "kawaii" | "cyberpunk";
  label: string;
  fontHead: string;   // PDF (helvetica/times/courier) — jsPDF built-ins
  fontBody: string;
  pptxFont: string;   // PPTX font face
  // hex (without #) for PPTX, also used in PDF via parseHex
  ink: Hex; surface: Hex; card: Hex; primary: Hex; accent: Hex; cyan: Hex; text: Hex; muted: Hex;
  vibe: string;
};

const THEMES: Record<Theme["id"], Theme> = {
  gamma: {
    id: "gamma", label: "Gamma · Aurora", vibe: "Premium dark editorial",
    fontHead: "helvetica", fontBody: "helvetica", pptxFont: "Calibri",
    ink: "0A081C", surface: "151028", card: "1E1640",
    primary: "7C5CFF", accent: "C25CFF", cyan: "5CD0FF",
    text: "F0EEFF", muted: "9C9AB8",
  },
  frutigerAero: {
    id: "frutigerAero", label: "Frutiger Aero · Glass", vibe: "Glossy aqua-sky 2000s",
    fontHead: "helvetica", fontBody: "helvetica", pptxFont: "Segoe UI",
    ink: "E8F6FF", surface: "FFFFFF", card: "DDF0FB",
    primary: "1FA7E0", accent: "7CD66B", cyan: "B6EAFD",
    text: "0E2A3F", muted: "5C7A8C",
  },
  kawaii: {
    id: "kawaii", label: "Kawaii · Pastel", vibe: "Soft pink, candy, friendly",
    fontHead: "times", fontBody: "helvetica", pptxFont: "Comic Sans MS",
    ink: "FFF0F6", surface: "FFFFFF", card: "FFE0EC",
    primary: "FF7AB6", accent: "B98CFF", cyan: "FFD36E",
    text: "5B2A4A", muted: "B27695",
  },
  cyberpunk: {
    id: "cyberpunk", label: "Cyberpunk · Neon", vibe: "Hot neon, scanlines, noir",
    fontHead: "courier", fontBody: "courier", pptxFont: "Consolas",
    ink: "07020F", surface: "120723", card: "1C0B36",
    primary: "FF2E88", accent: "00F0FF", cyan: "F8E63A",
    text: "F2F2FF", muted: "A38BD6",
  },
};

const hexToRgb = (h: Hex): readonly [number, number, number] => {
  const v = h.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};

export function ExportPanel() {
  const { dataset } = useDataset();
  const [themeId, setThemeId] = useState<Theme["id"]>("gamma");
  const [previewOpen, setPreviewOpen] = useState(false);
  const theme = THEMES[themeId];

  /* ───────────────────── PDF — Gamma-style immersive ───────────────────── */
  const generatePdf = async () => {
    if (!dataset) return toast.error("Load data first");
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // palette (from selected theme)
    const INK = hexToRgb(theme.ink);
    const SURFACE = hexToRgb(theme.surface);
    const CARD = hexToRgb(theme.card);
    const PRIMARY = hexToRgb(theme.primary);
    const ACCENT = hexToRgb(theme.accent);
    const CYAN = hexToRgb(theme.cyan);
    const TEXT = hexToRgb(theme.text);
    const MUTED = hexToRgb(theme.muted);
    const HEAD = theme.fontHead;
    const BODY = theme.fontBody;

    const fill = (rgb: readonly number[]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    const stroke = (rgb: readonly number[]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    const text = (rgb: readonly number[]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

    /* — Page 1: full-bleed hero cover — */
    fill(INK); doc.rect(0, 0, W, H, "F");
    // gradient "aurora" simulated via stacked translucent ellipses
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      const r = 220 - i * 6;
      doc.setFillColor(Math.max(0, PRIMARY[0] - i * 3), Math.max(0, PRIMARY[1] - i * 2), Math.max(0, PRIMARY[2] - i * 4));
      doc.setGState(new (doc as any).GState({ opacity: 0.06 + (1 - t) * 0.05 }));
      doc.ellipse(W * 0.85, H * 0.15, r, r * 0.7, "F");
    }
    for (let i = 0; i < 14; i++) {
      doc.setFillColor(Math.max(0, ACCENT[0] - i * 4), Math.max(0, ACCENT[1] - i * 2), Math.max(0, ACCENT[2] - i * 6));
      doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
      doc.ellipse(W * 0.1, H * 0.9, 200 - i * 7, 160 - i * 6, "F");
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // grid lines (subtle, derived from primary)
    stroke([Math.round(PRIMARY[0] * 0.4), Math.round(PRIMARY[1] * 0.4), Math.round(PRIMARY[2] * 0.4)]);
    doc.setLineWidth(0.3);
    for (let y = 0; y < H; y += 28) doc.line(0, y, W, y);

    // brand chip
    fill(PRIMARY);
    doc.roundedRect(40, 56, 132, 22, 11, 11, "F");
    text([255, 255, 255]); doc.setFontSize(8); doc.setFont(HEAD, "bold");
    doc.text(`NEO · ${theme.label.toUpperCase()}`, 50, 71);

    // huge title
    text(TEXT); doc.setFont(HEAD, "bold"); doc.setFontSize(58);
    doc.text("Executive", 40, H * 0.42);
    text(ACCENT); doc.text("Data Report", 40, H * 0.42 + 60);

    // tagline
    text(MUTED); doc.setFont(BODY, "normal"); doc.setFontSize(13);
    doc.text(`${theme.vibe} — generated entirely in-browser.`, 40, H * 0.42 + 92, { maxWidth: W - 80 });

    // meta strip
    const metaY = H - 140;
    fill(SURFACE); doc.roundedRect(40, metaY, W - 80, 80, 14, 14, "F");
    stroke(PRIMARY); doc.setLineWidth(0.8);
    doc.roundedRect(40, metaY, W - 80, 80, 14, 14, "S");

    const metaCol = (label: string, value: string, x: number) => {
      text(MUTED); doc.setFontSize(8); doc.setFont(HEAD, "bold");
      doc.text(label.toUpperCase(), x, metaY + 26);
      text(TEXT); doc.setFontSize(14); doc.setFont(HEAD, "bold");
      doc.text(value, x, metaY + 50, { maxWidth: 150 });
    };
    metaCol("Dataset", dataset.name, 60);
    metaCol("Rows", dataset.rows.length.toLocaleString(), 240);
    metaCol("Columns", String(dataset.columns.length), 360);
    metaCol("Generated", new Date().toLocaleDateString(), 460);

    text(MUTED); doc.setFontSize(8); doc.setFont(BODY, "normal");
    doc.text("Crafted by Nullhermit", W - 40, H - 30, { align: "right" });

    /* — Page 2: KPI grid + narrative — */
    doc.addPage();
    fill(INK); doc.rect(0, 0, W, H, "F");

    // top accent band
    fill(PRIMARY); doc.rect(0, 0, W, 4, "F");
    fill(ACCENT); doc.rect(0, 4, W * 0.4, 2, "F");

    text(MUTED); doc.setFontSize(8); doc.setFont(HEAD, "bold");
    doc.text("01 · OVERVIEW", 40, 40);
    text(TEXT); doc.setFontSize(28); doc.setFont(HEAD, "bold");
    doc.text("At a glance", 40, 72);

    const nums = dataset.columns.filter((c) => c.type === "numeric");
    const cats = dataset.columns.filter((c) => c.type === "categorical");
    const stats = nums.map((c) => ({ name: c.name, s: describe(numericValues(dataset.rows, c.name)) }));
    const totalSum = stats.reduce((a, b) => a + (b.s.mean * b.s.n || 0), 0);

    const kpis = [
      { label: "Observations", value: dataset.rows.length.toLocaleString(), tint: PRIMARY },
      { label: "Numeric Fields", value: String(nums.length), tint: ACCENT },
      { label: "Categorical", value: String(cats.length), tint: CYAN },
      { label: "Aggregate Σ", value: totalSum.toLocaleString(undefined, { maximumFractionDigits: 0 }), tint: PRIMARY },
    ];
    const cardW = (W - 80 - 30) / 4;
    kpis.forEach((k, i) => {
      const x = 40 + i * (cardW + 10);
      fill(CARD); doc.roundedRect(x, 96, cardW, 92, 10, 10, "F");
      fill(k.tint); doc.roundedRect(x, 96, 4, 92, 2, 2, "F");
      text(MUTED); doc.setFontSize(8); doc.setFont(HEAD, "bold");
      doc.text(k.label.toUpperCase(), x + 16, 118);
      text(TEXT); doc.setFontSize(24); doc.setFont(HEAD, "bold");
      doc.text(k.value, x + 16, 156);
      text(MUTED); doc.setFontSize(8); doc.setFont(BODY, "normal");
      doc.text("vs prior · n/a", x + 16, 174);
    });

    // narrative card
    fill(SURFACE); doc.roundedRect(40, 208, W - 80, 110, 10, 10, "F");
    text(ACCENT); doc.setFontSize(9); doc.setFont(HEAD, "bold");
    doc.text("EXECUTIVE NARRATIVE", 56, 230);
    text(TEXT); doc.setFontSize(11); doc.setFont(BODY, "normal");
    doc.text(
      `${dataset.name} contains ${dataset.rows.length.toLocaleString()} observations across ${dataset.columns.length} dimensions. ` +
      `The numeric surface area is dominated by ${stats[0]?.name ?? "—"}, while categorical breadth comes from ${cats.slice(0, 3).map((c) => c.name).join(", ") || "—"}. ` +
      `Distributional behaviour suggests the data is fit for descriptive inference and downstream modelling within the Neo Analytics engine.`,
      56, 252, { maxWidth: W - 112, lineHeightFactor: 1.5 }
    );

    // observation table
    text(MUTED); doc.setFontSize(8); doc.setFont(HEAD, "bold");
    doc.text("02 · OBSERVATIONS", 40, 348);
    text(TEXT); doc.setFontSize(20); doc.setFont(HEAD, "bold");
    doc.text("Descriptive statistics", 40, 372);

    autoTable(doc, {
      startY: 388,
      head: [["Column", "n", "Mean", "Median", "Std Dev", "Min", "Max"]],
      body: stats.map(({ name, s }) => [
        name, s.n,
        s.mean.toFixed(3), s.median.toFixed(3), s.stdev.toFixed(3),
        s.min.toFixed(2), s.max.toFixed(2),
      ]),
      theme: "plain",
      margin: { left: 40, right: 40 },
      headStyles: { fillColor: [PRIMARY[0], PRIMARY[1], PRIMARY[2]], textColor: 255, fontStyle: "bold", fontSize: 9, cellPadding: 8 },
      bodyStyles: { fillColor: [CARD[0], CARD[1], CARD[2]], textColor: [TEXT[0], TEXT[1], TEXT[2]], fontSize: 9, cellPadding: 8, lineColor: [60, 50, 110], lineWidth: 0.3 },
      alternateRowStyles: { fillColor: [SURFACE[0], SURFACE[1], SURFACE[2]] },
    });

    // footer
    text(MUTED); doc.setFontSize(8);
    doc.text("Neo Analytics · Page 2", 40, H - 24);
    doc.text("Crafted by Nullhermit", W - 40, H - 24, { align: "right" });

    /* — Page 3: inference + visual bars — */
    doc.addPage();
    fill(INK); doc.rect(0, 0, W, H, "F");
    fill(ACCENT); doc.rect(0, 0, W, 4, "F");

    text(MUTED); doc.setFontSize(8); doc.setFont(HEAD, "bold");
    doc.text("03 · INFERENCE", 40, 40);
    text(TEXT); doc.setFontSize(28); doc.setFont(HEAD, "bold");
    doc.text("Distributional fingerprint", 40, 72);

    // horizontal bar viz of means
    const top = stats.slice(0, 6);
    const maxMean = Math.max(1, ...top.map((t) => Math.abs(t.s.mean)));
    const chartX = 40, chartY = 100, chartW = W - 80, rowH = 36;
    fill(SURFACE); doc.roundedRect(chartX, chartY, chartW, top.length * rowH + 24, 10, 10, "F");
    top.forEach((t, i) => {
      const y = chartY + 16 + i * rowH;
      const barMax = chartW - 200;
      const w = (Math.abs(t.s.mean) / maxMean) * barMax;
      text(TEXT); doc.setFontSize(9); doc.setFont(HEAD, "bold");
      doc.text(t.name, chartX + 16, y + 16, { maxWidth: 130 });
      fill(CARD); doc.roundedRect(chartX + 160, y + 6, barMax, 14, 7, 7, "F");
      const tint = i % 2 ? ACCENT : PRIMARY;
      fill(tint); doc.roundedRect(chartX + 160, y + 6, Math.max(6, w), 14, 7, 7, "F");
      text(MUTED); doc.setFontSize(8); doc.setFont(BODY, "normal");
      doc.text(`μ ${t.s.mean.toFixed(2)}  σ ${t.s.stdev.toFixed(2)}`, chartX + 170 + barMax, y + 16, { align: "right" });
    });

    /* — 2D line chart (sparkline of first numeric column) — */
    const tkY = chartY + top.length * rowH + 56;
    if (nums.length) {
      const series = numericValues(dataset.rows, nums[0].name).slice(0, 60);
      const sMin = Math.min(...series), sMax = Math.max(...series);
      const range = sMax - sMin || 1;
      const lcX = 40, lcY = tkY, lcW = W - 80, lcH = 90;
      fill(SURFACE); doc.roundedRect(lcX, lcY, lcW, lcH, 10, 10, "F");
      text(MUTED); doc.setFontSize(8); doc.setFont(HEAD, "bold");
      doc.text(`2D TREND · ${nums[0].name.toUpperCase()}`, lcX + 14, lcY + 16);
      stroke(PRIMARY); doc.setLineWidth(1.5);
      const px = (i: number) => lcX + 14 + (i / Math.max(1, series.length - 1)) * (lcW - 28);
      const py = (v: number) => lcY + lcH - 14 - ((v - sMin) / range) * (lcH - 36);
      for (let i = 1; i < series.length; i++) doc.line(px(i - 1), py(series[i - 1]), px(i), py(series[i]));
      fill(ACCENT);
      series.forEach((v, i) => doc.circle(px(i), py(v), 1.4, "F"));
    }

    // takeaways
    const tkY2 = (nums.length ? tkY + 110 : tkY);
    text(MUTED); doc.setFontSize(8); doc.setFont(HEAD, "bold");
    doc.text("KEY TAKEAWAYS", 40, tkY2);
    const takeaways = [
      "The dataset is entirely processed client-side — zero round-trips, zero latency.",
      "Variance differs sharply across numeric columns; standardisation is advised before modelling.",
      "Categorical breadth supports segmentation analysis in the Workspace.",
      "Inferences scale to >100k rows without leaving the browser sandbox.",
    ];
    takeaways.forEach((line, i) => {
      const y = tkY2 + 22 + i * 22;
      fill(PRIMARY); doc.circle(48, y - 4, 3, "F");
      text(TEXT); doc.setFontSize(11); doc.setFont(BODY, "normal");
      doc.text(line, 62, y, { maxWidth: W - 100 });
    });

    text(MUTED); doc.setFontSize(8);
    doc.text("Neo Analytics · Page 3", 40, H - 24);
    doc.text("Crafted by Nullhermit", W - 40, H - 24, { align: "right" });

    doc.save(`${dataset.name.replace(/\.[^.]+$/, "")}_${theme.id}.pdf`);
    toast.success(`PDF generated · ${theme.label}`);
  };

  /* ──────────────────── PPTX — Gamma-style immersive ──────────────────── */
  const generatePptx = async () => {
    if (!dataset) return toast.error("Load data first");
    const pptxgen = (await import("pptxgenjs")).default;
    const pres = new pptxgen();
    pres.layout = "LAYOUT_WIDE"; // 13.33 × 7.5
    pres.theme = { headFontFace: theme.pptxFont, bodyFontFace: theme.pptxFont };

    const FF = theme.pptxFont;
    const INK = theme.ink;
    const SURFACE = theme.surface;
    const CARD = theme.card;
    const PRIMARY = theme.primary;
    const ACCENT = theme.accent;
    const CYAN = theme.cyan;
    const TEXT = theme.text;
    const MUTED = theme.muted;

    const auroraBg = (s: PptxGenJS.Slide) => {
      s.background = { color: INK };
      // soft "blobs"
      s.addShape("ellipse", { x: 9.5, y: -1.5, w: 6, h: 6, fill: { color: PRIMARY, transparency: 80 }, line: { color: INK, width: 0 } });
      s.addShape("ellipse", { x: -1, y: 4.5, w: 5, h: 5, fill: { color: ACCENT, transparency: 82 }, line: { color: INK, width: 0 } });
      s.addShape("ellipse", { x: 4.5, y: 5.5, w: 4, h: 4, fill: { color: CYAN, transparency: 88 }, line: { color: INK, width: 0 } });
    };
    const chip = (s: PptxGenJS.Slide, label: string, x: number, y: number, color = PRIMARY) => {
      s.addShape("roundRect", { x, y, w: 1.7, h: 0.32, fill: { color }, line: { color, width: 0 }, rectRadius: 0.16 });
      s.addText(label, { x, y, w: 1.7, h: 0.32, color: "FFFFFF", fontSize: 9, bold: true, align: "center", valign: "middle", fontFace: FF });
    };
    const footer = (s: PptxGenJS.Slide, page: string) => {
      s.addText(`Neo Analytics · ${page}`, { x: 0.5, y: 7.05, w: 6, h: 0.3, color: MUTED, fontSize: 9 });
      s.addText("Crafted by Nullhermit", { x: 6.8, y: 7.05, w: 6, h: 0.3, color: MUTED, fontSize: 9, align: "right" });
    };

    const nums = dataset.columns.filter((c) => c.type === "numeric");
    const cats = dataset.columns.filter((c) => c.type === "categorical");
    const stats = nums.map((c) => ({ name: c.name, s: describe(numericValues(dataset.rows, c.name)) }));

    /* — Slide 1: hero cover — */
    const s1 = pres.addSlide();
    auroraBg(s1);
    s1.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: PRIMARY }, line: { color: PRIMARY, width: 0 } });
    chip(s1, `NEO · ${theme.label.toUpperCase()}`, 0.5, 0.5);
    s1.addText("Executive", { x: 0.5, y: 1.6, w: 12, h: 1.4, color: TEXT, fontSize: 84, bold: true, fontFace: FF });
    s1.addText("Data Report", { x: 0.5, y: 2.9, w: 12, h: 1.4, color: ACCENT, fontSize: 84, bold: true, fontFace: FF });
    s1.addText(`${theme.vibe} — generated entirely in-browser.`, { x: 0.5, y: 4.35, w: 11, h: 0.5, color: MUTED, fontSize: 18, fontFace: FF });

    // meta strip
    s1.addShape("roundRect", { x: 0.5, y: 5.3, w: 12.33, h: 1.2, fill: { color: SURFACE }, line: { color: PRIMARY, width: 1 }, rectRadius: 0.12 });
    const meta = [
      ["DATASET", dataset.name],
      ["ROWS", dataset.rows.length.toLocaleString()],
      ["COLUMNS", String(dataset.columns.length)],
      ["GENERATED", new Date().toLocaleDateString()],
    ];
    meta.forEach(([k, v], i) => {
      const x = 0.7 + i * 3.05;
      s1.addText(k, { x, y: 5.45, w: 2.9, h: 0.3, color: MUTED, fontSize: 9, bold: true, fontFace: FF });
      s1.addText(v, { x, y: 5.75, w: 2.9, h: 0.6, color: TEXT, fontSize: 16, bold: true, fontFace: FF });
    });
    footer(s1, "Cover");

    /* — Slide 2: KPIs — */
    const s2 = pres.addSlide();
    auroraBg(s2);
    chip(s2, "01 · OVERVIEW", 0.5, 0.4);
    s2.addText("At a glance", { x: 0.5, y: 0.85, w: 12, h: 0.8, color: TEXT, fontSize: 40, bold: true, fontFace: FF });

    const kpis = [
      { k: "Observations", v: dataset.rows.length.toLocaleString(), tint: PRIMARY },
      { k: "Numeric Fields", v: String(nums.length), tint: ACCENT },
      { k: "Categorical", v: String(cats.length), tint: CYAN },
      { k: "Aggregate Σ", v: stats.reduce((a, b) => a + (b.s.mean * b.s.n || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 }), tint: PRIMARY },
    ];
    kpis.forEach((k, i) => {
      const x = 0.5 + i * 3.13;
      s2.addShape("roundRect", { x, y: 2.0, w: 3.0, h: 1.8, fill: { color: CARD }, line: { color: CARD, width: 0 }, rectRadius: 0.14 });
      s2.addShape("roundRect", { x, y: 2.0, w: 0.08, h: 1.8, fill: { color: k.tint }, line: { color: k.tint, width: 0 }, rectRadius: 0.04 });
      s2.addText(k.k.toUpperCase(), { x: x + 0.25, y: 2.15, w: 2.7, h: 0.35, color: MUTED, fontSize: 10, bold: true, fontFace: FF });
      s2.addText(k.v, { x: x + 0.25, y: 2.55, w: 2.7, h: 1.0, color: TEXT, fontSize: 36, bold: true, fontFace: FF });
    });

    s2.addShape("roundRect", { x: 0.5, y: 4.2, w: 12.33, h: 2.4, fill: { color: SURFACE }, line: { color: SURFACE, width: 0 }, rectRadius: 0.14 });
    s2.addText("EXECUTIVE NARRATIVE", { x: 0.75, y: 4.35, w: 11, h: 0.3, color: ACCENT, fontSize: 10, bold: true, fontFace: FF });
    s2.addText(
      `${dataset.name} contains ${dataset.rows.length.toLocaleString()} observations across ${dataset.columns.length} dimensions. ` +
      `The numeric surface area is dominated by ${stats[0]?.name ?? "—"}, while categorical breadth comes from ${cats.slice(0, 3).map((c) => c.name).join(", ") || "—"}. ` +
      `Distributional behaviour supports descriptive inference and downstream modelling inside Neo Analytics.`,
      { x: 0.75, y: 4.7, w: 11.8, h: 1.7, color: TEXT, fontSize: 14, fontFace: FF, paraSpaceAfter: 6 }
    );
    footer(s2, "01 · Overview");

    /* — Slide 3: descriptive table — */
    const s3 = pres.addSlide();
    auroraBg(s3);
    chip(s3, "02 · OBSERVATIONS", 0.5, 0.4, ACCENT);
    s3.addText("Descriptive statistics", { x: 0.5, y: 0.85, w: 12, h: 0.8, color: TEXT, fontSize: 36, bold: true, fontFace: FF });

    const head = ["Column", "n", "Mean", "Median", "Std Dev", "Min", "Max"];
    const headRow = head.map((h) => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: PRIMARY }, fontSize: 12 } }));
    const bodyRows = stats.slice(0, 10).map(({ name, s }, i) => [
      { text: name, options: { color: TEXT, bold: true } },
      { text: String(s.n), options: { color: TEXT } },
      { text: s.mean.toFixed(2), options: { color: TEXT } },
      { text: s.median.toFixed(2), options: { color: TEXT } },
      { text: s.stdev.toFixed(2), options: { color: TEXT } },
      { text: s.min.toFixed(2), options: { color: TEXT } },
      { text: s.max.toFixed(2), options: { color: TEXT } },
    ].map((cell) => ({ ...cell, options: { ...cell.options, fill: { color: i % 2 ? SURFACE : CARD }, fontSize: 11 } })));
    s3.addTable([headRow, ...bodyRows], { x: 0.5, y: 1.9, w: 12.33, colW: [3.0, 1.2, 1.6, 1.6, 1.7, 1.4, 1.83], rowH: 0.42, fontFace: FF, border: { type: "solid", pt: 0.5, color: MUTED } });
    footer(s3, "02 · Observations");

    /* — Slide 4: 2D bar + 2D line chart side-by-side — */
    const s4 = pres.addSlide();
    auroraBg(s4);
    chip(s4, "03 · INFERENCE", 0.5, 0.4, CYAN);
    s4.addText("2D distributional fingerprint", { x: 0.5, y: 0.85, w: 12, h: 0.8, color: TEXT, fontSize: 36, bold: true, fontFace: FF });

    const top = stats.slice(0, 6);
    // bar chart
    s4.addShape("roundRect", { x: 0.5, y: 2.0, w: 6.1, h: 4.4, fill: { color: SURFACE }, line: { color: SURFACE, width: 0 }, rectRadius: 0.14 });
    s4.addText("Means by column", { x: 0.65, y: 2.1, w: 5.8, h: 0.3, color: MUTED, fontSize: 10, bold: true, fontFace: FF });
    if (top.length) {
      s4.addChart(pres.ChartType.bar, [{
        name: "Mean",
        labels: top.map((t) => t.name),
        values: top.map((t) => Number(t.s.mean.toFixed(3))),
      }], {
        x: 0.65, y: 2.4, w: 5.8, h: 3.9,
        chartColors: [PRIMARY, ACCENT, CYAN, PRIMARY, ACCENT, CYAN],
        chartColorsOpacity: 90,
        barDir: "bar",
        showLegend: false,
        showValue: true,
        dataLabelColor: TEXT,
        catAxisLabelColor: TEXT,
        valAxisLabelColor: MUTED,
        catAxisLabelFontSize: 11,
        valAxisLabelFontSize: 10,
        plotArea: { fill: { color: SURFACE } },
        valGridLine: { style: "solid", size: 0.5, color: MUTED },
        catGridLine: { style: "none" },
      } as any);
    }
    // line chart (first numeric)
    s4.addShape("roundRect", { x: 6.73, y: 2.0, w: 6.1, h: 4.4, fill: { color: SURFACE }, line: { color: SURFACE, width: 0 }, rectRadius: 0.14 });
    s4.addText(nums[0] ? `Trend · ${nums[0].name}` : "Trend", { x: 6.88, y: 2.1, w: 5.8, h: 0.3, color: MUTED, fontSize: 10, bold: true, fontFace: FF });
    if (nums.length) {
      const series = numericValues(dataset.rows, nums[0].name).slice(0, 40);
      s4.addChart(pres.ChartType.line, [{
        name: nums[0].name,
        labels: series.map((_, i) => String(i + 1)),
        values: series.map((v) => Number(v.toFixed(3))),
      }], {
        x: 6.88, y: 2.4, w: 5.8, h: 3.9,
        chartColors: [ACCENT],
        lineDataSymbol: "circle",
        lineSize: 2,
        showLegend: false,
        catAxisLabelColor: MUTED,
        valAxisLabelColor: MUTED,
        catAxisLabelFontSize: 8,
        valAxisLabelFontSize: 9,
        plotArea: { fill: { color: SURFACE } },
        valGridLine: { style: "solid", size: 0.5, color: MUTED },
      } as any);
    }
    footer(s4, "03 · Inference");

    /* — Slide 5: 2D pie chart of categorical share — */
    const s5 = pres.addSlide();
    auroraBg(s5);
    chip(s5, "04 · COMPOSITION", 0.5, 0.4, ACCENT);
    s5.addText("Share of mix", { x: 0.5, y: 0.85, w: 12, h: 0.8, color: TEXT, fontSize: 40, bold: true, fontFace: FF });
    s5.addShape("roundRect", { x: 0.5, y: 1.9, w: 12.33, h: 4.8, fill: { color: SURFACE }, line: { color: SURFACE, width: 0 }, rectRadius: 0.14 });
    if (cats.length) {
      const counts = new Map<string, number>();
      dataset.rows.forEach((r) => {
        const v = String(r[cats[0].name] ?? "—");
        counts.set(v, (counts.get(v) ?? 0) + 1);
      });
      const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
      s5.addChart(pres.ChartType.doughnut, [{
        name: cats[0].name,
        labels: entries.map((e) => e[0]),
        values: entries.map((e) => e[1]),
      }], {
        x: 0.8, y: 2.1, w: 11.7, h: 4.5,
        chartColors: [PRIMARY, ACCENT, CYAN, "F472B6", "60A5FA", "34D399"],
        showLegend: true,
        legendPos: "r",
        legendColor: TEXT,
        legendFontFace: FF,
        dataLabelColor: TEXT,
        showPercent: true,
        holeSize: 55,
      } as any);
    } else {
      s5.addText("No categorical columns found.", { x: 0.8, y: 3.5, w: 11.7, h: 1, color: MUTED, fontSize: 18, align: "center", fontFace: FF });
    }
    footer(s5, "04 · Composition");

    /* — Slide 6: takeaways grid — */
    const s5b = pres.addSlide();
    auroraBg(s5b);
    chip(s5b, "05 · TAKEAWAYS", 0.5, 0.4);
    s5b.addText("What to do next", { x: 0.5, y: 0.85, w: 12, h: 0.8, color: TEXT, fontSize: 40, bold: true, fontFace: FF });
    const takeaways = [
      { t: "Zero-latency analysis", d: "Engine processes every row client-side — no server round-trips." },
      { t: "Standardise before modelling", d: "Variance differs sharply; z-score normalisation will stabilise models." },
      { t: "Segment with confidence", d: `Categorical breadth from ${cats.slice(0, 2).map((c) => c.name).join(" & ") || "your fields"} unlocks cohort splits.` },
      { t: "Scale to 100k+ rows", d: "Vector engine keeps interactive frame-rates on commodity laptops." },
    ];
    takeaways.forEach((it, i) => {
      const row = Math.floor(i / 2), col = i % 2;
      const x = 0.5 + col * 6.3, y = 2.0 + row * 2.2;
      s5b.addShape("roundRect", { x, y, w: 6.0, h: 1.9, fill: { color: CARD }, line: { color: CARD, width: 0 }, rectRadius: 0.14 });
      s5b.addShape("ellipse", { x: x + 0.3, y: y + 0.3, w: 0.5, h: 0.5, fill: { color: i % 2 ? ACCENT : PRIMARY }, line: { color: SURFACE, width: 0 } });
      s5b.addText(String(i + 1), { x: x + 0.3, y: y + 0.3, w: 0.5, h: 0.5, color: "FFFFFF", bold: true, fontSize: 14, align: "center", valign: "middle", fontFace: FF });
      s5b.addText(it.t, { x: x + 1.0, y: y + 0.25, w: 4.8, h: 0.45, color: TEXT, fontSize: 16, bold: true, fontFace: FF });
      s5b.addText(it.d, { x: x + 1.0, y: y + 0.75, w: 4.8, h: 1.1, color: MUTED, fontSize: 11, fontFace: FF });
    });
    footer(s5b, "05 · Takeaways");

    /* — Outro — */
    const s6 = pres.addSlide();
    auroraBg(s6);
    s6.addText("Thank you.", { x: 0.5, y: 2.6, w: 12, h: 1.2, color: TEXT, fontSize: 84, bold: true, fontFace: FF });
    s6.addText(`Built with Neo Analytics · ${theme.label} — crafted by Nullhermit`, { x: 0.5, y: 4.0, w: 12, h: 0.5, color: ACCENT, fontSize: 20, fontFace: FF });
    s6.addShape("rect", { x: 0.5, y: 4.7, w: 2.5, h: 0.06, fill: { color: PRIMARY }, line: { color: PRIMARY, width: 0 } });

    await pres.writeFile({ fileName: `${dataset.name.replace(/\.[^.]+$/, "")}_${theme.id}.pptx` });
    toast.success(`Deck generated · ${theme.label}`);
  };

  return (
    <Panel title="Export Suite" subtitle="Choose a visual style · PDF & PPTX with 2D charts">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Style</span>
          <Select value={themeId} onValueChange={(v) => setThemeId(v as Theme["id"])}>
            <SelectTrigger className="bg-background/60 flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(THEMES).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.label} — {t.vibe}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4 mr-1" /> Preview
          </Button>
        </div>

        {/* live style preview swatch */}
        <div
          className="rounded-lg p-3 border"
          style={{ background: `#${theme.ink}`, borderColor: `#${theme.primary}55` }}
        >
          <div className="flex items-center gap-2 mb-2">
            {[theme.primary, theme.accent, theme.cyan, theme.card].map((c) => (
              <div key={c} className="size-5 rounded" style={{ background: `#${c}` }} />
            ))}
            <span className="text-[10px] uppercase tracking-widest ml-auto" style={{ color: `#${theme.muted}`, fontFamily: theme.pptxFont }}>
              {theme.pptxFont}
            </span>
          </div>
          <div style={{ color: `#${theme.text}`, fontFamily: theme.pptxFont }} className="font-bold text-lg leading-tight">
            Executive <span style={{ color: `#${theme.accent}` }}>Data Report</span>
          </div>
          <div style={{ color: `#${theme.muted}`, fontFamily: theme.pptxFont }} className="text-[11px]">
            {theme.vibe}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" onClick={generatePdf} className="bg-[image:var(--gradient-hero)] text-primary-foreground glow-primary">
            <FileDown className="size-4 mr-2" /> Generate PDF Report
          </Button>
          <Button type="button" onClick={generatePptx} variant="outline" className="neon-border">
            <Presentation className="size-4 mr-2" /> Build PPTX Deck
          </Button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export style preview · {theme.label}</DialogTitle>
            <DialogDescription>
              1:1 mockup of the cover slide for the selected style. Close and click Generate to export.
            </DialogDescription>
          </DialogHeader>
          <div
            className="rounded-xl p-8 aspect-video relative overflow-hidden"
            style={{ background: `#${theme.ink}`, fontFamily: theme.pptxFont }}
          >
            <div className="absolute -top-20 -right-20 size-60 rounded-full opacity-30 blur-2xl" style={{ background: `#${theme.primary}` }} />
            <div className="absolute -bottom-20 -left-20 size-52 rounded-full opacity-30 blur-2xl" style={{ background: `#${theme.accent}` }} />
            <div className="relative">
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: `#${theme.primary}`, color: "#fff" }}>
                NEO · {theme.label.toUpperCase()}
              </div>
              <div className="mt-6 text-5xl font-extrabold leading-none" style={{ color: `#${theme.text}` }}>Executive</div>
              <div className="text-5xl font-extrabold leading-none" style={{ color: `#${theme.accent}` }}>Data Report</div>
              <div className="mt-3 text-sm" style={{ color: `#${theme.muted}` }}>{theme.vibe}</div>
              <div className="mt-6 grid grid-cols-4 gap-2">
                {["DATASET", "ROWS", "COLUMNS", "DATE"].map((k, i) => (
                  <div key={k} className="rounded p-2" style={{ background: `#${theme.card}` }}>
                    <div className="text-[8px] font-bold" style={{ color: `#${theme.muted}` }}>{k}</div>
                    <div className="text-sm font-bold" style={{ color: `#${theme.text}` }}>{["sample.csv","1,024","12","today"][i]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">This is a 1:1 preview of your cover slide. Click <strong>Generate</strong> to export the full report in this style.</p>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}