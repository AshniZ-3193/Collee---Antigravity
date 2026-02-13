const IRREGULAR_PAST_CORRECTIONS: Record<string, string> = {
  buyed: "bought",
  bringed: "brought",
  catched: "caught",
  comed: "came",
  doed: "did",
  drawed: "drew",
  drinked: "drank",
  eated: "ate",
  falled: "fell",
  finded: "found",
  flied: "flew",
  forgeted: "forgot",
  goed: "went",
  growed: "grew",
  haved: "had",
  knowed: "knew",
  runned: "ran",
  sended: "sent",
  singed: "sang",
  sleeped: "slept",
  speaked: "spoke",
  taked: "took",
  teached: "taught",
  thinked: "thought",
  writed: "wrote",
};

export function getIrregularPastCorrection(problemText: string): string | null {
  const normalized = problemText.trim().toLowerCase();
  return IRREGULAR_PAST_CORRECTIONS[normalized] ?? null;
}

export function withPreferredSuggestion(
  suggestions: string[],
  preferredSuggestion: string,
): string[] {
  const unique = new Set<string>();
  const output: string[] = [preferredSuggestion];
  unique.add(preferredSuggestion.toLowerCase());

  for (const suggestion of suggestions) {
    const normalized = suggestion.toLowerCase();
    if (unique.has(normalized)) continue;
    unique.add(normalized);
    output.push(suggestion);
  }

  return output;
}
