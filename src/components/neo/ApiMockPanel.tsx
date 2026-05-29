import { Panel } from "./Panel";
import { CodeBlock } from "./CodeBlock";
import { useDataset } from "@/lib/dataset-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function ApiMockPanel() {
  const { dataset } = useDataset();
  const name = dataset?.name.replace(/\.[^.]+$/, "") ?? "dataset";
  const url = `https://api.neo-analytics.io/v1/datasets/${name}/query`;

  const py = `import requests\n\nresp = requests.post(\n    "${url}",\n    headers={"Authorization": "Bearer $NEO_API_KEY"},\n    json={"select": ["*"], "limit": 100},\n    timeout=10,\n)\nresp.raise_for_status()\nrows = resp.json()["data"]\nprint(f"Got {len(rows)} rows")`;

  const js = `const res = await fetch("${url}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": \`Bearer \${process.env.NEO_API_KEY}\`,\n  },\n  body: JSON.stringify({ select: ["*"], limit: 100 }),\n});\nif (!res.ok) throw new Error(\`HTTP \${res.status}\`);\nconst { data } = await res.json();\nconsole.log(\`Got \${data.length} rows\`);`;

  const curl = `curl -X POST '${url}' \\\n  -H 'Authorization: Bearer $NEO_API_KEY' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"select":["*"],"limit":100}'`;

  return (
    <Panel title="Production API Endpoint" subtitle="Copy-paste integration snippets">
      <Tabs defaultValue="py">
        <TabsList className="bg-card/60"><TabsTrigger value="py">Python</TabsTrigger><TabsTrigger value="js">JavaScript</TabsTrigger><TabsTrigger value="curl">cURL</TabsTrigger></TabsList>
        <TabsContent value="py" className="mt-3"><CodeBlock language="python" code={py} /></TabsContent>
        <TabsContent value="js" className="mt-3"><CodeBlock language="javascript" code={js} /></TabsContent>
        <TabsContent value="curl" className="mt-3"><CodeBlock language="bash" code={curl} /></TabsContent>
      </Tabs>
    </Panel>
  );
}