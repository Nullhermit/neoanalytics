import { useMemo, useState } from "react";
import { Panel } from "./Panel";
import { CodeBlock } from "./CodeBlock";
import { useDataset } from "@/lib/dataset-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OpId =
  | "query" | "list" | "get_one" | "create" | "update" | "delete"
  | "bulk" | "aggregate" | "stream" | "upload" | "webhook" | "auth";

const OPS: { id: OpId; label: string; method: string; path: (n: string) => string }[] = [
  { id: "query",     label: "POST /query — flexible SQL-style query",        method: "POST",   path: (n) => `/v1/datasets/${n}/query` },
  { id: "list",      label: "GET /rows — paginated list",                    method: "GET",    path: (n) => `/v1/datasets/${n}/rows?limit=100&cursor=` },
  { id: "get_one",   label: "GET /rows/:id — single record",                 method: "GET",    path: (n) => `/v1/datasets/${n}/rows/{id}` },
  { id: "create",    label: "POST /rows — insert one record",                method: "POST",   path: (n) => `/v1/datasets/${n}/rows` },
  { id: "update",    label: "PATCH /rows/:id — partial update",              method: "PATCH",  path: (n) => `/v1/datasets/${n}/rows/{id}` },
  { id: "delete",    label: "DELETE /rows/:id — remove record",              method: "DELETE", path: (n) => `/v1/datasets/${n}/rows/{id}` },
  { id: "bulk",      label: "POST /bulk — batch insert (up to 10k)",         method: "POST",   path: (n) => `/v1/datasets/${n}/bulk` },
  { id: "aggregate", label: "POST /aggregate — sum / avg / group_by",        method: "POST",   path: (n) => `/v1/datasets/${n}/aggregate` },
  { id: "stream",    label: "GET /stream — server-sent events (live)",       method: "GET",    path: (n) => `/v1/datasets/${n}/stream` },
  { id: "upload",    label: "POST /upload — multipart CSV upload",           method: "POST",   path: (n) => `/v1/datasets/${n}/upload` },
  { id: "webhook",   label: "POST /webhooks — subscribe to row events",      method: "POST",   path: (n) => `/v1/datasets/${n}/webhooks` },
  { id: "auth",      label: "POST /auth/token — exchange API key for JWT",   method: "POST",   path: () => `/v1/auth/token` },
];

