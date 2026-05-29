import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Mode = "household" | "research" | "developer";

const SYSTEM: Record<Mode, string> = {
  household:
    "You are a friendly personal finance coach inside Neo Analytics. Talk like a warm, encouraging friend. Use simple words, avoid statistical jargon, focus on saving money, budgeting tips, and concrete next steps. Use rupee symbol ₹ when amounts are mentioned. Keep responses short and actionable.",
  research:
    "You are a precise academic data scientist inside Neo Analytics. Give mathematically rigorous answers, reference formulas (use LaTeX-style inline like t = (x̄ - μ) / (s/√n)), explain hypothesis testing, confidence intervals, p-values, and distributions. Cite assumptions. Be concise and professional.",
  developer:
    "You are a senior software engineer inside Neo Analytics. Give terse, production-grade answers. When asked for code, output clean SQL, Python (using pandas/requests), or JavaScript (fetch) in proper fenced code blocks with language tags. Focus on performance, system metrics, and pragmatic engineering tradeoffs.",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages?: UIMessage[];
          mode?: Mode;
          datasetSummary?: string;
        };
        const messages = body.messages;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const mode: Mode = body.mode ?? "research";
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const system =
          SYSTEM[mode] +
          (body.datasetSummary
            ? `\n\nCurrent dataset context:\n${body.datasetSummary}`
            : "\n\nNo dataset is loaded yet — encourage the user to load the Instant Simulation or upload one.");

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});