export type Provider = {
  id: string
  name: string
  type: string
  api_key_encrypted: string
  is_active: number
  created_at: number | null
  last_sync: number | null
}

export type NewProvider = Omit<Provider, "id">

export type Model = {
  id: string
  provider_id: string
  name: string
  display_name: string | null
  input_price_per_1k: number
  output_price_per_1k: number
  context_window: number
  is_active: number
}

export type NewModel = Omit<Model, "id">

export type UsageRecord = {
  id: string
  provider_id: string
  model_id: string | null
  timestamp: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_usd: number
  request_count: number
  raw_payload: string | null
}

export type NewUsageRecord = Omit<UsageRecord, "id" | "total_tokens">

export type NormalizedUsageRecord = {
  providerId: string
  modelId: string
  timestamp: number
  inputTokens: number
  outputTokens: number
  costUSD: number
  requestCount?: number
}

export type UsageDaily = {
  id: string
  date: string
  provider_id: string | null
  model_id: string | null
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
  total_requests: number
}

export type SyncLog = {
  id: string
  provider_id: string
  status: "success" | "error" | "partial"
  started_at: number | null
  finished_at: number | null
  error_message: string | null
}

export type NewSyncLog = Omit<SyncLog, "id">

export type Setting = {
  key: string
  value: string
}

// --- Gateway types ---

export type RequestLog = {
  id: string
  provider: string
  model: string | null
  endpoint: string
  method: string
  status: number | null
  input_tokens: number
  output_tokens: number
  cost_usd: number
  latency_ms: number
  virtual_key_id: string | null
  created_at: number
}

export type NewRequestLog = Omit<RequestLog, "id">

export type VirtualKey = {
  id: string
  name: string
  key_hash: string
  provider: string
  is_active: number
  budget_usd: number | null
  budget_used_usd: number
  created_at: number
  last_used_at: number | null
}

export type NewVirtualKey = Omit<VirtualKey, "id">

export type Budget = {
  id: string
  scope: string
  scope_id: string | null
  limit_usd: number
  period: string
  used_usd: number
  created_at: number
}

export type NewBudget = Omit<Budget, "id">
