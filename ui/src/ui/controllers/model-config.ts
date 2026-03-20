import type { GatewayBrowserClient } from "../gateway.ts";

// ─── Provider Presets ────────────────────────────────────────────────────────

export type ProviderPresetId =
  | "modelstudio"
  | "deepseek"
  | "openrouter"
  | "together"
  | "openai"
  | "custom";

export type ProviderPreset = {
  id: ProviderPresetId;
  displayName: string;
  defaultBaseUrl: string;
  apiHint: string;
  builtinModels: string[];
};

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "modelstudio",
    displayName: "阿里云百炼 (DashScope)",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiHint: "在 https://bailian.console.aliyun.com/ 创建 API Key",
    builtinModels: [
      "qwen3.5-plus",
      "qwen3-max-2026-01-23",
      "qwen3-coder-next",
      "qwen3-coder-plus",
      "qwen3-vl-plus",
    ],
  },
  {
    id: "deepseek",
    displayName: "DeepSeek",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    apiHint: "在 https://platform.deepseek.com/ 创建 API Key",
    builtinModels: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "openrouter",
    displayName: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    apiHint: "在 https://openrouter.ai/keys 创建 API Key",
    builtinModels: [],
  },
  {
    id: "together",
    displayName: "Together AI",
    defaultBaseUrl: "https://api.together.xyz/v1",
    apiHint: "在 https://api.together.xyz/ 创建 API Key",
    builtinModels: [],
  },
  {
    id: "openai",
    displayName: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    apiHint: "在 https://platform.openai.com/ 创建 API Key",
    builtinModels: ["gpt-4o", "gpt-4o-mini", "o3-mini"],
  },
  {
    id: "custom",
    displayName: "自定义 (OpenAI 兼容)",
    defaultBaseUrl: "",
    apiHint: "填写你的 API Key",
    builtinModels: [],
  },
];

export function getPreset(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProviderFormEntry = {
  /** Provider identifier used as the key in config (e.g. "modelstudio", "deepseek", "my-custom") */
  id: string;
  /** Human-readable label */
  displayName: string;
  /** Which preset this was created from (for UI hints) */
  presetId: ProviderPresetId;
  /** OpenAI-compatible base URL */
  baseUrl: string;
  /** API key */
  apiKey: string;
  /** Read-only built-in model IDs */
  builtinModels: string[];
  /** User-added custom model IDs */
  customModels: string[];
  /** Whether this card is expanded in the UI */
  expanded: boolean;
  /** Whether the API key is visible */
  apiKeyVisible: boolean;
};

export type ModelConfigForm = {
  providers: ProviderFormEntry[];
  defaultModel: string;
};

export type ProviderEntry = {
  baseUrl?: string;
  api?: string;
  apiKey?: string;
  apiKeyRef?: unknown;
  models?: Array<{ id: string; name?: string }>;
};

export type ModelConfigState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  modelConfigLoading: boolean;
  modelConfigSaving: boolean;
  modelConfigError: string | null;
  modelConfigSaveSuccess: boolean;
  modelConfigProviders: Record<string, ProviderEntry>;
  modelConfigForm: ModelConfigForm;
  modelConfigBaseHash: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** All model IDs across all providers, formatted as providerId/modelId */
export function allProviderModelIds(form: ModelConfigForm): string[] {
  const result: string[] = [];
  for (const provider of form.providers) {
    const seen = new Set<string>();
    for (const id of provider.builtinModels) {
      if (!seen.has(id)) {
        seen.add(id);
        result.push(`${provider.id}/${id}`);
      }
    }
    for (const id of provider.customModels) {
      const trimmed = id.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        result.push(`${provider.id}/${trimmed}`);
      }
    }
  }
  return result;
}

/** Guess the preset from a raw provider entry */
function guessPreset(providerId: string, entry: ProviderEntry): ProviderPreset | undefined {
  // Direct match by id
  const direct = getPreset(providerId);
  if (direct && direct.id !== "custom") return direct;
  // Match by baseUrl
  const url = entry.baseUrl ?? "";
  for (const preset of PROVIDER_PRESETS) {
    if (preset.id === "custom") continue;
    if (url && preset.defaultBaseUrl && url.includes(new URL(preset.defaultBaseUrl).hostname)) {
      return preset;
    }
  }
  return getPreset("custom");
}

