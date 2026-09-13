export const BUILTIN_TOOL_KEYS = [
  "searchKnowledge",
  "collectLead",
  "handoffToHuman",
  "getConversationContext",
] as const;

export type BuiltinToolKey = (typeof BUILTIN_TOOL_KEYS)[number];

export type BuiltinToolFlags = Record<BuiltinToolKey, boolean>;

export const DEFAULT_BUILTIN_TOOLS: BuiltinToolFlags = {
  searchKnowledge: true,
  collectLead: true,
  handoffToHuman: true,
  getConversationContext: true,
};

export function themeBuiltinTools(theme: unknown): unknown {
  if (!theme || typeof theme !== "object") return null;
  return (theme as { builtinTools?: unknown }).builtinTools;
}

export function withBuiltinTools(theme: unknown, flags: BuiltinToolFlags): Record<string, unknown> {
  const base = theme && typeof theme === "object" ? { ...(theme as Record<string, unknown>) } : {};
  return { ...base, builtinTools: flags };
}

export function resolveBuiltinTools(raw: unknown): BuiltinToolFlags {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    searchKnowledge: src.searchKnowledge !== false,
    collectLead: src.collectLead !== false,
    handoffToHuman: src.handoffToHuman !== false,
    getConversationContext: src.getConversationContext !== false,
  };
}
