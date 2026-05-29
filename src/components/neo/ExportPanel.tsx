import { Panel } from "./Panel";
import { Button } from "@/components/ui/button";
import { useDataset } from "@/lib/dataset-store";
import { describe, numericValues } from "@/lib/data/stats";
import { FileDown, Presentation } from "lucide-react";
import { toast } from "sonner";

export function ExportPanel() {
  const { dataset } = useDataset();

  const generatePdf = async () => {
    if (!dataset) return toast.error("Load data first");
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Neo Analytics — Practical Lab Report", 14, 18);
    doc.setFontSize(10); doc.text(`Dataset: ${dataset.name}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

    doc.setFontSize(12); doc.text("Aim", 14, 44);
    doc.setFontSize(10); doc.text("To compute descriptive statistics and identify distributional properties of the given dataset.", 14, 50, { maxWidth: 180 });

    doc.setFontSize(12); doc.text("Apparatus Required", 14, 64);
    doc.setFontSize(10); doc.text("Neo Analytics v1.0 (browser-based engine), modern web browser with WebGL support.", 14, 70, { maxWidth: 180 });

    doc.setFontSize(12); doc.text("Formulae Used", 14, 84);
    doc.setFontSize(10);
    doc.text("x̄ = Σxᵢ/n   s² = Σ(xᵢ-x̄)²/(n-1)   s = √s²   SE = s/√n   CI₉₅ = x̄ ± 1.96·SE", 14, 90, { maxWidth: 180 });

    doc.setFontSize(12); doc.text("Observation Table", 14, 104);
    const nums = dataset.columns.filter((c) => c.type === "numeric");
    const body = nums.map((c) => {
      const s = describe(numericValues(dataset.rows, c.name));
      return [c.name, s.n, s.mean.toFixed(3), s.median.toFixed(3), s.stdev.toFixed(3), s.min.toFixed(2), s.max.toFixed(2)];
    });
    autoTable(doc, {
      startY: 108,
      head: [["Column", "n", "Mean", "Median", "Std Dev", "Min", "Max"]],
      body,
      headStyles: { fillColor: [124, 92, 255] },
      styles: { fontSize: 9 },
    });

    doc.setFontSize(12); doc.text("Inference", 14, (doc as any).lastAutoTable.finalY + 12);
    doc.setFontSize(10); doc.text(
      `The dataset exhibits the central tendency and dispersion summarized above. Numeric columns show varied scales of variability; further hypothesis testing and modeling can be applied within the Neo Analytics environment.`,
      14, (doc as any).lastAutoTable.finalY + 18, { maxWidth: 180 }
    );
    doc.save(`${dataset.name.replace(/\.[^.]+$/, "")}_lab_report.pdf`);
    toast.success("PDF lab report generated");
  };

  const generatePptx = async () => {
    if (!dataset) return toast.error("Load data first");
    const pptxgen = (await import("pptxgenjs")).default;
    const pres = new pptxgen();
    pres.layout = "LAYOUT_WIDE";
    const s1 = pres.addSlide();
    s1.background = { color: "0F0A24" };
    s1.addText("Neo Analytics", { x: 0.5, y: 1.6, fontSize: 54, color: "C25CFF", bold: true });
    s1.addText("Executive Findings — v1.0", { x: 0.5, y: 2.6, fontSize: 22, color: "FFFFFF" });
    s1.addText(dataset.name, { x: 0.5, y: 3.4, fontSize: 16, color: "9C9AB8" });

    const s2 = pres.addSlide();
    s2.background = { color: "151028" };
    s2.addText("Dataset Summary", { x: 0.5, y: 0.3, fontSize: 28, color: "7C5CFF", bold: true });
    const nums = dataset.columns.filter((c) => c.type === "numeric");
    const rows: string[][] = [["Column", "n", "Mean", "Std Dev", "Min", "Max"]];
    for (const c of nums) {
      const s = describe(numericValues(dataset.rows, c.name));
      rows.push([c.name, String(s.n), s.mean.toFixed(2), s.stdev.toFixed(2), s.min.toFixed(2), s.max.toFixed(2)]);
    }
    const tableRows = rows.map((r) => r.map((cell) => ({ text: cell })));
    s2.addTable(tableRows, { x: 0.5, y: 1.1, w: 12.3, fontSize: 12, color: "FFFFFF", fill: { color: "1E1640" }, border: { type: "solid", pt: 1, color: "4C3AA8" } });

    const s3 = pres.addSlide();
    s3.background = { color: "151028" };
    s3.addText("Key Inferences", { x: 0.5, y: 0.3, fontSize: 28, color: "7C5CFF", bold: true });
    s3.addText([
      { text: "• Engine processed dataset entirely client-side (zero server lag).\n", options: { color: "FFFFFF", fontSize: 18 } },
      { text: "• Variance and skewness highlighted in the executive memo panel.\n", options: { color: "FFFFFF", fontSize: 18 } },
      { text: "• Predictive regression models available on demand.", options: { color: "FFFFFF", fontSize: 18 } },
    ], { x: 0.5, y: 1.3, w: 12, h: 5 });

    await pres.writeFile({ fileName: `${dataset.name.replace(/\.[^.]+$/, "")}_executive.pptx` });
    toast.success("PPTX deck generated");
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