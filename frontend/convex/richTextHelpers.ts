interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  content?: ProseMirrorNode[];
}

const BULLET_PREFIX = /^(\s*)-\s+/;
const NUMBERED_PREFIX = /^(\s*)\d+\.\s+/;

const EMPTY_DOC: ProseMirrorNode = { type: "doc", content: [{ type: "paragraph" }] };

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

const stripLegacyFormatting = (value: string) => {
  let plain = value.replace(/\r\n/g, "\n");
  plain = plain.replace(/\*\*([\s\S]+?)\*\*/g, "$1");
  plain = plain.replace(/__([\s\S]+?)__/g, "$1");
  plain = plain.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1$2");
  plain = plain.replace(/^\s*-\s+/gm, "");
  plain = plain.replace(/^\s*\d+\.\s+/gm, "");
  return plain;
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
    case "text":
      return node.text ?? "";
    default:
      return (node.content ?? []).map((child) => nodeToPlainText(child)).join("");
  }
};

const paragraphFromText = (paragraph: string): ProseMirrorNode => {
  const lines = paragraph.split("\n");
  const content: ProseMirrorNode[] = [];

  lines.forEach((line, index) => {
    if (line.length > 0) {
      content.push({ type: "text", text: line });
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

export const parseStoredRichTextToDoc = (value: string): ProseMirrorNode => {
  const parsed = safeParseJson(value);
  if (isProseMirrorDoc(parsed)) {
    return parsed;
  }

  const plainLegacy = stripLegacyFormatting(value ?? "");
  return docFromPlainText(plainLegacy);
};

export const normalizeRichTextForStorage = (value: string) => JSON.stringify(parseStoredRichTextToDoc(value));

export const createStoredRichTextFromPlainText = (value: string) => JSON.stringify(docFromPlainText(value));

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

export const removeListPrefixes = (line: string) => line.replace(BULLET_PREFIX, "$1").replace(NUMBERED_PREFIX, "$1");
