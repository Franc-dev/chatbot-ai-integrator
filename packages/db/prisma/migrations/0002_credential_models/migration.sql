-- Org-scoped model ids on custom OpenAI-compatible credentials.
ALTER TABLE "ProviderCredential" ADD COLUMN IF NOT EXISTS "models" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
