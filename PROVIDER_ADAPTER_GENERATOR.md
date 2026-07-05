# PROVIDER_ADAPTER_GENERATOR.md

# AI Token Monitor (ATM) — Provider Adapter Generator System

This document defines the AI-friendly system for generating provider integrations in a consistent and automated way.

---

# Core Idea

Every AI provider is implemented as a **standard adapter**.

To avoid repetitive coding, adapters are generated using a **template-based system**.

---

# Folder Structure

```text id="structure"
providers/
  base.ts
  openai.ts
  anthropic.ts
  openrouter.ts

templates/
  openai-compatible.template.ts
  anthropic.template.ts
  google.template.ts
```

---

# Base Adapter Interface

All providers must implement:

```ts id="base-interface"
export interface ProviderAdapter {
  id: string;

  fetchModels(): Promise<ModelRecord[]>;
  fetchUsage(): Promise<NormalizedUsageRecord[]>;

  fetchPricing?(): Promise<PricingRecord[]>;

  healthCheck(): Promise<boolean>;
}
```

---

# Base Class

All adapters extend a shared base:

```ts id="base-class"
export abstract class BaseProvider implements ProviderAdapter {
  abstract id: string;

  abstract fetchModels(): Promise<ModelRecord[]>;
  abstract fetchUsage(): Promise<NormalizedUsageRecord[]>;

  async healthCheck(): Promise<boolean> {
    return true;
  }

  calculateCost(inputTokens: number, outputTokens: number, model: ModelRecord) {
    return (
      (inputTokens / 1000) * model.input_price_per_1k +
      (outputTokens / 1000) * model.output_price_per_1k
    );
  }
}
```

---

# Adapter Generation Strategy

Each provider is defined using a **template descriptor**.

Example:

```ts id="template-definition"
export const openaiTemplate = {
  id: "openai",
  baseUrl: "https://api.openai.com/v1",

  auth: {
    type: "bearer",
    header: "Authorization"
  },

  endpoints: {
    models: "/models",
    usage: "/usage"
  },

  format: "openai-compatible"
};
```

---

# AI Adapter Generator Rules

When generating a new provider:

1. Identify API style:

   * OpenAI-compatible
   * Anthropic-style
   * Custom/Hybrid

2. Select template:

   * openai-compatible.template.ts
   * anthropic.template.ts
   * custom.template.ts

3. Map response fields into:

```ts id="normalized-output"
{
  providerId,
  modelId,
  inputTokens,
  outputTokens,
  timestamp,
  costUSD
}
```

---

# OpenAI-Compatible Example

```ts id="openai-adapter"
export class OpenAIProvider extends BaseProvider {
  id = "openai";

  async fetchUsage() {
    const res = await fetch("https://api.openai.com/v1/usage", {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    const data = await res.json();

    return data.data.map(normalizeOpenAIUsage);
  }
}
```

---

# OpenRouter Special Case

Rules:

* acts as aggregator
* expands multiple providers under one API
* must store:

  * requested model
  * routed model

---

# Required Output Contract

Every adapter MUST output:

```ts id="contract"
type NormalizedUsageRecord = {
  providerId: string;
  modelId: string;
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
};
```

---

# What NOT to Do

Do NOT:

* introduce ORMs per provider
* store raw API structures in DB
* create provider-specific schemas
* duplicate logic across adapters

---

# Guiding Principle

A provider adapter is NOT a full SDK.

It is a **translator from external API → internal normalized telemetry.**
