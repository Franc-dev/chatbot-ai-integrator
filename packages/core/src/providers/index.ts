import { createAnthropic } from "@ai-sdk/anthropic";
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

export function parseModelRef(ref: string): { provider: ProviderKind; model: string } {
  const [provider, ...rest] = ref.split("/");
  const model = rest.join("/") || provider || "gpt-4.1-mini";
  const known: ProviderKind[] = [
    "openai",
    "anthropic",
    "openrouter",
    "vercel-gateway",
    "zai",
    "custom",
  ];
  if (provider && known.includes(provider as ProviderKind)) {
    return { provider: provider as ProviderKind, model };
  }
  return { provider: "openai", model: ref };
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
  const { provider, model } = parseModelRef(modelRef);
  const cred = await resolveApiKey(orgId, credentialId);

  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey: cred?.apiKey ?? process.env.OPENAI_API_KEY });
      return openai(model);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: cred?.apiKey });
      return anthropic(model);
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
      const custom = createOpenAICompatible({
        name: "custom",
        apiKey: cred?.apiKey,
        baseURL: cred?.baseUrl ?? "https://api.openai.com/v1",
      });
      return custom(model);
    }
  }
}

export { ZAI_URLS };
