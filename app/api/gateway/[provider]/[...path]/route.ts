import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createRequestLog, checkBudgetAllowed, getVirtualKeyByHash, updateVirtualKey } from "@/lib/db"
import { getTemplate } from "@/templates"

const PROVIDER_URLS: Record<string, string> = {
  openai: "https://api.openai.com",
  anthropic: "https://api.anthropic.com",
  openrouter: "https://openrouter.ai",
  google: "https://generativelanguage.googleapis.com",
  nvidia: "https://integrate.api.nvidia.com",
  groq: "https://api.groq.com",
  mistral: "https://api.mistral.ai",
  together: "https://api.together.xyz",
  deepseek: "https://api.deepseek.com",
  fireworks: "https://api.fireworks.ai",
  perplexity: "https://api.perplexity.ai",
  deepinfra: "https://api.deepinfra.com",
  anyscale: "https://api.anyscale.com",
  xai: "https://api.x.ai",
  opencode: "https://opencode.ai/zen/v1",
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; path: string[] }> }
) {
  const { provider, path: pathParts } = await params
  const endpoint = pathParts.join("/")
  const start = Date.now()

  const baseUrl = PROVIDER_URLS[provider] ?? getTemplate(provider)?.baseUrl
  if (!baseUrl) {
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
  }

  // Virtual key auth (optional — gateway works without keys too)
  let virtualKeyId: string | null = null
  const atmKey = request.headers.get("x-atm-key")
  if (atmKey) {
    const keyHash = crypto.createHash("sha256").update(atmKey).digest("hex")
    const vk = getVirtualKeyByHash(keyHash)
    if (!vk) {
      return NextResponse.json({ error: "Invalid virtual key" }, { status: 401 })
    }
    if (vk.provider !== provider && vk.provider !== "*") {
      return NextResponse.json(
        { error: `Key is not authorized for provider: ${provider}` },
        { status: 403 }
      )
    }
    virtualKeyId = vk.id
    updateVirtualKey(vk.id, { last_used_at: Date.now() })
  }

  // Budget check
  if (!checkBudgetAllowed(provider, null)) {
    return NextResponse.json(
      { error: "Budget limit reached. Increase your budget in ATM Settings." },
      { status: 429 }
    )
  }

  // Build upstream request
  const targetUrl = `${baseUrl}/${endpoint}`
  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (key !== "host" && key !== "connection") {
      headers.set(key, value)
    }
  })

  const body = await request.arrayBuffer()

  let upstreamResponse: Response
  try {
    upstreamResponse = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: body.byteLength > 0 ? body : undefined,
    })
  } catch (error) {
    const latency = Date.now() - start
    createRequestLog({
      provider,
      model: null,
      endpoint,
      method: "POST",
      status: 0,
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      latency_ms: latency,
      virtual_key_id: virtualKeyId,
      created_at: Date.now(),
    })
    return NextResponse.json(
      { error: `Gateway error: ${(error as Error).message}` },
      { status: 502 }
    )
  }

  // Parse response to extract model/token info (best-effort)
  const responseClone = upstreamResponse.clone()
  let model: string | null = null
  let inputTokens = 0
  let outputTokens = 0
  let costUsd = 0

  try {
    const text = await responseClone.text()
    const json = JSON.parse(text)

    // OpenAI-compatible format
    if (json.model) model = json.model
    if (json.usage) {
      inputTokens = json.usage.prompt_tokens ?? 0
      outputTokens = json.usage.completion_tokens ?? 0
    }
  } catch {
    // Non-JSON or parse error — log what we can
  }

  const latency = Date.now() - start

  // Log the request
  createRequestLog({
    provider,
    model,
    endpoint,
    method: "POST",
    status: upstreamResponse.status,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: costUsd,
    latency_ms: latency,
    virtual_key_id: virtualKeyId,
    created_at: start,
  })

  // Return response as-is (transparent proxy)
  const responseHeaders = new Headers()
  upstreamResponse.headers.forEach((value, key) => {
    responseHeaders.set(key, value)
  })

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  })
}

// Handle non-POST methods gracefully
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; path: string[] }> }
) {
  const { provider, path: pathParts } = await params
  const endpoint = pathParts.join("/")
  const baseUrl = PROVIDER_URLS[provider] ?? getTemplate(provider)?.baseUrl

  if (!baseUrl) {
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
  }

  const targetUrl = `${baseUrl}/${endpoint}`
  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (key !== "host" && key !== "connection") {
      headers.set(key, value)
    }
  })

  const upstreamResponse = await fetch(targetUrl, { method: "GET", headers })

  const responseHeaders = new Headers()
  upstreamResponse.headers.forEach((value, key) => {
    responseHeaders.set(key, value)
  })

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  })
}
