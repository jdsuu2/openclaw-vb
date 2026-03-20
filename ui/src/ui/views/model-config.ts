import { html, nothing } from "lit";
import {
  allProviderModelIds,
  PROVIDER_PRESETS,
  type ModelConfigState,
  type ProviderFormEntry,
  type ProviderPresetId,
} from "../controllers/model-config.ts";

// ─── Props ────────────────────────────────────────────────────────────────────

export type ModelConfigProps = {
  state: ModelConfigState;
  onAddProvider: (presetId: ProviderPresetId, customId?: string) => void;
  onRemoveProvider: (index: number) => void;
  onToggleProviderExpanded: (index: number) => void;
  onProviderBaseUrlChange: (index: number, value: string) => void;
  onProviderApiKeyChange: (index: number, value: string) => void;
  onProviderApiKeyVisibilityToggle: (index: number) => void;
  onAddCustomModel: (providerIndex: number, modelId: string) => void;
  onRemoveCustomModel: (providerIndex: number, modelIndex: number) => void;
  onDefaultModelChange: (value: string) => void;
  /** Per-provider new-model input state */
  newModelInputs: Record<number, string>;
  onNewModelInput: (providerIndex: number, value: string) => void;
  /** Add-provider form state */
  addProviderPreset: ProviderPresetId;
  addProviderCustomId: string;
  onAddProviderPresetChange: (value: ProviderPresetId) => void;
  onAddProviderCustomIdChange: (value: string) => void;
  onSave: () => void;
  onLoad: () => void;
};

// ─── Provider Badge ──────────────────────────────────────────────────────────

function renderProviderBadge(id: string, hasApiKey: boolean) {
  return html`
    <span
      class="mc-provider-badge ${hasApiKey ? "mc-provider-badge--active" : "mc-provider-badge--inactive"}"
      title="${id}"
    >
      <span class="mc-provider-badge__dot"></span>
      <span class="mc-provider-badge__id">${id}</span>
    </span>
  `;
}

function renderProvidersSummary(state: ModelConfigState) {
  const entries = Object.entries(state.modelConfigProviders);
  if (entries.length === 0) {
    return html`
      <section class="mc-section">
        <h3 class="mc-section__title">当前已配置的 Providers</h3>
        <p class="mc-empty">暂无已配置的 Provider（保存配置后将显示）</p>
      </section>
    `;
  }
  return html`
    <section class="mc-section">
      <h3 class="mc-section__title">当前已配置的 Providers</h3>
      <div class="mc-providers-list">
        ${entries.map(([id, provider]) => {
          const hasApiKey = Boolean(
            (provider as Record<string, unknown>)["apiKey"] ||
              (provider as Record<string, unknown>)["apiKeyRef"],
          );
          return renderProviderBadge(id, hasApiKey);
        })}
      </div>
    </section>
  `;
}

// ─── Provider Card ───────────────────────────────────────────────────────────

