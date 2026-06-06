import { getCircuitBreaker } from "./circuitBreaker.js";
import { tokenBudgetService } from "./tokenBudget.js";
import { logger } from "../infra/logger.js";
import { eventBus } from "../infra/eventBus.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

interface LlmRequest {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}

interface LlmResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface LlmCallOptions {
  prospectId: number;
  jobId?: number;
  service: string;
  estimatedCostCents: number;
  correlationId?: string;
}

/**
 * Centralized LLM gateway that wraps all OpenAI/OpenRouter calls with:
 * - Token budget checking
 * - Circuit breaker protection
 * - Usage tracking
 * - Structured logging & events
 */
export async function callLlm(
  request: LlmRequest,
  options: LlmCallOptions
): Promise<LlmResponse> {
  // 1. Budget check
  tokenBudgetService.checkBudget(options.prospectId, options.estimatedCostCents);

  // 2. Circuit breaker
  const breaker = getCircuitBreaker("llm-gateway");

  return breaker.execute(async () => {
    logger.info(`LLM request started`, {
      service: options.service,
      prospectId: options.prospectId,
      jobId: options.jobId,
      correlationId: options.correlationId,
    });

    eventBus.emit(
      "llm:request",
      { service: options.service, model: request.model, maxTokens: request.max_tokens },
      options.correlationId
    );

    const url = OPENROUTER_API_KEY
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const apiKey = OPENROUTER_API_KEY || OPENAI_API_KEY;
    const model = request.model ?? (OPENROUTER_API_KEY ? OPENROUTER_MODEL : "gpt-4o-mini");

    if (!apiKey) {
      throw new Error("No LLM API key configured (OPENAI_API_KEY or OPENROUTER_API_KEY)");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    if (OPENROUTER_API_KEY) {
      headers["HTTP-Referer"] = "https://github.com/ymehmetdemiroglu-crypto/optius-rufus";
      headers["X-Title"] = "Optimus Rufus";
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 2000,
        response_format: request.response_format,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LLM API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const content = data.choices[0]?.message?.content ?? "";
    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? 0;
    const totalTokens = data.usage?.total_tokens ?? promptTokens + completionTokens;

    // Estimate cost: $0.0015 per 1K tokens for gpt-4o-mini (very rough)
    const costCents = Math.ceil((totalTokens / 1000) * 0.15);

    // Track usage
    tokenBudgetService.trackUsage(
      options.prospectId,
      options.jobId,
      options.service,
      promptTokens,
      completionTokens,
      costCents
    );

    logger.info(`LLM request completed`, {
      service: options.service,
      prospectId: options.prospectId,
      jobId: options.jobId,
      totalTokens,
      costCents,
      correlationId: options.correlationId,
    });

    eventBus.emit(
      "llm:success",
      { service: options.service, totalTokens, costCents },
      options.correlationId
    );

    return {
      content,
      promptTokens,
      completionTokens,
      totalTokens,
    };
  });
}
