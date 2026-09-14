import { z } from "zod";

export const providerKind = z.enum([
  "openai",
  "anthropic",
  "google",
  "openrouter",
  "vercel-gateway",
  "zai",
  "custom",
]);
export type ProviderKind = z.infer<typeof providerKind>;

export const zaiMode = z.enum(["general", "coding"]);
export type ZaiMode = z.infer<typeof zaiMode>;

export const modelIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._:+/-]*$/,
    "Use the model id from your local server (e.g. local-qwen-7b).",
  );

/** Split a comma / newline list of local model ids. Strips a leading `custom/` prefix. */
export function parseModelIds(input: unknown): string[] {
  const parts = Array.isArray(input)
    ? input.map((value) => String(value))
    : typeof input === "string"
      ? input.split(/[,;\n]+/)
      : [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of parts) {
    const id = part.trim().replace(/^custom\//i, "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function customModelRef(modelId: string): string {
  const id = modelId.trim().replace(/^custom\//i, "");
  return `custom/${id}`;
}

export const SUGGESTED_CUSTOM_MODELS = [
  "local-gemma4",
  "local-gemma4-12b",
  "local-qwen-7b",
  "local-qwen-3b",
] as const;

/** Stored ids on a custom key, or the local Qwen/Gemma defaults when the list is still empty. */
export function modelsForCustomCredential(stored: string[] | null | undefined): string[] {
  return stored?.length ? stored : [...SUGGESTED_CUSTOM_MODELS];
}

export function parsedModelIds(input: unknown): string[] {
  return z.array(modelIdSchema).max(64).parse(parseModelIds(input));
}

const credentialModelsField = z.union([z.string(), z.array(z.string())]).optional();

export const createCredentialSchema = z
  .object({
    provider: providerKind,
    label: z.string().min(1).max(80),
    apiKey: z.string().min(8),
    baseUrl: z.string().url().optional(),
    zaiMode: zaiMode.optional(),
    models: credentialModelsField,
  })
  .superRefine((value, ctx) => {
    if (value.provider === "custom" && !value.baseUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Base URL is required for a custom OpenAI-compatible server.",
        path: ["baseUrl"],
      });
    }
  });

export const updateCredentialSchema = z
  .object({
    label: z.string().min(1).max(80).optional(),
    models: credentialModelsField,
    baseUrl: z.string().url().optional(),
  })
  .refine((value) => value.label !== undefined || value.models !== undefined || value.baseUrl !== undefined, {
    message: "Nothing to update",
  });

export const rotateCredentialSchema = z.object({
  apiKey: z.string().min(8),
});

export const createAgentSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(280).optional(),
  systemPrompt: z.string().max(8000).optional(),
  modelRef: z.string().min(1),
  credentialId: z.string().nullish(),
  temperature: z.number().min(0).max(2).optional(),
  maxSteps: z.number().int().min(1).max(20).optional(),
  greeting: z.string().max(280).nullish(),
  placeholder: z.string().max(120).nullish(),
  builtinTools: z
    .object({
      searchKnowledge: z.boolean().optional(),
      collectLead: z.boolean().optional(),
      handoffToHuman: z.boolean().optional(),
      getConversationContext: z.boolean().optional(),
    })
    .optional(),
  widgetTheme: z
    .object({
      accent: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
      bg: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
      fg: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
      panel: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
    })
    .optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export const createToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  description: z.string().min(1).max(400),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  parameters: z.record(z.unknown()),
  secretName: z.string().optional(),
  enabled: z.boolean().optional(),
});

export const knowledgeKind = z.enum(["text", "faq", "url", "sitemap", "file"]);

export const createKnowledgeSchema = z.object({
  kind: knowledgeKind,
  title: z.string().min(1).max(120),
  uri: z.string().optional(),
  content: z.string().optional(),
  agentId: z.string().optional(),
  pairs: z
    .array(z.object({ q: z.string(), a: z.string() }))
    .optional(),
});

export const chatRequestSchema = z.object({
  agentId: z.string(),
  conversationId: z.string().optional(),
  visitorId: z.string().min(8),
  userHash: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
});

export const widgetConfigSchema = z.object({
  agentId: z.string(),
  name: z.string(),
  greeting: z.string().nullable(),
  placeholder: z.string().nullable(),
  theme: z.record(z.string()).nullable(),
});

export const jobTypes = z.enum([
  "ingest.source",
  "ingest.embed",
  "usage.rollup",
  "catalog.sync",
]);
export type JobType = z.infer<typeof jobTypes>;

export const errorEnvelope = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type CreateAgent = z.infer<typeof createAgentSchema>;
export type CreateCredential = z.infer<typeof createCredentialSchema>;
export type CreateTool = z.infer<typeof createToolSchema>;
export type CreateKnowledge = z.infer<typeof createKnowledgeSchema>;
