import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative rounded-md overflow-hidden border border-border bg-[#0d0a1a]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-card/60 border-b border-border">
        <span className="text-[10px] uppercase tracking-wider text-accent font-mono">{language}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-muted-foreground hover:text-accent text-xs flex items-center gap-1"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? "copied" : "copy"}
        </button>
      </div>
      <SyntaxHighlighter language={language} style={vscDarkPlus} customStyle={{ margin: 0, background: "transparent", fontSize: 12, padding: "12px 16px" }} wrapLongLines>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}