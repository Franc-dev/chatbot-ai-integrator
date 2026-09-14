import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGateway } from "@ai-sdk/gateway";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { ProviderKind, ZaiMode } from "@signal/contract";
import { decodeMasterKey, openSecret } from "../crypto/vault";
import { prisma } from "@signal/db";
import { getEnv } from "../env";

const ZAI_URLS = {
  general: "https://api.z.ai/api/paas/v4",
  coding: "https://api.z.ai/api/coding/paas/v4",
} as const;

const KNOWN_PROVIDERS: ProviderKind[] = [
  "openai",
  "anthropic",
  "google",
  "openrouter",
  "vercel-gateway",
  "zai",
  "custom",
];

export function parseModelRef(ref: string): { provider: ProviderKind; model: string } {
  const [provider, ...rest] = ref.split("/");
  const model = rest.join("/") || provider || "gpt-4.1-mini";
  if (provider && KNOWN_PROVIDERS.includes(provider as ProviderKind)) {
    return { provider: provider as ProviderKind, model };
  }
  return { provider: "openai", model: ref };
}

/** Model id sent to the provider API (strips a known `provider/` prefix). */
export function modelIdFromRef(ref: string): string {
  const [head, ...rest] = ref.split("/");
  if (head && KNOWN_PROVIDERS.includes(head as ProviderKind) && rest.length) {
    return rest.join("/");
  }
  return ref;
}

/**
 * Chat routing: a custom vault key always uses its OpenAI-compatible base URL.
 * A `custom/…` modelRef never inherits z.ai / OpenAI default URLs.
 */
export function routeChatProvider(
  modelRef: string,
  credProvider?: string | null,
): { provider: ProviderKind; model: string } {
  const parsed = parseModelRef(modelRef);
  if (credProvider === "custom" || parsed.provider === "custom") {
    return { provider: "custom", model: modelIdFromRef(modelRef) };
  }
  return parsed;
}

export async function resolveApiKey(orgId: string, credentialId?: string | null) {
  if (!credentialId) return null;
  const row = await prisma.providerCredential.findFirst({
    where: { id: credentialId, orgId },
  });
  if (!row) return null;
  const master = decodeMasterKey(getEnv().ENCRYPTION_KEY);
  const apiKey = openSecret(row, master);
  return { apiKey, provider: row.provider as ProviderKind, baseUrl: row.baseUrl, zaiMode: row.zaiMode as ZaiMode | null };
}

export async function resolveModel(orgId: string, modelRef: string, credentialId?: string | null) {
  const cred = await resolveApiKey(orgId, credentialId);
  const { provider, model } = routeChatProvider(modelRef, cred?.provider);

  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey: cred?.apiKey ?? process.env.OPENAI_API_KEY });
      return openai(model);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: cred?.apiKey });
      return anthropic(model);
    }
    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey: cred?.apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
      return google(model);
    }
    case "openrouter": {
      const openrouter = createOpenRouter({ apiKey: cred?.apiKey });
      return openrouter(model);
    }
    case "vercel-gateway": {
      const gateway = createGateway({ apiKey: cred?.apiKey });
      return gateway(model);
    }
    case "zai": {
      const mode = cred?.zaiMode === "coding" ? "coding" : "general";
      const zai = createOpenAICompatible({
        name: "zai",
        apiKey: cred?.apiKey,
        baseURL: cred?.baseUrl ?? ZAI_URLS[mode],
      });
      return zai(model);
    }
    case "custom": {
      if (cred?.provider && cred.provider !== "custom") {
        throw new Error("Pick the Custom OpenAI-compatible vault key for this model.");
      }
      if (!cred?.baseUrl) {
        throw new Error("This custom model needs a vault key with a base URL.");
      }
      const custom = createOpenAICompatible({
        name: "custom",
        apiKey: cred.apiKey,
        baseURL: cred.baseUrl,
      });
      return custom(model);
    }
  }
}

export function publicProviderError(error: unknown): string {
  if (!error) return "The model provider rejected this request.";
  const err = error as {
    message?: string;
    statusCode?: number;
    data?: { error?: { message?: string } };
    responseBody?: string;
  };
  const nested = err.data?.error?.message;
  if (typeof nested === "string" && nested.trim()) return nested;
  if (typeof err.responseBody === "string") {
    try {
      const parsed = JSON.parse(err.responseBody) as { error?: { message?: string } };
      if (parsed.error?.message) return parsed.error.message;
    } catch {
      /* ignore */
    }
  }
  if (typeof err.message === "string" && err.message && !/api[_-]?key/i.test(err.message)) {
    return err.message;
  }
  if (err.statusCode === 402) {
    return "This provider is out of credits. Add credits or switch the agent credential.";
  }
  return "The model provider rejected this request.";
}

export { ZAI_URLS };
