export type RichTextFormat = "bold" | "italic" | "underline" | "bullet" | "numbered";

export interface ProseMirrorMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: ProseMirrorMark[];
  content?: ProseMirrorNode[];
}

const BULLET_PREFIX = /^(\s*)-\s+/;
const NUMBERED_PREFIX = /^(\s*)\d+\.\s+/;

const EMPTY_DOC: ProseMirrorNode = { type: "doc", content: [{ type: "paragraph" }] };

const INLINE_MARKERS: Record<"bold" | "italic" | "underline", { open: string; close: string }> = {
  bold: { open: "**", close: "**" },
  italic: { open: "*", close: "*" },
  underline: { open: "__", close: "__" },
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Sanitizes a color value to prevent CSS injection attacks.
 * Only allows safe CSS color formats: hex, rgb/rgba, hsl/hsla, and CSS named colors.
 * Returns the sanitized color or null if the value is invalid/unsafe.
 */
const sanitizeColor = (color: string): string | null => {
  if (!color || typeof color !== "string") return null;
  
  const trimmed = color.trim();
  
  // Reject any value containing semicolons or other CSS injection patterns
  if (/[;{}]/.test(trimmed)) return null;
  
  // Allow hex colors: #RGB, #RRGGBB, #RRGGBBAA
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed;
  }
  
  // Allow rgb/rgba: rgb(r, g, b) or rgba(r, g, b, a)
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(trimmed)) {
    return trimmed;
  }
  
  // Allow hsl/hsla: hsl(h, s%, l%) or hsla(h, s%, l%, a)
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/.test(trimmed)) {
    return trimmed;
  }
  
  // Allow CSS named colors (basic set for safety)
  const namedColors = new Set([
    "black", "white", "red", "green", "blue", "yellow", "cyan", "magenta",
    "gray", "grey", "silver", "maroon", "olive", "lime", "aqua", "teal",
    "navy", "fuchsia", "purple", "orange", "pink", "brown", "gold",
    "transparent", "currentcolor"
  ]);
  
  if (namedColors.has(trimmed.toLowerCase())) {
    return trimmed.toLowerCase();
  }
  
  // Reject anything else as potentially unsafe
  return null;
};

const safeParseJson = (value: string): unknown | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const isProseMirrorDoc = (value: unknown): value is ProseMirrorNode => {
  if (!value || typeof value !== "object") return false;
  const maybeNode = value as Record<string, unknown>;
  return maybeNode.type === "doc" && Array.isArray(maybeNode.content);
};

const removeListPrefix = (line: string) => line.replace(BULLET_PREFIX, "$1").replace(NUMBERED_PREFIX, "$1");

const stripLegacyFormatting = (value: string) => {
  let plain = value.replace(/\r\n/g, "\n");
  plain = plain.replace(/\*\*([\s\S]+?)\*\*/g, "$1");
  plain = plain.replace(/__([\s\S]+?)__/g, "$1");
  plain = plain.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1$2");
  plain = plain.replace(/^\s*-\s+/gm, "");
  plain = plain.replace(/^\s*\d+\.\s+/gm, "");
  return plain;
};

const formatLegacyInlineToHtml = (raw: string) => {
  let html = escapeHtml(raw);
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([\s\S]+?)__/g, "<u>$1</u>");
  html = html.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
  return html;
};