function renderProviderCard(
  provider: ProviderFormEntry,
  index: number,
  props: ModelConfigProps,
) {
  const newModelValue = props.newModelInputs[index] ?? "";
  const allModels = [...provider.builtinModels, ...provider.customModels];

  return html`
    <div class="mc-card">
      <div class="mc-card__header" @click=${() => props.onToggleProviderExpanded(index)}>
        <div class="mc-card__header-left">
          <span class="mc-card__chevron ${provider.expanded ? "mc-card__chevron--open" : ""}">&#9654;</span>
          <strong class="mc-card__title">${provider.displayName}</strong>
          <code class="mc-card__id">${provider.id}</code>
        </div>
        <button
          class="mc-btn mc-btn--remove"
          type="button"
          title="删除 ${provider.displayName}"
          @click=${(e: Event) => {
            e.stopPropagation();
            props.onRemoveProvider(index);
          }}
        >
          &times;
        </button>
      </div>

      ${provider.expanded
        ? html`
            <div class="mc-card__body">
              <!-- Base URL -->
              <div class="mc-field">
                <label class="mc-field__label">
                  Base URL <span class="mc-field__required">*</span>
                </label>
                <input
                  class="mc-input"
                  type="text"
                  .value=${provider.baseUrl}
                  placeholder="https://api.example.com/v1"
                  @input=${(e: Event) =>
                    props.onProviderBaseUrlChange(index, (e.target as HTMLInputElement).value)}
                />
              </div>

              <!-- API Key -->
              <div class="mc-field">
                <label class="mc-field__label">
                  API Key <span class="mc-field__required">*</span>
                </label>
                <div class="mc-input-row">
                  <input
                    class="mc-input"
                    .type=${provider.apiKeyVisible ? "text" : "password"}
                    .value=${provider.apiKey}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxx"
                    autocomplete="off"
                    spellcheck="false"
                    @input=${(e: Event) =>
                      props.onProviderApiKeyChange(index, (e.target as HTMLInputElement).value)}
                  />
                  <button
                    class="mc-btn mc-btn--icon"
                    type="button"
                    title="${provider.apiKeyVisible ? "隐藏" : "显示"}"
                    @click=${() => props.onProviderApiKeyVisibilityToggle(index)}
                  >
                    ${provider.apiKeyVisible ? "\u{1F648}" : "\u{1F441}"}
                  </button>
                </div>
                ${getPreset(provider.presetId)?.apiHint
                  ? html`<p class="mc-field__hint">${getPreset(provider.presetId)!.apiHint}</p>`
                  : nothing}
              </div>

              <!-- Models -->
              <div class="mc-field">
                <label class="mc-field__label">模型列表</label>

                ${provider.builtinModels.length > 0
                  ? html`
                      <div class="mc-field__sub-label">内置模型</div>
                      <div class="mc-tags">
                        ${provider.builtinModels.map(
                          (id) => html`<span class="mc-tag mc-tag--builtin">${id}</span>`,
                        )}
                      </div>
                    `
                  : nothing}

                ${provider.customModels.length > 0
                  ? html`
                      <div class="mc-field__sub-label" style="margin-top:0.5rem">自定义模型</div>
                      <div class="mc-custom-list">
                        ${provider.customModels.map(
                          (id, mi) => html`
                            <div class="mc-custom-item">
                              <span class="mc-tag">${id}</span>
                              <button
                                class="mc-btn mc-btn--remove-sm"
                                type="button"
                                @click=${() => props.onRemoveCustomModel(index, mi)}
                              >
                                &times;
                              </button>
                            </div>
                          `,
                        )}
                      </div>
                    `
                  : nothing}

                <div class="mc-input-row mc-input-row--add">
                  <input
                    class="mc-input"
                    type="text"
                    .value=${newModelValue}
                    placeholder="输入模型 ID，如 qwen3-vl-plus"
                    @input=${(e: Event) =>
                      props.onNewModelInput(index, (e.target as HTMLInputElement).value)}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === "Enter" && newModelValue.trim()) {
                        props.onAddCustomModel(index, newModelValue.trim());
                        props.onNewModelInput(index, "");
                      }
                    }}
                  />
                  <button
                    class="mc-btn mc-btn--secondary"
                    type="button"
                    ?disabled=${!newModelValue.trim()}
                    @click=${() => {
                      if (newModelValue.trim()) {
                        props.onAddCustomModel(index, newModelValue.trim());
                        props.onNewModelInput(index, "");
                      }
                    }}
                  >
                    + 添加
                  </button>
                </div>

                ${allModels.length > 0
                  ? html`<p class="mc-field__hint">
                      共 ${allModels.length} 个模型
                    </p>`
                  : nothing}
              </div>
            </div>
          `
        : nothing}
    </div>
  `;
}

function getPreset(id: string) {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}

// ─── Add Provider Section ────────────────────────────────────────────────────

function renderAddProvider(props: ModelConfigProps) {
  const existingIds = new Set(props.state.modelConfigForm.providers.map((p) => p.id));
  const isCustom = props.addProviderPreset === "custom";

  return html`
    <section class="mc-section">
      <h3 class="mc-section__title">添加模型提供商</h3>
      <div class="mc-add-row">
        <select
          class="mc-select"
          .value=${props.addProviderPreset}
          @change=${(e: Event) =>
            props.onAddProviderPresetChange((e.target as HTMLSelectElement).value as ProviderPresetId)}
        >
          ${PROVIDER_PRESETS.map(
            (preset) => html`
              <option
                value="${preset.id}"
                ?disabled=${preset.id !== "custom" && existingIds.has(preset.id)}
              >
                ${preset.displayName}
                ${preset.id !== "custom" && existingIds.has(preset.id) ? "（已添加）" : ""}
              </option>
            `,
          )}
        </select>

        ${isCustom
          ? html`
              <input
                class="mc-input mc-input--custom-id"
                type="text"
                .value=${props.addProviderCustomId}
                placeholder="Provider ID（如 my-api）"
                @input=${(e: Event) =>
                  props.onAddProviderCustomIdChange((e.target as HTMLInputElement).value)}
              />
            `
          : nothing}

        <button
          class="mc-btn mc-btn--primary"
          type="button"
          ?disabled=${isCustom && !props.addProviderCustomId.trim()}
          @click=${() => {
            props.onAddProvider(
              props.addProviderPreset,
              isCustom ? props.addProviderCustomId.trim() : undefined,
            );
            if (isCustom) props.onAddProviderCustomIdChange("");
          }}
        >
          + 添加
        </button>
      </div>
    </section>
  `;
}

