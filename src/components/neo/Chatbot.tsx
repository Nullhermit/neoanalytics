import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, X, Send } from "lucide-react";
import { useWorkspaceMode, MODE_META } from "@/lib/workspace-mode";
import { useDataset } from "@/lib/dataset-store";
import { summarizeDataset } from "@/lib/data/stats";
import { ChatMarkdown } from "./ChatMarkdown";
import { Button } from "@/components/ui/button";

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const { mode } = useWorkspaceMode();
  const { dataset } = useDataset();
  const datasetSummary = useMemo(() => dataset ? summarizeDataset(dataset) : "", [dataset]);

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, mode, datasetSummary },
      }),
    }),
    [mode, datasetSummary],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    id: `neo-chat-${mode}`,
    transport,
  });

  // Reset thread when mode changes for a clean persona
  useEffect(() => { setMessages([]); }, [mode, setMessages]);

  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) taRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = () => {
    const text = input.trim();
    if (!text || status === "submitted" || status === "streaming") return;
    sendMessage({ text });
    setInput("");
  };

  const personaLabel = MODE_META[mode].label;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-[image:var(--gradient-hero)] text-primary-foreground glow-primary animate-pulse-glow grid place-items-center hover:scale-105 transition"
        aria-label="Open Neo AI"
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(420px,calc(100vw-32px))] h-[600px] max-h-[80vh] panel neon-border flex flex-col animate-glitch-in">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-md bg-[image:var(--gradient-hero)] grid place-items-center">
                <Bot className="size-4 text-primary-foreground" />
              </div>
              <div>
                <div className="text-sm font-bold text-glow">Neo AI</div>
                <div className="text-[10px] uppercase tracking-widest text-accent">{personaLabel}</div>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-3 scrollbar-thin">
            {messages.length === 0 && (
              <div className="text-xs text-muted-foreground rounded-md border border-border bg-card/30 p-3 leading-relaxed">
                Hi — I'm Neo AI. Right now I'm in <b className="text-accent">{personaLabel}</b> mode.
                {mode === "household" && " Ask me about budgeting, saving more, or where your money's going."}
                {mode === "research" && " Ask me to interpret a p-value, derive a formula, or explain your distribution."}
                {mode === "business" && " Ask me about KPIs, revenue drivers, customer segments, or quarterly trends."}
                {mode === "developer" && " Ask me for a SQL query, a Python fetch script, or a JS fetch snippet."}
              </div>
            )}
            {messages.map((m: UIMessage) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">{text}</div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="flex">
                  <div className="max-w-[92%] text-sm text-foreground/95">
                    <ChatMarkdown>{text}</ChatMarkdown>
                  </div>
                </div>
              );
            })}
            {(status === "submitted" || status === "streaming") && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="text-xs text-muted-foreground animate-pulse">Thinking…</div>
            )}
          </div>

          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                rows={2}
                placeholder={mode === "developer" ? "Ask for SQL, Python, JS…" : mode === "household" ? "Ask about your budget…" : mode === "business" ? "Ask about KPIs, revenue, growth…" : "Ask about your data…"}
                className="flex-1 resize-none rounded-md bg-input/60 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring scrollbar-thin"
              />
              <Button size="icon" onClick={submit} disabled={!input.trim() || status === "submitted" || status === "streaming"} className="bg-[image:var(--gradient-hero)] text-primary-foreground glow-primary self-end">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}