/** Convert a raw provider config entry into a form entry */
function providerEntryToForm(id: string, entry: ProviderEntry): ProviderFormEntry {
  const preset = guessPreset(id, entry);
  const builtinSet = new Set(preset?.builtinModels ?? []);
  const modelIds = (entry.models ?? []).map((m) => m.id);
  const customModels = modelIds.filter((mid) => !builtinSet.has(mid));

  return {
    id,
    displayName: preset?.displayName ?? id,
    presetId: (preset?.id ?? "custom") as ProviderPresetId,
    baseUrl: entry.baseUrl ?? preset?.defaultBaseUrl ?? "",
    apiKey: (entry.apiKey as string) ?? "",
    builtinModels: preset?.builtinModels ?? [],
    customModels,
    expanded: false,
    apiKeyVisible: false,
  };
}

// ─── Controller functions ────────────────────────────────────────────────────

/**
 * Load all provider configurations from the gateway config snapshot.
 */
export async function loadModelConfig(state: ModelConfigState): Promise<void> {
  if (!state.client || !state.connected) return;

  state.modelConfigLoading = true;
  state.modelConfigError = null;

  try {
    const snapshot = await state.client.request<{
      config?: Record<string, unknown>;
      hash?: string;
    }>("config.get", {});

    state.modelConfigBaseHash = snapshot?.hash ?? null;

    const cfg = snapshot?.config as {
      models?: {
        providers?: Record<string, ProviderEntry>;
      };
      agents?: {
        defaults?: {
          model?: { primary?: string };
        };
      };
    } | null;

    const providers = cfg?.models?.providers ?? {};
    state.modelConfigProviders = providers as Record<string, ProviderEntry>;

    // Convert each provider to a form entry
    const formProviders: ProviderFormEntry[] = [];
    for (const [id, entry] of Object.entries(providers)) {
      formProviders.push(providerEntryToForm(id, entry as ProviderEntry));
    }

    const existingDefault =
      cfg?.agents?.defaults?.model?.primary ?? "";

    state.modelConfigForm = {
      providers: formProviders,
      defaultModel: existingDefault,
    };
  } catch (err) {
    state.modelConfigError = String(err);
  } finally {
    state.modelConfigLoading = false;
  }
}

/**
 * Build model definitions array for a provider form entry.
 */
function buildProviderModels(
  entry: ProviderFormEntry,
): Array<Record<string, unknown>> {
  const models: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();

  for (const id of entry.builtinModels) {
    if (seen.has(id)) continue;
    seen.add(id);
    models.push({
      id,
      name: id,
      reasoning: false,
      input: ["text"],
      contextWindow: 262144,
      maxTokens: 65536,
    });
  }

  for (const id of entry.customModels) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    models.push({
      id: trimmed,
      name: trimmed,
      reasoning: false,
      input: ["text", "image"],
      contextWindow: 262144,
      maxTokens: 65536,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    });
  }

  return models;
}

/**
 * Save all providers to gateway config and trigger hot restart.
 */
export async function saveModelConfig(state: ModelConfigState): Promise<void> {
  if (!state.client || !state.connected) return;
  if (!state.modelConfigBaseHash) {
    state.modelConfigError = "Config hash missing. Please reload the page and try again.";
    return;
  }

  state.modelConfigSaving = true;
  state.modelConfigError = null;
  state.modelConfigSaveSuccess = false;

  try {
    const { providers, defaultModel } = state.modelConfigForm;

    // Validate: at least one provider with apiKey
    if (providers.length === 0) {
      state.modelConfigError = "请至少添加一个模型提供商。";
      return;
    }
    for (const p of providers) {
      if (!p.apiKey.trim()) {
        state.modelConfigError = `Provider "${p.displayName}" 的 API Key 不能为空。`;
        return;
      }
      if (!p.baseUrl.trim()) {
        state.modelConfigError = `Provider "${p.displayName}" 的 Base URL 不能为空。`;
        return;
      }
    }
    if (!defaultModel.trim()) {
      state.modelConfigError = "请选择默认模型。";
      return;
    }

    // Build providers patch
    const providersConfig: Record<string, unknown> = {};
    for (const p of providers) {
      providersConfig[p.id] = {
        baseUrl: p.baseUrl.trim(),
        api: "openai-completions",
        apiKey: p.apiKey.trim(),
        models: buildProviderModels(p),
      };
    }

    const patch = {
      models: {
        mode: "merge",
        providers: providersConfig,
      },
      agents: {
        defaults: {
          model: {
            primary: defaultModel.trim(),
          },
        },
      },
    };

    await state.client.request("config.apply", {
      raw: JSON.stringify(patch, null, 2),
      baseHash: state.modelConfigBaseHash,
    });

    state.modelConfigSaveSuccess = true;
    await loadModelConfig(state);
  } catch (err) {
    state.modelConfigError = String(err);
  } finally {
    state.modelConfigSaving = false;
  }
}