const renderLegacyToHtml = (value: string) => {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    if (BULLET_PREFIX.test(line)) {
      const items: string[] = [];
      while (i < lines.length && BULLET_PREFIX.test(lines[i])) {
        items.push(lines[i].replace(BULLET_PREFIX, "$1").trimStart());
        i += 1;
      }
      blocks.push(
        `<ul class=\"my-5 list-disc pl-6 space-y-2\">${items
          .map((item) => `<li>${formatLegacyInlineToHtml(item)}</li>`)
          .join("")}</ul>`,
      );
      continue;
    }

    if (NUMBERED_PREFIX.test(line)) {
      const items: string[] = [];
      while (i < lines.length && NUMBERED_PREFIX.test(lines[i])) {
        items.push(lines[i].replace(NUMBERED_PREFIX, "$1").trimStart());
        i += 1;
      }
      blocks.push(
        `<ol class=\"my-5 list-decimal pl-6 space-y-2\">${items
          .map((item) => `<li>${formatLegacyInlineToHtml(item)}</li>`)
          .join("")}</ol>`,
      );
      continue;
    }

    const paragraphLines = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !BULLET_PREFIX.test(lines[i]) &&
      !NUMBERED_PREFIX.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }

    blocks.push(
      `<p class=\"my-5 leading-relaxed\">${paragraphLines
        .map((part) => formatLegacyInlineToHtml(part))
        .join("<br />")}</p>`,
    );
  }

  if (blocks.length === 0) {
    return '<p class="my-5 leading-relaxed text-muted-foreground">No writing yet.</p>';
  }

  return blocks.join("");
};

const textNode = (text: string): ProseMirrorNode => ({ type: "text", text });

const paragraphFromText = (paragraph: string): ProseMirrorNode => {
  const lines = paragraph.split("\n");
  const content: ProseMirrorNode[] = [];

  lines.forEach((line, index) => {
    if (line.length > 0) {
      content.push(textNode(line));
    }
    if (index < lines.length - 1) {
      content.push({ type: "hardBreak" });
    }
  });

  return content.length > 0 ? { type: "paragraph", content } : { type: "paragraph" };
};

const docFromPlainText = (value: string): ProseMirrorNode => {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) return EMPTY_DOC;

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(paragraphFromText);

  return paragraphs.length > 0 ? { type: "doc", content: paragraphs } : EMPTY_DOC;
};

const normalizeDocForStorage = (doc: ProseMirrorNode) => JSON.stringify(doc);

const applyMarksToHtml = (text: string, marks?: ProseMirrorMark[]) => {
  let html = escapeHtml(text);
  for (const mark of marks ?? []) {
    if (mark.type === "bold") {
      html = `<strong>${html}</strong>`;
    } else if (mark.type === "italic") {
      html = `<em>${html}</em>`;
    } else if (mark.type === "underline") {
      html = `<u>${html}</u>`;
    } else if (mark.type === "strike") {
      html = `<s>${html}</s>`;
    } else if (mark.type === "code") {
      html = `<code>${html}</code>`;
    } else if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
      html = `<a href=\"${escapeHtml(href)}\" rel=\"noopener noreferrer\" target=\"_blank\">${html}</a>`;
    } else if (mark.type === "textStyle") {
      const color = typeof mark.attrs?.color === "string" ? mark.attrs.color : "";
      const safeColor = sanitizeColor(color);
      if (safeColor) {
        html = `<span style="color:${safeColor}">${html}</span>`;
      }
    } else if (mark.type === "highlight") {
      const bgColor = typeof mark.attrs?.color === "string" ? mark.attrs.color : "#fef9c3";
      const safeBgColor = sanitizeColor(bgColor);
      if (safeBgColor) {
        html = `<mark style="background-color:${safeBgColor}">${html}</mark>`;
      }
    }
  }
  return html;
};

const paragraphInnerHtml = (node: ProseMirrorNode) =>
  (node.content ?? []).map(renderNodeToHtml).join("") || "<br />";