function buildSnippets(op: OpId, url: string, method: string, name: string) {
  const headers = `"Authorization": "Bearer $NEO_API_KEY"`;
  const ct = `"Content-Type": "application/json"`;

  const bodies: Record<OpId, unknown> = {
    query:     { select: ["*"], where: { revenue: { $gt: 1000 } }, order_by: "-revenue", limit: 100 },
    list:      null,
    get_one:   null,
    create:    { region: "North", product: "Alpha", revenue: 12500, units: 42 },
    update:    { revenue: 13000 },
    delete:    null,
    bulk:      { rows: [{ region: "North", revenue: 100 }, { region: "South", revenue: 220 }] },
    aggregate: { group_by: ["region"], metrics: { revenue: ["sum", "avg"], units: ["sum"] } },
    stream:    null,
    upload:    null,
    webhook:   { event: "row.created", target_url: "https://your-app.com/hooks/neo", secret: "$NEO_HOOK_SECRET" },
    auth:      { api_key: "$NEO_API_KEY", scope: ["read", "write"] },
  };
  const body = bodies[op];
  const bodyJson = body ? JSON.stringify(body, null, 2) : "";

  // ---------- Python ----------
  let py = "";
  if (op === "stream") {
    py = `import requests, json\n\nwith requests.get(\n    "${url}",\n    headers={"Authorization": "Bearer $NEO_API_KEY", "Accept": "text/event-stream"},\n    stream=True, timeout=None,\n) as resp:\n    resp.raise_for_status()\n    for line in resp.iter_lines():\n        if line and line.startswith(b"data: "):\n            event = json.loads(line[6:])\n            print("tick:", event)`;
  } else if (op === "upload") {
    py = `import requests\n\nwith open("data.csv", "rb") as f:\n    resp = requests.post(\n        "${url}",\n        headers={"Authorization": "Bearer $NEO_API_KEY"},\n        files={"file": ("data.csv", f, "text/csv")},\n        data={"mode": "append"},\n        timeout=60,\n    )\nresp.raise_for_status()\nprint(resp.json())`;
  } else if (op === "delete") {
    py = `import requests\n\nresp = requests.delete(\n    "${url.replace("{id}", "123")}",\n    headers={"Authorization": "Bearer $NEO_API_KEY"},\n    timeout=10,\n)\nresp.raise_for_status()\nprint("deleted:", resp.status_code)`;
  } else if (method === "GET") {
    py = `import requests\n\nresp = requests.get(\n    "${url.replace("{id}", "123")}",\n    headers={"Authorization": "Bearer $NEO_API_KEY"},\n    timeout=10,\n)\nresp.raise_for_status()\ndata = resp.json()\nprint(data)`;
  } else {
    const fn = method === "PATCH" ? "patch" : "post";
    py = `import requests\n\npayload = ${bodyJson || "{}"}\n\nresp = requests.${fn}(\n    "${url.replace("{id}", "123")}",\n    headers={${headers}, ${ct}},\n    json=payload,\n    timeout=10,\n)\nresp.raise_for_status()\nprint(resp.json())`;
  }

  // ---------- JavaScript ----------
  let js = "";
  if (op === "stream") {
    js = `const es = new EventSource("${url}?token=" + process.env.NEO_API_KEY);\nes.onmessage = (e) => {\n  const event = JSON.parse(e.data);\n  console.log("tick:", event);\n};\nes.onerror = (err) => { console.error("stream error", err); es.close(); };`;
  } else if (op === "upload") {
    js = `import fs from "node:fs";\n\nconst form = new FormData();\nform.append("file", new Blob([fs.readFileSync("data.csv")]), "data.csv");\nform.append("mode", "append");\n\nconst res = await fetch("${url}", {\n  method: "POST",\n  headers: { Authorization: \`Bearer \${process.env.NEO_API_KEY}\` },\n  body: form,\n});\nif (!res.ok) throw new Error(\`HTTP \${res.status}\`);\nconsole.log(await res.json());`;
  } else if (op === "delete" || method === "GET") {
    js = `const res = await fetch("${url.replace("{id}", "123")}", {\n  method: "${method}",\n  headers: { Authorization: \`Bearer \${process.env.NEO_API_KEY}\` },\n});\nif (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n${method === "DELETE" ? "console.log('deleted', res.status);" : "const data = await res.json();\nconsole.log(data);"}`;
  } else {
    js = `const payload = ${bodyJson || "{}"};\n\nconst res = await fetch("${url.replace("{id}", "123")}", {\n  method: "${method}",\n  headers: {\n    "Content-Type": "application/json",\n    Authorization: \`Bearer \${process.env.NEO_API_KEY}\`,\n  },\n  body: JSON.stringify(payload),\n});\nif (!res.ok) throw new Error(\`HTTP \${res.status}\`);\nconst data = await res.json();\nconsole.log(data);`;
  }

  // ---------- cURL ----------
  let curl = "";
  if (op === "stream") {
    curl = `curl -N '${url}' \\\n  -H 'Authorization: Bearer $NEO_API_KEY' \\\n  -H 'Accept: text/event-stream'`;
  } else if (op === "upload") {
    curl = `curl -X POST '${url}' \\\n  -H 'Authorization: Bearer $NEO_API_KEY' \\\n  -F 'file=@data.csv;type=text/csv' \\\n  -F 'mode=append'`;
  } else if (op === "delete" || method === "GET") {
    curl = `curl -X ${method} '${url.replace("{id}", "123")}' \\\n  -H 'Authorization: Bearer $NEO_API_KEY'`;
  } else {
    curl = `curl -X ${method} '${url.replace("{id}", "123")}' \\\n  -H 'Authorization: Bearer $NEO_API_KEY' \\\n  -H 'Content-Type: application/json' \\\n  -d '${bodyJson ? bodyJson.replace(/\n\s*/g, "") : "{}"}'`;
  }

  // ---------- R ----------
  let r = "";
  if (op === "stream") {
    r = `library(httr2)\nlibrary(jsonlite)\n\nreq <- request("${url}") |>\n  req_headers(\n    Authorization = paste("Bearer", Sys.getenv("NEO_API_KEY")),\n    Accept = "text/event-stream"\n  )\n\nresp <- req_perform_stream(req, callback = function(chunk) {\n  line <- rawToChar(chunk)\n  if (startsWith(line, "data: ")) {\n    event <- fromJSON(substring(line, 7))\n    print(event)\n  }\n  TRUE\n})`;
  } else if (op === "upload") {
    r = `library(httr2)\n\nresp <- request("${url}") |>\n  req_headers(Authorization = paste("Bearer", Sys.getenv("NEO_API_KEY"))) |>\n  req_body_multipart(\n    file = curl::form_file("data.csv", type = "text/csv"),\n    mode = "append"\n  ) |>\n  req_perform()\n\nresp |> resp_body_json() |> str()`;
  } else if (op === "delete" || method === "GET") {
    r = `library(httr2)\nlibrary(jsonlite)\n\nresp <- request("${url.replace("{id}", "123")}") |>\n  req_method("${method}") |>\n  req_headers(Authorization = paste("Bearer", Sys.getenv("NEO_API_KEY"))) |>\n  req_perform()\n\n${method === "DELETE" ? "cat(\"deleted: \", resp_status(resp), \"\\n\")" : "data <- resp |> resp_body_json()\nstr(data)"}`;
  } else {
    r = `library(httr2)\nlibrary(jsonlite)\n\npayload <- ${bodyJson ? `fromJSON('${bodyJson.replace(/\n\s*/g, "")}')` : "list()"}\n\nresp <- request("${url.replace("{id}", "123")}") |>\n  req_method("${method}") |>\n  req_headers(\n    Authorization = paste("Bearer", Sys.getenv("NEO_API_KEY")),\n    \`Content-Type\` = "application/json"\n  ) |>\n  req_body_json(payload) |>\n  req_perform()\n\nresp |> resp_body_json() |> str()`;
  }

  // ---------- Node / TypeScript SDK ----------
  const sdk = `import { NeoClient } from "@neo-analytics/sdk";\n\nconst neo = new NeoClient({ apiKey: process.env.NEO_API_KEY! });\n\nconst result = await neo.dataset("${name}").${
    op === "query"     ? `query({ select: ["*"], orderBy: "-revenue", limit: 100 })`
  : op === "list"      ? `rows.list({ limit: 100 })`
  : op === "get_one"   ? `rows.get("123")`
  : op === "create"    ? `rows.create({ region: "North", revenue: 12500 })`
  : op === "update"    ? `rows.update("123", { revenue: 13000 })`
  : op === "delete"    ? `rows.delete("123")`
  : op === "bulk"      ? `rows.bulk([{ region: "North" }, { region: "South" }])`
  : op === "aggregate" ? `aggregate({ groupBy: ["region"], metrics: { revenue: ["sum","avg"] } })`
  : op === "stream"    ? `stream((event) => console.log(event))`
  : op === "upload"    ? `upload("./data.csv", { mode: "append" })`
  : op === "webhook"   ? `webhooks.create({ event: "row.created", targetUrl: "https://your-app.com/hooks/neo" })`
  : /* auth */          `auth.exchangeToken({ scope: ["read","write"] })`
  };\nconsole.log(result);`;

  return { py, js, curl, sdk, r };
}

