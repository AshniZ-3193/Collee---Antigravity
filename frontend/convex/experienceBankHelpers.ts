const THEME_KEYWORDS: { theme: string; keywords: string[] }[] = [
  { theme: "leadership", keywords: ["lead", "leader", "led", "captain", "president", "founder"] },
  { theme: "community", keywords: ["community", "together", "team", "group", "club"] },
  { theme: "identity", keywords: ["identity", "culture", "heritage", "background", "belonging"] },
  { theme: "challenge", keywords: ["challenge", "setback", "failure", "difficult", "struggle", "obstacle"] },
  { theme: "resilience", keywords: ["resilience", "persevere", "persist", "overcome"] },
  { theme: "growth", keywords: ["growth", "learned", "learning", "changed", "improved"] },
  { theme: "responsibility", keywords: ["responsibility", "accountable", "duty", "commitment"] },
  { theme: "impact", keywords: ["impact", "difference", "change", "improve", "influence"] },
  { theme: "curiosity", keywords: ["curiosity", "question", "wonder", "explore", "discover"] },
  { theme: "service", keywords: ["service", "volunteer", "help", "support", "tutor"] },
  { theme: "family", keywords: ["family", "parent", "sibling", "grandparent", "home"] },
  { theme: "innovation", keywords: ["innovate", "build", "create", "design", "invent", "prototype"] },
  { theme: "values", keywords: ["values", "integrity", "ethic", "principle"] },
];

export function extractThemes(text: string): string[] {
  const normalized = text.toLowerCase();
  const themes = new Set<string>();

  for (const { theme, keywords } of THEME_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      themes.add(theme);
    }
  }

  return Array.from(themes);
}

export function extractExcerpts(content: string): string[] {
  if (!content.trim()) return [];

  const paragraphs = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length >= 80);

  if (paragraphs.length > 0) {
    return paragraphs.slice(0, 3);
  }

  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = "";
  for (const sentence of sentences) {
    const candidate = buffer ? `${buffer} ${sentence}` : sentence;
    if (candidate.length > 400) {
      if (buffer) {
        chunks.push(buffer.trim());
      }
      buffer = sentence;
    } else {
      buffer = candidate;
    }
    if (chunks.length >= 3) break;
  }

  if (buffer && chunks.length < 3) {
    chunks.push(buffer.trim());
  }

  return chunks.filter((chunk) => chunk.length >= 80).slice(0, 3);
}

export function buildExcerptRecords(content: string, promptType?: string) {
  const excerpts = extractExcerpts(content);
  return excerpts.map((excerpt) => {
    const themes = extractThemes(excerpt);
    if (promptType && !themes.includes(promptType)) {
      themes.push(promptType);
    }
    if (themes.length === 0) {
      themes.push(promptType ?? "general");
    }
    return { excerpt, themes, promptType };
  });
}
