type Mark = { type?: string; attrs?: Record<string, unknown> | null };

type JsonNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown> | null;
  marks?: Mark[] | null;
  content?: JsonNode[] | null;
};

function applyMarks(text: string, marks?: Mark[] | null): string {
  if (!marks?.length) return text;
  const order = ["code", "bold", "italic", "strike", "link"];
  const sorted = [...marks].sort(
    (a, b) => order.indexOf(a.type ?? "") - order.indexOf(b.type ?? ""),
  );
  let out = text;
  for (const mark of sorted) {
    if (mark.type === "code") out = `\`${out}\``;
    else if (mark.type === "bold") out = `**${out}**`;
    else if (mark.type === "italic") out = `*${out}*`;
    else if (mark.type === "strike") out = `~~${out}~~`;
    else if (mark.type === "link") out = `[${out}](${String(mark.attrs?.href ?? "")})`;
  }
  return out;
}

function inline(nodes?: JsonNode[] | null): string {
  return (nodes ?? [])
    .map((node) => {
      if (node.type === "hardBreak") return "\n";
      if (node.type === "text") return applyMarks(node.text ?? "", node.marks);
      return inline(node.content);
    })
    .join("");
}

function blocks(nodes?: JsonNode[] | null, list?: "ul" | "ol", start = 1): string {
  if (!nodes?.length) return "";
  let n = start;
  return nodes
    .map((node) => {
      switch (node.type) {
        case "paragraph":
          return `${inline(node.content)}\n\n`;
        case "heading": {
          const level = Math.min(Math.max(Number(node.attrs?.level ?? 2), 1), 3);
          return `${"#".repeat(level)} ${inline(node.content)}\n\n`;
        }
        case "bulletList":
          return `${blocks(node.content, "ul")}\n`;
        case "orderedList":
          return `${blocks(node.content, "ol", Number(node.attrs?.start ?? 1))}\n`;
        case "listItem": {
          const prefix = list === "ol" ? `${n++}. ` : "- ";
          const inner = blocks(node.content).trimEnd();
          const [first, ...rest] = inner.split("\n");
          const indented = rest.map((line) => (line ? `  ${line}` : "")).join("\n");
          return `${prefix}${first ?? ""}${indented ? `\n${indented}` : ""}\n`;
        }
        case "blockquote":
          return `${blocks(node.content)
            .trimEnd()
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n")}\n\n`;
        case "codeBlock":
          return `\`\`\`${String(node.attrs?.language ?? "")}\n${node.content?.[0]?.text ?? ""}\n\`\`\`\n\n`;
        case "horizontalRule":
          return "---\n\n";
        default:
          return blocks(node.content, list, n);
      }
    })
    .join("");
}

/** Ingest stores this string as-is and chunks it; never send HTML tags. */
export function tiptapToMarkdown(doc: JsonNode): string {
  return blocks(doc.content).replace(/\n{3,}/g, "\n\n").trim();
}