/**
 * Add a new provider from a preset template.
 */
export function addProvider(
  state: ModelConfigState,
  presetId: ProviderPresetId,
  customId?: string,
): void {
  const preset = getPreset(presetId);
  if (!preset) return;

  const id = presetId === "custom" ? (customId?.trim() || `custom-${Date.now()}`) : presetId;

  // Don't add if same id already exists
  if (state.modelConfigForm.providers.some((p) => p.id === id)) {
    state.modelConfigError = `Provider "${id}" 已存在。`;
    return;
  }

  const entry: ProviderFormEntry = {
    id,
    displayName: presetId === "custom" ? (customId?.trim() || "自定义") : preset.displayName,
    presetId,
    baseUrl: preset.defaultBaseUrl,
    apiKey: "",
    builtinModels: [...preset.builtinModels],
    customModels: [],
    expanded: true,
    apiKeyVisible: false,
  };

  state.modelConfigForm = {
    ...state.modelConfigForm,
    providers: [...state.modelConfigForm.providers, entry],
  };
}

/**
 * Remove a provider at the given index.
 */
export function removeProvider(state: ModelConfigState, index: number): void {
  const providers = [...state.modelConfigForm.providers];
  const removed = providers[index];
  providers.splice(index, 1);

  let { defaultModel } = state.modelConfigForm;
  // If the default model belonged to the removed provider, clear it
  if (removed && defaultModel.startsWith(`${removed.id}/`)) {
    defaultModel = "";
  }

  state.modelConfigForm = {
    ...state.modelConfigForm,
    providers,
    defaultModel,
  };
}

/**
 * Update a specific provider form entry field.
 */
export function updateProvider(
  state: ModelConfigState,
  index: number,
  updates: Partial<ProviderFormEntry>,
): void {
  const providers = [...state.modelConfigForm.providers];
  providers[index] = { ...providers[index], ...updates };
  state.modelConfigForm = {
    ...state.modelConfigForm,
    providers,
  };
}

/**
 * Add a custom model ID to a specific provider.
 */
export function addCustomModelToProvider(
  state: ModelConfigState,
  providerIndex: number,
  modelId: string,
): void {
  const trimmed = modelId.trim();
  if (!trimmed) return;
  const provider = state.modelConfigForm.providers[providerIndex];
  if (!provider) return;
  if (provider.customModels.includes(trimmed)) return;
  if (provider.builtinModels.includes(trimmed)) return;

  updateProvider(state, providerIndex, {
    customModels: [...provider.customModels, trimmed],
  });
}

/**
 * Remove a custom model ID from a specific provider.
 */
export function removeCustomModelFromProvider(
  state: ModelConfigState,
  providerIndex: number,
  modelIndex: number,
): void {
  const provider = state.modelConfigForm.providers[providerIndex];
  if (!provider) return;
  const customModels = [...provider.customModels];
  customModels.splice(modelIndex, 1);
  updateProvider(state, providerIndex, { customModels });
}

/**
 * Toggle provider card expansion.
 */
export function toggleProviderExpanded(
  state: ModelConfigState,
  index: number,
): void {
  const provider = state.modelConfigForm.providers[index];
  if (!provider) return;
  updateProvider(state, index, { expanded: !provider.expanded });
}

/**
 * Clear the save success flag.
 */
export function resetModelConfigSaveSuccess(state: ModelConfigState): void {
  state.modelConfigSaveSuccess = false;
}
