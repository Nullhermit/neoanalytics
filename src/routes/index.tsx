import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ModeProvider, useWorkspaceMode } from "@/lib/workspace-mode";
import { DatasetProvider } from "@/lib/dataset-store";
import { Header } from "@/components/neo/Header";
import { DataPanel } from "@/components/neo/DataPanel";
import { StatsPanel } from "@/components/neo/StatsPanel";
import { ChartsPanel } from "@/components/neo/ChartsPanel";
import { HypothesisWizard } from "@/components/neo/HypothesisWizard";
import { ManualGrid } from "@/components/neo/ManualGrid";
import { SqlPanel } from "@/components/neo/SqlPanel";
import { ApiMockPanel } from "@/components/neo/ApiMockPanel";
import { LiveStream } from "@/components/neo/LiveStream";
import { MemoPanel } from "@/components/neo/MemoPanel";
import { MlPanel } from "@/components/neo/MlPanel";
import { ExportPanel } from "@/components/neo/ExportPanel";
import { AiInsights } from "@/components/neo/AiInsights";
import { Chatbot } from "@/components/neo/Chatbot";
import { Intro } from "@/components/neo/Intro";
import { Pager } from "@/components/neo/Pager";
import { Tutorial, type TourStep } from "@/components/neo/Tutorial";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Neo Analytics v1.0 — Ultra-fast Data Intelligence" },
      { name: "description", content: "Client-side CSV/Excel analytics, 3D WebGL visualizations, and mode-aware AI assistant." },
      { property: "og:title", content: "Neo Analytics v1.0" },
      { property: "og:description", content: "Client-side CSV/Excel analytics, 3D WebGL visualizations, and mode-aware AI assistant." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ModeProvider>
      <DatasetProvider>
        <AppShell />
      </DatasetProvider>
    </ModeProvider>
  );
}

function AppShell() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <>
      {!showDashboard ? (
        <Intro onEnterDashboard={() => setShowDashboard(true)} />
      ) : (
        <MainDashboardLayout onBackToGalaxy={() => setShowDashboard(false)} />
      )}
      <Toaster theme="dark" position="bottom-left" />
    </>
  );
}

function MainDashboardLayout({ onBackToGalaxy }: { onBackToGalaxy: () => void }) {
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    const seen = typeof window !== "undefined" && window.localStorage.getItem("neo-tour-seen");
    if (!seen) {
      const t = setTimeout(() => setTourOpen(true), 700);
      return () => clearTimeout(t);
    }
  }, []);
  const closeTour = () => {
    setTourOpen(false);
    try { window.localStorage.setItem("neo-tour-seen", "1"); } catch {}
  };
  const steps: TourStep[] = [
    { selector: '[data-tour="mode-select"]', title: "Switch workspace mode", desc: "Pick Household, Research, Business, or Developer — every panel, chart, and AI persona retunes for that context." },
    { selector: '[data-tour="data-panel"]', title: "Load your data", desc: "Upload a CSV/XLSX, type rows manually, or fire a demo dataset. Everything stays local in your browser." },
    { selector: '[data-tour="charts-panel"]', title: "Visualization suite", desc: "2D and WebGL 3D charts driven by your selected columns. Toggle the 3D engine for the cinematic view." },
    { selector: '[data-tour="export-panel"]', title: "Export beautiful reports", desc: "Render themed PDFs and PPTX decks (Gamma, Frutiger Aero, Kawaii, Cyberpunk) with charts baked in." },
    { selector: '[data-tour="help"]', title: "Replay the tour anytime", desc: "Hit the Tour button to walk through these features again. You can also cycle pages with the pager at the bottom." },
  ];
  return (
    <div className="min-h-screen text-foreground">
      <Header onStartTutorial={() => setTourOpen(true)} />
      <Dashboard onBackToGalaxy={onBackToGalaxy} />
      <Chatbot />
      <Tutorial steps={steps} open={tourOpen} onClose={closeTour} />
    </div>
  );
}

function Dashboard({ onBackToGalaxy }: { onBackToGalaxy: () => void }) {
  const { mode } = useWorkspaceMode();

  return (
    <main className="mx-auto max-w-[1600px] p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6" data-tour="data-panel">
          <DataPanel />
          <ManualGrid />
        </div>
        <AiInsights />
      </section>

      {mode === "developer" ? (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <LiveStream />
            <div data-tour="charts-panel"><ChartsPanel /></div>
          </section>
          <section className="grid gap-6 lg:grid-cols-2">
            <SqlPanel />
            <ApiMockPanel />
          </section>
          <MemoPanel />
          <div data-tour="export-panel"><ExportPanel /></div>
        </>
      ) : mode === "household" ? (
        <>
          <div data-tour="charts-panel"><ChartsPanel /></div>
          <section className="grid gap-6 lg:grid-cols-2">
            <StatsPanel />
            <div data-tour="export-panel"><ExportPanel /></div>
          </section>
        </>
      ) : mode === "business" ? (
        <>
          <div data-tour="charts-panel"><ChartsPanel /></div>
          <section className="grid gap-6 lg:grid-cols-2">
            <StatsPanel />
            <MemoPanel />
          </section>
          <section className="grid gap-6 lg:grid-cols-2">
            <SqlPanel />
            <ApiMockPanel />
          </section>
          <div data-tour="export-panel"><ExportPanel /></div>
        </>
      ) : (
        <>
          <div data-tour="charts-panel"><ChartsPanel /></div>
          <section className="grid gap-6 lg:grid-cols-2">
            <StatsPanel />
            <HypothesisWizard />
          </section>
          <MlPanel />
          <section className="grid gap-6 lg:grid-cols-2">
            <SqlPanel />
            <ApiMockPanel />
          </section>
          <LiveStream />
          <section className="grid gap-6 lg:grid-cols-2">
            <MemoPanel />
            <div data-tour="export-panel"><ExportPanel /></div>
          </section>
        </>
      )}
      <Pager onBackToGalaxy={onBackToGalaxy} />
    </main>
  );
}
