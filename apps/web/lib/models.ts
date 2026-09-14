export type CatalogModel = {
  provider: string;
  modelId: string;
  displayName: string;
  credentialId?: string | null;
};

export type ModelOption = {
  value: string;
  modelRef: string;
  label: string;
  hint?: string;
  credentialId?: string | null;
};

export const DEFAULT_MODELS: ModelOption[] = [
  { value: "openai/gpt-4.1-mini", modelRef: "openai/gpt-4.1-mini", label: "OpenAI · GPT-4.1 mini" },
  { value: "google/gemini-2.5-flash", modelRef: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "google/gemini-2.0-flash", modelRef: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  {
    value: "anthropic/claude-sonnet-4.6",
    modelRef: "anthropic/claude-sonnet-4.6",
    label: "Anthropic · Claude Sonnet 4.6",
  },
  {
    value: "openrouter/openai/gpt-4.1-mini",
    modelRef: "openrouter/openai/gpt-4.1-mini",
    label: "OpenRouter · GPT-4.1 mini",
  },
  {
    value: "vercel-gateway/openai/gpt-4.1-mini",
    modelRef: "vercel-gateway/openai/gpt-4.1-mini",
    label: "Gateway · GPT-4.1 mini",
  },
  { value: "zai/glm-4.6", modelRef: "zai/glm-4.6", label: "z.ai · GLM-4.6" },
];

export function isCustomModelRef(ref: string) {
  return ref.startsWith("custom/");
}

export function isCustomModelOption(item: ModelOption) {
  return isCustomModelRef(item.modelRef) || Boolean(item.credentialId);
}

export function splitModelOption(value: string): { modelRef: string; credentialId: string | null } {
  const idx = value.lastIndexOf("::");
  if (idx === -1) return { modelRef: value, credentialId: null };
  return { modelRef: value.slice(0, idx), credentialId: value.slice(idx + 2) };
}

export function modelOptions(models: CatalogModel[], currentRef?: string): ModelOption[] {
  const options: ModelOption[] = DEFAULT_MODELS.map((item) => ({ ...item }));
  const seen = new Set(options.map((item) => item.value));

  const extras = [
    ...models.filter((model) => model.provider === "custom" || model.credentialId),
    ...models.filter((model) => model.provider !== "custom" && !model.credentialId),
  ];

  for (const model of extras) {
    const modelRef = `${model.provider}/${model.modelId}`;
    let value = modelRef;
    if (seen.has(value) && model.credentialId) value = `${modelRef}::${model.credentialId}`;
    if (seen.has(value)) continue;
    seen.add(value);
    options.push({
      value,
      modelRef,
      label: model.displayName,
      hint: model.provider === "custom" ? model.modelId : modelRef,
      credentialId: model.credentialId ?? null,
    });
  }

  if (currentRef && !options.some((item) => item.modelRef === currentRef)) {
    options.unshift({
      value: currentRef,
      modelRef: currentRef,
      label: currentRef,
      hint: "Saved on this agent",
    });
  }

  return options;
}

export function selectedModelValue(
  options: ModelOption[],
  modelRef: string,
  credentialId?: string | null,
) {
  const withCred = options.find(
    (item) => item.modelRef === modelRef && item.credentialId && item.credentialId === credentialId,
  );
  if (withCred) return withCred.value;
  return options.find((item) => item.modelRef === modelRef)?.value ?? modelRef;
}