const renderNodeToHtml = (node: ProseMirrorNode): string => {
  switch (node.type) {
    case "doc":
      return (node.content ?? []).map(renderNodeToHtml).join("");
    case "paragraph":
      return `<p class=\"my-5 leading-relaxed\">${paragraphInnerHtml(node)}</p>`;
    case "text":
      return applyMarksToHtml(node.text ?? "", node.marks);
    case "hardBreak":
      return "<br />";
    case "bulletList":
      return `<ul class=\"my-5 list-disc pl-6 space-y-2\">${(node.content ?? [])
        .map(renderNodeToHtml)
        .join("")}</ul>`;
    case "orderedList":
      return `<ol class=\"my-5 list-decimal pl-6 space-y-2\">${(node.content ?? [])
        .map(renderNodeToHtml)
        .join("")}</ol>`;
    case "listItem": {
      const body = (node.content ?? [])
        .map((child) => {
          if (child.type === "paragraph") return paragraphInnerHtml(child);
          return renderNodeToHtml(child);
        })
        .join("");
      return `<li>${body}</li>`;
    }
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      const clamped = Number.isFinite(level) ? Math.max(1, Math.min(level, 6)) : 2;
      return `<h${clamped} class=\"my-5 font-semibold leading-snug\">${(node.content ?? [])
        .map(renderNodeToHtml)
        .join("")}</h${clamped}>`;
    }
    case "blockquote":
      return `<blockquote class=\"my-5 border-l-2 border-border pl-4 text-muted-foreground\">${(node.content ?? [])
        .map(renderNodeToHtml)
        .join("")}</blockquote>`;
    case "horizontalRule":
      return "<hr class=\"my-6 border-border\" />";
    case "codeBlock":
      return `<pre class=\"my-5 overflow-x-auto rounded-md bg-muted/70 p-3\"><code>${escapeHtml(
        (node.content ?? []).map((child) => nodeToPlainText(child)).join(""),
      )}</code></pre>`;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      return `<img src=\"${escapeHtml(src)}\" alt=\"${escapeHtml(alt)}\" class=\"my-5 max-w-full rounded-lg\" />`;
    }
    default:
      return (node.content ?? []).map(renderNodeToHtml).join("");
  }
};

const flattenToText = (node: ProseMirrorNode): string => {
  switch (node.type) {
    case "text":
      return node.text ?? "";
    case "hardBreak":
      return "\n";
    default:
      return (node.content ?? []).map(flattenToText).join("");
  }
};

const nodeToPlainText = (node: ProseMirrorNode): string => {
  switch (node.type) {
    case "doc":
      return (node.content ?? [])
        .map((child) => nodeToPlainText(child).trimEnd())
        .filter((chunk) => chunk.length > 0)
        .join("\n\n");
    case "paragraph":
    case "heading":
    case "blockquote":
    case "codeBlock":
      return flattenToText(node);
    case "bulletList":
    case "orderedList":
      return (node.content ?? []).map((child) => nodeToPlainText(child)).join("\n");
    case "listItem":
      return (node.content ?? [])
        .map((child) => nodeToPlainText(child))
        .filter((chunk) => chunk.length > 0)
        .join("\n")
        .trim();
    case "hardBreak":
      return "\n";
    case "horizontalRule":
      return "";
    case "image": {
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      return alt || "[image]";
    }
    case "text":
      return node.text ?? "";
    default:
      return (node.content ?? []).map((child) => nodeToPlainText(child)).join("");
  }
};

export const parseStoredRichTextToDoc = (value: string): ProseMirrorNode => {
  const parsed = safeParseJson(value);
  if (isProseMirrorDoc(parsed)) {
    return parsed;
  }

  const plainLegacy = stripLegacyFormatting(value ?? "");
  return docFromPlainText(plainLegacy);
};

export const normalizeRichTextForStorage = (value: string) => normalizeDocForStorage(parseStoredRichTextToDoc(value));

export const createStoredRichTextFromPlainText = (value: string) => normalizeDocForStorage(docFromPlainText(value));

export const stripRichTextFormatting = (value: string) => {
  const parsed = safeParseJson(value);
  if (isProseMirrorDoc(parsed)) {
    return nodeToPlainText(parsed);
  }

  return stripLegacyFormatting(value ?? "");
};

export const countRichTextWords = (value: string) => {
  const plain = stripRichTextFormatting(value).trim();
  return plain ? plain.split(/\s+/).length : 0;
};

export const renderRichTextToHtml = (value: string) => {
  const parsed = safeParseJson(value);
  if (isProseMirrorDoc(parsed)) {
    const rendered = renderNodeToHtml(parsed).trim();
    if (!rendered) {
      return '<p class="my-5 leading-relaxed text-muted-foreground">No writing yet.</p>';
    }
    return rendered;
  }

  return renderLegacyToHtml(value ?? "");
};

export const getLegacyLineWithoutListPrefix = (line: string) => removeListPrefix(line);
