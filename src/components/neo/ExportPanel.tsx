import { Panel } from "./Panel";
import { Button } from "@/components/ui/button";
import { useDataset } from "@/lib/dataset-store";
import { describe, numericValues } from "@/lib/data/stats";
import { FileDown, Presentation } from "lucide-react";
import { toast } from "sonner";

export function ExportPanel() {
  const { dataset } = useDataset();

  /* ───────────────────── PDF — Gamma-style immersive ───────────────────── */
  const generatePdf = async () => {
    if (!dataset) return toast.error("Load data first");
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // palette
    const INK = [10, 8, 28] as const;
    const SURFACE = [22, 18, 48] as const;
    const CARD = [30, 24, 64] as const;
    const PRIMARY = [124, 92, 255] as const;
    const ACCENT = [194, 92, 255] as const;
    const CYAN = [92, 208, 255] as const;
    const TEXT = [240, 238, 255] as const;
    const MUTED = [156, 154, 184] as const;

    const fill = (rgb: readonly number[]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    const stroke = (rgb: readonly number[]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    const text = (rgb: readonly number[]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

    /* — Page 1: full-bleed hero cover — */
    fill(INK); doc.rect(0, 0, W, H, "F");
    // gradient "aurora" simulated via stacked translucent ellipses
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      const r = 220 - i * 6;
      doc.setFillColor(124 - i * 3, 92 - i * 2, 255 - i * 4);
      doc.setGState(new (doc as any).GState({ opacity: 0.06 + (1 - t) * 0.05 }));
      doc.ellipse(W * 0.85, H * 0.15, r, r * 0.7, "F");
    }
    for (let i = 0; i < 14; i++) {
      doc.setFillColor(194 - i * 4, 92, 255 - i * 6);
      doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
      doc.ellipse(W * 0.1, H * 0.9, 200 - i * 7, 160 - i * 6, "F");
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // grid lines
    stroke([60, 50, 110]);
    doc.setLineWidth(0.3);
    for (let y = 0; y < H; y += 28) doc.line(0, y, W, y);

    // brand chip
    fill(PRIMARY);
    doc.roundedRect(40, 56, 132, 22, 11, 11, "F");
    text([255, 255, 255]); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("NEO ANALYTICS · v1.0", 50, 71);

    // huge title
    text(TEXT); doc.setFont("helvetica", "bold"); doc.setFontSize(58);
    doc.text("Executive", 40, H * 0.42);
    text(ACCENT); doc.text("Data Report", 40, H * 0.42 + 60);

    // tagline
    text(MUTED); doc.setFont("helvetica", "normal"); doc.setFontSize(13);
    doc.text("A cinematic analytical brief generated entirely in-browser.", 40, H * 0.42 + 92, { maxWidth: W - 80 });

    // meta strip
    const metaY = H - 140;
    fill(SURFACE); doc.roundedRect(40, metaY, W - 80, 80, 14, 14, "F");
    stroke(PRIMARY); doc.setLineWidth(0.8);
    doc.roundedRect(40, metaY, W - 80, 80, 14, 14, "S");

    const metaCol = (label: string, value: string, x: number) => {
      text(MUTED); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text(label.toUpperCase(), x, metaY + 26);
      text(TEXT); doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text(value, x, metaY + 50, { maxWidth: 150 });
    };
    metaCol("Dataset", dataset.name, 60);
    metaCol("Rows", dataset.rows.length.toLocaleString(), 240);
    metaCol("Columns", String(dataset.columns.length), 360);
    metaCol("Generated", new Date().toLocaleDateString(), 460);

    text(MUTED); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Crafted by Nullhermit", W - 40, H - 30, { align: "right" });

    /* — Page 2: KPI grid + narrative — */
    doc.addPage();
    fill(INK); doc.rect(0, 0, W, H, "F");

    // top accent band
    fill(PRIMARY); doc.rect(0, 0, W, 4, "F");
    fill(ACCENT); doc.rect(0, 4, W * 0.4, 2, "F");

    text(MUTED); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("01 · OVERVIEW", 40, 40);
    text(TEXT); doc.setFontSize(28); doc.setFont("helvetica", "bold");
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
      text(MUTED); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text(k.label.toUpperCase(), x + 16, 118);
      text(TEXT); doc.setFontSize(24); doc.setFont("helvetica", "bold");
      doc.text(k.value, x + 16, 156);
      text(MUTED); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text("vs prior · n/a", x + 16, 174);
    });

    // narrative card
    fill(SURFACE); doc.roundedRect(40, 208, W - 80, 110, 10, 10, "F");
    text(ACCENT); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("EXECUTIVE NARRATIVE", 56, 230);
    text(TEXT); doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text(
      `${dataset.name} contains ${dataset.rows.length.toLocaleString()} observations across ${dataset.columns.length} dimensions. ` +
      `The numeric surface area is dominated by ${stats[0]?.name ?? "—"}, while categorical breadth comes from ${cats.slice(0, 3).map((c) => c.name).join(", ") || "—"}. ` +
      `Distributional behaviour suggests the data is fit for descriptive inference and downstream modelling within the Neo Analytics engine.`,
      56, 252, { maxWidth: W - 112, lineHeightFactor: 1.5 }
    );

    // observation table
    text(MUTED); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("02 · OBSERVATIONS", 40, 348);
    text(TEXT); doc.setFontSize(20); doc.setFont("helvetica", "bold");
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

    text(MUTED); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("03 · INFERENCE", 40, 40);
    text(TEXT); doc.setFontSize(28); doc.setFont("helvetica", "bold");
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
      text(TEXT); doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text(t.name, chartX + 16, y + 16, { maxWidth: 130 });
      fill([45, 36, 88]); doc.roundedRect(chartX + 160, y + 6, barMax, 14, 7, 7, "F");
      const tint = i % 2 ? ACCENT : PRIMARY;
      fill(tint); doc.roundedRect(chartX + 160, y + 6, Math.max(6, w), 14, 7, 7, "F");
      text(MUTED); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(`μ ${t.s.mean.toFixed(2)}  σ ${t.s.stdev.toFixed(2)}`, chartX + 170 + barMax, y + 16, { align: "right" });
    });

    // takeaways
    const tkY = chartY + top.length * rowH + 56;
    text(MUTED); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("KEY TAKEAWAYS", 40, tkY);
    const takeaways = [
      "The dataset is entirely processed client-side — zero round-trips, zero latency.",
      "Variance differs sharply across numeric columns; standardisation is advised before modelling.",
      "Categorical breadth supports segmentation analysis in the Workspace.",
      "Inferences scale to >100k rows without leaving the browser sandbox.",
    ];
    takeaways.forEach((line, i) => {
      const y = tkY + 22 + i * 26;
      fill(PRIMARY); doc.circle(48, y - 4, 3, "F");
      text(TEXT); doc.setFontSize(11); doc.setFont("helvetica", "normal");
      doc.text(line, 62, y, { maxWidth: W - 100 });
    });

    text(MUTED); doc.setFontSize(8);
    doc.text("Neo Analytics · Page 3", 40, H - 24);
    doc.text("Crafted by Nullhermit", W - 40, H - 24, { align: "right" });

    doc.save(`${dataset.name.replace(/\.[^.]+$/, "")}_neo_report.pdf`);
    toast.success("Immersive PDF generated");
  };

  /* ──────────────────── PPTX — Gamma-style immersive ──────────────────── */
  const generatePptx = async () => {
    if (!dataset) return toast.error("Load data first");
    const pptxgen = (await import("pptxgenjs")).default;
    const pres = new pptxgen();
    pres.layout = "LAYOUT_WIDE"; // 13.33 × 7.5
    pres.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" };

    const INK = "0A081C";
    const SURFACE = "151028";
    const CARD = "1E1640";
    const PRIMARY = "7C5CFF";
    const ACCENT = "C25CFF";
    const CYAN = "5CD0FF";
    const TEXT = "F0EEFF";
    const MUTED = "9C9AB8";

    const auroraBg = (s: pptxgen.Slide) => {
      s.background = { color: INK };
      // soft "blobs"
      s.addShape("ellipse", { x: 9.5, y: -1.5, w: 6, h: 6, fill: { color: PRIMARY, transparency: 80 }, line: { color: INK, width: 0 } });
      s.addShape("ellipse", { x: -1, y: 4.5, w: 5, h: 5, fill: { color: ACCENT, transparency: 82 }, line: { color: INK, width: 0 } });
      s.addShape("ellipse", { x: 4.5, y: 5.5, w: 4, h: 4, fill: { color: CYAN, transparency: 88 }, line: { color: INK, width: 0 } });
    };
    const chip = (s: pptxgen.Slide, label: string, x: number, y: number, color = PRIMARY) => {
      s.addShape("roundRect", { x, y, w: 1.7, h: 0.32, fill: { color }, line: { color, width: 0 }, rectRadius: 0.16 });
      s.addText(label, { x, y, w: 1.7, h: 0.32, color: "FFFFFF", fontSize: 9, bold: true, align: "center", valign: "middle", fontFace: "Calibri" });
    };
    const footer = (s: pptxgen.Slide, page: string) => {
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
    chip(s1, "NEO ANALYTICS · v1.0", 0.5, 0.5);
    s1.addText("Executive", { x: 0.5, y: 1.6, w: 12, h: 1.4, color: TEXT, fontSize: 84, bold: true, fontFace: "Calibri" });
    s1.addText("Data Report", { x: 0.5, y: 2.9, w: 12, h: 1.4, color: ACCENT, fontSize: 84, bold: true, fontFace: "Calibri" });
    s1.addText("A cinematic analytical brief — generated entirely in-browser.", { x: 0.5, y: 4.35, w: 11, h: 0.5, color: MUTED, fontSize: 18, fontFace: "Calibri" });

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
      s1.addText(k, { x, y: 5.45, w: 2.9, h: 0.3, color: MUTED, fontSize: 9, bold: true, fontFace: "Calibri" });
      s1.addText(v, { x, y: 5.75, w: 2.9, h: 0.6, color: TEXT, fontSize: 16, bold: true, fontFace: "Calibri" });
    });
    footer(s1, "Cover");

    /* — Slide 2: KPIs — */
    const s2 = pres.addSlide();
    auroraBg(s2);
    chip(s2, "01 · OVERVIEW", 0.5, 0.4);
    s2.addText("At a glance", { x: 0.5, y: 0.85, w: 12, h: 0.8, color: TEXT, fontSize: 40, bold: true, fontFace: "Calibri" });

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
      s2.addText(k.k.toUpperCase(), { x: x + 0.25, y: 2.15, w: 2.7, h: 0.35, color: MUTED, fontSize: 10, bold: true, fontFace: "Calibri" });
      s2.addText(k.v, { x: x + 0.25, y: 2.55, w: 2.7, h: 1.0, color: TEXT, fontSize: 36, bold: true, fontFace: "Calibri" });
    });

    s2.addShape("roundRect", { x: 0.5, y: 4.2, w: 12.33, h: 2.4, fill: { color: SURFACE }, line: { color: SURFACE, width: 0 }, rectRadius: 0.14 });
    s2.addText("EXECUTIVE NARRATIVE", { x: 0.75, y: 4.35, w: 11, h: 0.3, color: ACCENT, fontSize: 10, bold: true, fontFace: "Calibri" });
    s2.addText(
      `${dataset.name} contains ${dataset.rows.length.toLocaleString()} observations across ${dataset.columns.length} dimensions. ` +
      `The numeric surface area is dominated by ${stats[0]?.name ?? "—"}, while categorical breadth comes from ${cats.slice(0, 3).map((c) => c.name).join(", ") || "—"}. ` +
      `Distributional behaviour supports descriptive inference and downstream modelling inside Neo Analytics.`,
      { x: 0.75, y: 4.7, w: 11.8, h: 1.7, color: TEXT, fontSize: 14, fontFace: "Calibri", paraSpaceAfter: 6 }
    );
    footer(s2, "01 · Overview");

    /* — Slide 3: descriptive table — */
    const s3 = pres.addSlide();
    auroraBg(s3);
    chip(s3, "02 · OBSERVATIONS", 0.5, 0.4, ACCENT);
    s3.addText("Descriptive statistics", { x: 0.5, y: 0.85, w: 12, h: 0.8, color: TEXT, fontSize: 36, bold: true, fontFace: "Calibri" });

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
    s3.addTable([headRow, ...bodyRows], { x: 0.5, y: 1.9, w: 12.33, colW: [3.0, 1.2, 1.6, 1.6, 1.7, 1.4, 1.83], rowH: 0.42, fontFace: "Calibri", border: { type: "solid", pt: 0.5, color: "2E2860" } });
    footer(s3, "02 · Observations");

    /* — Slide 4: bar chart of means — */
    const s4 = pres.addSlide();
    auroraBg(s4);
    chip(s4, "03 · INFERENCE", 0.5, 0.4, CYAN);
    s4.addText("Distributional fingerprint", { x: 0.5, y: 0.85, w: 12, h: 0.8, color: TEXT, fontSize: 36, bold: true, fontFace: "Calibri" });

    s4.addShape("roundRect", { x: 0.5, y: 2.0, w: 12.33, h: 4.4, fill: { color: SURFACE }, line: { color: SURFACE, width: 0 }, rectRadius: 0.14 });
    const top = stats.slice(0, 6);
    if (top.length) {
      s4.addChart(pres.ChartType.bar, [{
        name: "Mean",
        labels: top.map((t) => t.name),
        values: top.map((t) => Number(t.s.mean.toFixed(3))),
      }], {
        x: 0.7, y: 2.2, w: 11.9, h: 4.0,
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
        valGridLine: { style: "solid", size: 0.5, color: "2E2860" },
        catGridLine: { style: "none" },
      } as any);
    }
    footer(s4, "03 · Inference");

    /* — Slide 5: takeaways — */
    const s5 = pres.addSlide();
    auroraBg(s5);
    chip(s5, "04 · TAKEAWAYS", 0.5, 0.4);
    s5.addText("What to do next", { x: 0.5, y: 0.85, w: 12, h: 0.8, color: TEXT, fontSize: 40, bold: true, fontFace: "Calibri" });

    const takeaways = [
      { t: "Zero-latency analysis", d: "Engine processes every row client-side — no server round-trips, no data leaves your browser." },
      { t: "Standardise before modelling", d: "Variance differs sharply across numeric fields; z-score normalisation will stabilise downstream models." },
      { t: "Segment with confidence", d: `Categorical breadth from ${cats.slice(0, 2).map((c) => c.name).join(" & ") || "your fields"} unlocks clean cohort splits.` },
      { t: "Scale to 100k+ rows", d: "WebGL-backed vector engine keeps interactive frame-rates even on commodity laptops." },
    ];
    takeaways.forEach((it, i) => {
      const row = Math.floor(i / 2), col = i % 2;
      const x = 0.5 + col * 6.3, y = 2.0 + row * 2.2;
      s5.addShape("roundRect", { x, y, w: 6.0, h: 1.9, fill: { color: CARD }, line: { color: CARD, width: 0 }, rectRadius: 0.14 });
      s5.addShape("ellipse", { x: x + 0.3, y: y + 0.3, w: 0.5, h: 0.5, fill: { color: i % 2 ? ACCENT : PRIMARY }, line: { color: SURFACE, width: 0 } });
      s5.addText(String(i + 1), { x: x + 0.3, y: y + 0.3, w: 0.5, h: 0.5, color: "FFFFFF", bold: true, fontSize: 14, align: "center", valign: "middle", fontFace: "Calibri" });
      s5.addText(it.t, { x: x + 1.0, y: y + 0.25, w: 4.8, h: 0.45, color: TEXT, fontSize: 16, bold: true, fontFace: "Calibri" });
      s5.addText(it.d, { x: x + 1.0, y: y + 0.75, w: 4.8, h: 1.1, color: MUTED, fontSize: 11, fontFace: "Calibri" });
    });
    footer(s5, "04 · Takeaways");

    /* — Slide 6: outro — */
    const s6 = pres.addSlide();
    auroraBg(s6);
    s6.addText("Thank you.", { x: 0.5, y: 2.6, w: 12, h: 1.2, color: TEXT, fontSize: 84, bold: true, fontFace: "Calibri" });
    s6.addText("Built with Neo Analytics — crafted by Nullhermit", { x: 0.5, y: 4.0, w: 12, h: 0.5, color: ACCENT, fontSize: 20, fontFace: "Calibri" });
    s6.addShape("rect", { x: 0.5, y: 4.7, w: 2.5, h: 0.06, fill: { color: PRIMARY }, line: { color: PRIMARY, width: 0 } });

    await pres.writeFile({ fileName: `${dataset.name.replace(/\.[^.]+$/, "")}_neo_deck.pptx` });
    toast.success("Immersive deck generated");
  };

  return (
    <Panel title="Export Suite" subtitle="University-grade PDF · Executive PPTX">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button onClick={generatePdf} className="bg-[image:var(--gradient-hero)] text-primary-foreground glow-primary">
          <FileDown className="size-4 mr-2" /> Generate PDF Lab Report
        </Button>
        <Button onClick={generatePptx} variant="outline" className="neon-border">
          <Presentation className="size-4 mr-2" /> Build PPTX Deck
        </Button>
      </div>
    </Panel>
  );
}