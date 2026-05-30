import { createFileRoute } from "@tanstack/react-router";
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
import { useDataset } from "@/lib/dataset-store";
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
        <div className="min-h-screen text-foreground">
          <Header />
          <Dashboard />
          <Chatbot />
          <Toaster theme="dark" position="bottom-left" />
        </div>
      </DatasetProvider>
    </ModeProvider>
  );
}

function Dashboard() {
  const { mode } = useWorkspaceMode();
  const { dataset } = useDataset();

  return (
    <main className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6">
      {!dataset && <Intro />}
      <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <DataPanel />
          <ManualGrid />
        </div>
        <AiInsights />
      </section>

      {mode === "developer" ? (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <LiveStream />
            <ChartsPanel />
          </section>
          <section className="grid gap-6 lg:grid-cols-2">
            <SqlPanel />
            <ApiMockPanel />
          </section>
          <MemoPanel />
          <ExportPanel />
        </>
      ) : mode === "household" ? (
        <>
          <ChartsPanel />
          <section className="grid gap-6 lg:grid-cols-2">
            <StatsPanel />
            <ExportPanel />
          </section>
        </>
      ) : (
        <>
          <ChartsPanel />
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
            <ExportPanel />
          </section>
        </>
      )}
    </main>
  );
}