export function ApiMockPanel() {
  const { dataset } = useDataset();
  const [op, setOp] = useState<OpId>("query");
  const name = dataset?.name.replace(/\.[^.]+$/, "").replace(/\W+/g, "_") ?? "dataset";
  const opDef = OPS.find((o) => o.id === op)!;
  const url = `https://api.neo-analytics.io${opDef.path(name)}`;
  const snippets = useMemo(() => buildSnippets(op, url, opDef.method, name), [op, url, opDef.method, name]);

  return (
    <Panel
      title="Production API Endpoint"
      subtitle={`${opDef.method} ${opDef.path(name)}`}
      action={
        <Select value={op} onValueChange={(v) => setOp(v as OpId)}>
          <SelectTrigger className="h-8 w-[260px] bg-card/60 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-[320px]">
            {OPS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      }
    >
      <Tabs defaultValue="py">
        <TabsList className="bg-card/60">
          <TabsTrigger value="py">Python</TabsTrigger>
          <TabsTrigger value="js">JavaScript</TabsTrigger>
          <TabsTrigger value="sdk">Node SDK</TabsTrigger>
          <TabsTrigger value="r">R</TabsTrigger>
          <TabsTrigger value="curl">cURL</TabsTrigger>
        </TabsList>
        <TabsContent value="py"   className="mt-3"><CodeBlock language="python"     code={snippets.py} /></TabsContent>
        <TabsContent value="js"   className="mt-3"><CodeBlock language="javascript" code={snippets.js} /></TabsContent>
        <TabsContent value="sdk"  className="mt-3"><CodeBlock language="typescript" code={snippets.sdk} /></TabsContent>
        <TabsContent value="r"    className="mt-3"><CodeBlock language="r"          code={snippets.r} /></TabsContent>
        <TabsContent value="curl" className="mt-3"><CodeBlock language="bash"       code={snippets.curl} /></TabsContent>
      </Tabs>
    </Panel>
  );
}