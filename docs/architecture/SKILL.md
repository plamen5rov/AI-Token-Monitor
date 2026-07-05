# SKILL.md

## AI Token Monitor (ATM) – Provider Skills & API Map

This document defines supported AI providers, their API structure patterns, and
how they are normalized inside ATM.

ATM is a provider-agnostic analytics system. All providers are wrapped into a
unified interface regardless of underlying API differences.

---

## Core Concept

Every provider is treated as a **Skill Provider**:

A Skill Provider must expose:

* usage data (tokens, requests, costs)
* model catalog
* pricing information
* account limits (if available)
* sync capability

All providers are normalized into a single internal schema.

---

## Standard Provider Interface

Every provider adapter MUST implement:

```ts
interface ProviderSkill {
  id: string;

  fetchUsage(): Promise<UsageRecord[]>;
  fetchModels(): Promise<ModelRecord[]>;
  fetchPricing(): Promise<PricingRecord[]>;
  fetchLimits(): Promise<LimitRecord | null>;

  healthCheck(): Promise<boolean>;
}
```

---

## Common API Patterns (Across Providers)

Most AI providers fall into 3 categories:

---

## 1. OpenAI-Compatible API Pattern

Used by:

* OpenAI
* OpenRouter
* NVIDIA NIM
* Groq
* Together AI
* Fireworks AI
* DeepSeek
* DeepInfra
* Anyscale
* xAI
* many self-hosted gateways

### Key characteristics

* Base URL style:

```text
/v1/chat/completions
/v1/models
```

* Auth:

```text
Authorization: Bearer <API_KEY>
```

* Usage returned inside response:

```json
"usage": {
  "prompt_tokens": 123,
  "completion_tokens": 456,
  "total_tokens": 579
}
```

* Model format:

```text
gpt-4o
claude-3.5-sonnet (via router)
llama-3.1-70b
```

### Notes

This is the easiest group to normalize.

---

## 2. Anthropic API Pattern

Used by:

* Anthropic direct API
* Claude models
* some hybrid gateways

### Key characteristics (2)

* Endpoint:

```text
/v1/messages
```

* Request format differs from OpenAI:

```json
{
  "model": "claude-3-5-sonnet",
  "messages": [...]
}
```

* Usage:

```json
"usage": {
  "input_tokens": 123,
  "output_tokens": 456
}
```

### Important

Token fields are split (input/output), not unified.

---

## 3. Google Gemini / Vertex AI Pattern

Used by:

* Google AI Studio
* Vertex AI

### Key characteristics (3)

* Endpoint is region-based or project-based

* Auth often via:

  * API key OR
  * OAuth / service account

* Model format:

```text
gemini-1.5-pro
gemini-1.5-flash
```

* Usage reporting is often:

  * partial
  * delayed
  * or only available in billing APIs

### Important (2)

Google often separates:

* inference API
* billing API (completely different system)

---

## 4. Aggregator / Router Pattern

Used by:

* OpenRouter
* similar “AI gateways”

### Key characteristics (4)

* One API key → many providers
* unified endpoint
* model routing via string

Example:

```text
model: "anthropic/claude-3-opus"
model: "openai/gpt-4o"
model: "meta/llama-3.1"
```

### Usage

Always includes:

```json
{
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 456,
    "cost": 0.0021
  },
  "model": "actual-model-used"
}
```

---

## Normalized Internal ATM Schema

All providers MUST be normalized into:

```ts
type NormalizedUsage = {
  provider: string;
  model: string;
  timestamp: number;

  inputTokens: number;
  outputTokens: number;

  costUSD: number;
};
```

---

## Provider Skill Requirements

A provider is valid ONLY if it supports at least:

✔ usage tracking OR billable inference
✔ model identification
✔ request authentication

If any are missing:

* fallback to estimated pricing model

---

## Special Handling Rules

## OpenRouter

* treat as meta-provider
* expand into underlying models
* optionally store both:

  * routed model
  * original model request

---

## Google Gemini

* billing must be estimated if missing
* separate billing connector recommended (optional future enhancement)

---

## Anthropic

* always normalize split tokens → unified cost model

---

## Extension Rule

Adding a new provider MUST follow:

1. Create adapter in `/providers`
2. Map raw API → NormalizedUsage
3. Map model list → ModelRecord
4. Add pricing strategy
5. Add sync handler

No exceptions.

---

## Guiding Principle

Never let provider differences leak into UI or database schema.

ATM is a **unified observability layer**, not a collection of APIs.
