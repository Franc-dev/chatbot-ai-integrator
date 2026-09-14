"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Button,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@signal/ui";
import {
  customModelRef,
  modelsForCustomCredential,
  parseModelIds,
} from "@signal/contract";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  isCustomModelOption,
  isCustomModelRef,
  modelOptions,
  selectedModelValue,
  splitModelOption,
  type CatalogModel,
} from "@/lib/models";

export type PickerCredential = {
  id: string;
  label: string;
  provider: string;
  models?: string[];
};

export function ModelPicker({
  models,
  modelRef,
  credentialId,
  credentials,
  onChange,
  onPersisted,
}: {
  models: CatalogModel[];
  modelRef: string;
  credentialId: string | null;
  credentials: PickerCredential[];
  onChange: (next: { modelRef: string; credentialId: string | null }) => void;
  onPersisted?: () => Promise<void> | void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const options = useMemo(() => modelOptions(models, modelRef), [models, modelRef]);
  const customOptions = options.filter(isCustomModelOption);
  const catalogOptions = options.filter((item) => !isCustomModelOption(item));
  const selectValue = selectedModelValue(options, modelRef, credentialId);
  const customCreds = credentials.filter((row) => row.provider === "custom");
  const targetCred =
    customCreds.find((row) => row.id === credentialId) ?? customCreds[0] ?? null;

  function pick(value: string) {
    const parsed = splitModelOption(value);
    const match = models.find(
      (model) =>
        `${model.provider}/${model.modelId}` === parsed.modelRef &&
        (!parsed.credentialId || model.credentialId === parsed.credentialId),
    );
    const nextCred = match?.credentialId ?? parsed.credentialId;
    const custom = Boolean(nextCred) || isCustomModelRef(parsed.modelRef);
    onChange({
      modelRef: parsed.modelRef,
      credentialId: custom ? nextCred : credentialId,
    });
    if (custom && nextCred) {
      const cred = credentials.find((row) => row.id === nextCred);
      const modelId = parsed.modelRef.replace(/^custom\//, "");
      if (cred && modelId && !(cred.models ?? []).includes(modelId)) {
        void persistModels(cred, [...modelsForCustomCredential(cred.models), modelId]);
      }
    }
  }

  async function persistModels(cred: PickerCredential, next: string[]) {
    try {
      await api(`/api/v1/credentials/${cred.id}`, {
        method: "PATCH",
        body: JSON.stringify({ models: parseModelIds(next) }),
      });
      await onPersisted?.();
    } catch {
      /* picker already selected; vault save can retry on Keys */
    }
  }

  async function addCustom(e: FormEvent) {
    e.preventDefault();
    const [id] = parseModelIds(draft);
    if (!id) return;
    if (!targetCred) {
      toast.error("Add a Custom OpenAI-compatible key on API keys first.");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/v1/credentials/${targetCred.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          models: parseModelIds([...modelsForCustomCredential(targetCred.models), id]),
        }),
      });
      onChange({ modelRef: customModelRef(id), credentialId: targetCred.id });
      setDraft("");
      toast.success(`Using ${id} via ${targetCred.label}`);
      await onPersisted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save model id");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <Field label="Model">
        <Select value={selectValue} onValueChange={pick}>
          <SelectTrigger aria-label="Model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {catalogOptions.map((item) => (
              <SelectItem key={item.value} value={item.value} hint={item.hint}>
                {item.label}
              </SelectItem>
            ))}
            {customOptions.length ? <SelectSeparator /> : null}
            {customOptions.map((item) => (
              <SelectItem key={item.value} value={item.value} hint={item.hint}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {customCreds.length ? (
        <form onSubmit={(event) => void addCustom(event)}>
          <Field
            label="Use custom model"
            hint={`Saved on ${targetCred?.label ?? "your custom key"}. Example: local-qwen-7b`}
          >
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="local-qwen-7b"
                className="tabular"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <Button type="submit" variant="ghost" loading={busy} disabled={!draft.trim()}>
                {busy ? "Saving…" : "Use"}
              </Button>
            </div>
          </Field>
        </form>
      ) : (
        <p className="text-[13px] leading-5 text-[var(--mute)]">
          Local Qwen and Gemma ids appear after you add a{" "}
          <Link href="/app/keys" className="text-[var(--accent)]">
            Custom OpenAI-compatible key
          </Link>
          .
        </p>
      )}
    </div>
  );
}
