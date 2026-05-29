import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

function CodeFence({ language, value }: { language: string; value: string }) {
  const [c, setC] = useState(false);
  return (
    <div className="my-2 rounded-md overflow-hidden border border-border bg-[#0d0a1a]">
      <div className="flex items-center justify-between px-3 py-1 bg-card/70 border-b border-border">
        <span className="text-[10px] uppercase tracking-wider text-accent font-mono">{language || "code"}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(value); setC(true); setTimeout(() => setC(false), 1200); }}
          className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1"
        >
          {c ? <Check className="size-3" /> : <Copy className="size-3" />} {c ? "copied" : "copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={vscDarkPlus}
        customStyle={{ margin: 0, background: "transparent", fontSize: 12, padding: "10px 14px" }}
        wrapLongLines
      >
        {value.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}

export function ChatMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code(props) {
          const { className, children, ...rest } = props as { className?: string; children?: React.ReactNode };
          const match = /language-(\w+)/.exec(className || "");
          const text = String(children ?? "");
          if (match) return <CodeFence language={match[1]} value={text} />;
          // inline code
          return <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[0.85em] text-accent" {...rest}>{children}</code>;
        },
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
        a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-accent underline">{children}</a>,
        h1: ({ children }) => <h1 className="text-base font-bold mb-1 text-glow">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold mb-1 text-glow">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}