// ─── Main view ───────────────────────────────────────────────────────────────

export function renderModelConfig(props: ModelConfigProps) {
  const { state, onDefaultModelChange, onSave, onLoad } = props;
  const { providers, defaultModel } = state.modelConfigForm;
  const allIds = allProviderModelIds(state.modelConfigForm);

  return html`
    <div class="mc-page">
      <!-- Header -->
      <div class="mc-header">
        <h2 class="mc-header__title">模型配置</h2>
        <button
          class="mc-btn mc-btn--secondary"
          @click=${onLoad}
          ?disabled=${state.modelConfigLoading}
        >
          ${state.modelConfigLoading ? "加载中\u2026" : "刷新"}
        </button>
      </div>

      <!-- Error banner -->
      ${state.modelConfigError
        ? html`<div class="mc-error"><span class="mc-error__icon">&#9888;</span><span>${state.modelConfigError}</span></div>`
        : nothing}

      <!-- Success banner -->
      ${state.modelConfigSaveSuccess
        ? html`<div class="mc-success"><span>&#10003; 配置已保存，Gateway 正在重启\u2026</span></div>`
        : nothing}

      <!-- Providers summary -->
      ${renderProvidersSummary(state)}

      <!-- Provider cards -->
      ${providers.length > 0
        ? html`
            <section class="mc-section">
              <h3 class="mc-section__title">Provider 配置</h3>
              ${providers.map((p, i) => renderProviderCard(p, i, props))}
            </section>
          `
        : nothing}

      <!-- Add provider -->
      ${renderAddProvider(props)}

      <!-- Default Model -->
      ${allIds.length > 0
        ? html`
            <section class="mc-section">
              <h3 class="mc-section__title">Agent 默认模型</h3>
              <div class="mc-field">
                <label class="mc-field__label" for="mc-default-model">
                  默认模型 <span class="mc-field__required">*</span>
                </label>
                <select
                  id="mc-default-model"
                  class="mc-select"
                  .value=${defaultModel}
                  @change=${(e: Event) =>
                    onDefaultModelChange((e.target as HTMLSelectElement).value)}
                >
                  <option value="" ?selected=${!defaultModel}>-- 请选择 --</option>
                  ${allIds.map(
                    (id) => html`
                      <option value="${id}" .selected=${id === defaultModel}>${id}</option>
                    `,
                  )}
                </select>
                <p class="mc-field__hint">
                  选择的模型将作为 <code>agents.defaults.model.primary</code> 写入配置。
                </p>
              </div>
            </section>
          `
        : nothing}

      <!-- Save button -->
      <section class="mc-section mc-section--actions">
        <button
          class="mc-btn mc-btn--primary mc-btn--lg"
          type="button"
          ?disabled=${state.modelConfigSaving || state.modelConfigLoading}
          @click=${onSave}
        >
          ${state.modelConfigSaving
            ? html`<span class="mc-btn__spinner">&#10227;</span> 保存中\u2026`
            : "保存并重启 Gateway"}
        </button>
        ${state.modelConfigSaveSuccess
          ? html`<span class="mc-save-ok">&#10003; 已保存</span>`
          : nothing}
      </section>

      <!-- Styles -->
      <style>
        .mc-page { padding: 1.5rem; max-width: 800px; display: flex; flex-direction: column; gap: 0; }
        .mc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
        .mc-header__title { margin: 0; font-size: 1.25rem; font-weight: 600; }

        .mc-section { border: 1px solid var(--border, #e2e8f0); border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; background: var(--surface, #fff); }
        .mc-section--actions { display: flex; align-items: center; gap: 1rem; background: transparent; border: none; padding: 0.5rem 0; }
        .mc-section__title { margin: 0 0 1rem 0; font-size: 0.95rem; font-weight: 600; color: var(--text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.05em; }

        .mc-field { margin-bottom: 1.25rem; }
        .mc-field:last-child { margin-bottom: 0; }
        .mc-field__label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; }
        .mc-field__sub-label { font-size: 0.8rem; font-weight: 500; color: var(--text-secondary, #64748b); margin-bottom: 0.35rem; }
        .mc-field__required { color: var(--color-error, #ef4444); margin-left: 2px; }
        .mc-field__hint { font-size: 0.8rem; color: var(--text-secondary, #64748b); margin: 0.4rem 0 0 0; }

        .mc-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border, #e2e8f0); border-radius: 6px; font-size: 0.875rem; font-family: monospace; box-sizing: border-box; background: var(--input-bg, #f8fafc); color: var(--text-primary, #1e293b); outline: none; transition: border-color 0.15s; }
        .mc-input:focus { border-color: var(--color-accent, #6366f1); }
        .mc-input--custom-id { max-width: 200px; }

        .mc-select { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border, #e2e8f0); border-radius: 6px; font-size: 0.875rem; box-sizing: border-box; background: var(--input-bg, #f8fafc); color: var(--text-primary, #1e293b); cursor: pointer; }

        .mc-input-row { display: flex; gap: 0.5rem; align-items: stretch; }
        .mc-input-row .mc-input { flex: 1; }
        .mc-input-row--add { margin-top: 0.5rem; }

        .mc-add-row { display: flex; gap: 0.5rem; align-items: stretch; flex-wrap: wrap; }
        .mc-add-row .mc-select { flex: 1; min-width: 200px; }

        .mc-btn { padding: 0.45rem 1rem; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: opacity 0.15s, background 0.15s; }
        .mc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .mc-btn--primary { background: var(--color-accent, #6366f1); color: #fff; }
        .mc-btn--primary:hover:not(:disabled) { background: var(--color-accent-hover, #4f46e5); }
        .mc-btn--lg { padding: 0.6rem 1.5rem; font-size: 0.95rem; }
        .mc-btn--secondary { background: var(--surface-raised, #f1f5f9); color: var(--text-primary, #1e293b); border: 1px solid var(--border, #e2e8f0); }
        .mc-btn--secondary:hover:not(:disabled) { background: var(--hover-bg, #e2e8f0); }
        .mc-btn--icon { background: transparent; border: 1px solid var(--border, #e2e8f0); border-radius: 6px; padding: 0.45rem 0.6rem; font-size: 1rem; cursor: pointer; line-height: 1; }
        .mc-btn--remove { background: transparent; border: none; color: var(--color-error, #ef4444); font-size: 1.3rem; line-height: 1; padding: 0.2rem 0.5rem; cursor: pointer; border-radius: 4px; transition: background 0.1s; }
        .mc-btn--remove:hover { background: rgba(239, 68, 68, 0.1); }
        .mc-btn--remove-sm { background: transparent; border: none; color: var(--color-error, #ef4444); font-size: 1.1rem; line-height: 1; padding: 0.2rem 0.4rem; cursor: pointer; border-radius: 4px; }
        .mc-btn--remove-sm:hover { background: rgba(239, 68, 68, 0.1); }
        .mc-btn__spinner { display: inline-block; animation: mc-spin 0.8s linear infinite; }
        @keyframes mc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .mc-error { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; color: var(--color-error, #ef4444); font-size: 0.875rem; margin-bottom: 1rem; }
        .mc-success { padding: 0.75rem 1rem; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 6px; color: var(--color-success, #16a34a); font-size: 0.875rem; margin-bottom: 1rem; }
        .mc-save-ok { color: var(--color-success, #16a34a); font-size: 0.875rem; font-weight: 500; }
        .mc-empty { color: var(--text-secondary, #64748b); font-size: 0.875rem; margin: 0; }

        .mc-providers-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .mc-provider-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 500; border: 1px solid transparent; }
        .mc-provider-badge--active { background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3); color: var(--color-success, #16a34a); }
        .mc-provider-badge--inactive { background: var(--surface-raised, #f1f5f9); border-color: var(--border, #e2e8f0); color: var(--text-secondary, #64748b); }
        .mc-provider-badge__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

        .mc-card { border: 1px solid var(--border, #e2e8f0); border-radius: 8px; margin-bottom: 0.75rem; overflow: hidden; }
        .mc-card__header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; cursor: pointer; background: var(--surface-raised, #f8fafc); transition: background 0.1s; }
        .mc-card__header:hover { background: var(--hover-bg, #f1f5f9); }
        .mc-card__header-left { display: flex; align-items: center; gap: 0.5rem; }
        .mc-card__chevron { font-size: 0.65rem; color: var(--text-secondary, #64748b); transition: transform 0.15s; display: inline-block; }
        .mc-card__chevron--open { transform: rotate(90deg); }
        .mc-card__title { font-size: 0.9rem; }
        .mc-card__id { font-size: 0.75rem; color: var(--text-secondary, #64748b); background: var(--surface, #fff); padding: 0.1rem 0.4rem; border-radius: 3px; border: 1px solid var(--border, #e2e8f0); }
        .mc-card__body { padding: 1rem; border-top: 1px solid var(--border, #e2e8f0); }

        .mc-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .mc-tag { display: inline-block; padding: 0.25rem 0.6rem; background: var(--surface-raised, #f1f5f9); border: 1px solid var(--border, #e2e8f0); border-radius: 4px; font-size: 0.8rem; font-family: monospace; color: var(--text-primary, #1e293b); }
        .mc-tag--builtin { color: var(--text-secondary, #64748b); }
        .mc-custom-list { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.5rem; }
        .mc-custom-item { display: flex; align-items: center; gap: 0.4rem; }
      </style>
    </div>
  `;
}
