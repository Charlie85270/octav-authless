import type { AIProvider, ChatMessage, TokenUsage } from "@/types/ai";

interface StreamOptions {
  provider: AIProvider;
  apiKey: string;
  messages: ChatMessage[];
  systemPrompt: string;
}

export interface StreamContext {
  usage: TokenUsage | null;
}

export async function* streamChat(
  { provider, apiKey, messages, systemPrompt }: StreamOptions,
  ctx: StreamContext
): AsyncGenerator<string> {
  if (provider === "openai") {
    yield* streamOpenAI(apiKey, messages, systemPrompt, ctx);
  } else {
    yield* streamAnthropic(apiKey, messages, systemPrompt, ctx);
  }
}

async function* streamOpenAI(
  apiKey: string,
  messages: ChatMessage[],
  systemPrompt: string,
  ctx: StreamContext
): AsyncGenerator<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        const json = JSON.parse(line.slice(6));
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
        if (json.usage) {
          ctx.usage = {
            input: json.usage.prompt_tokens,
            output: json.usage.completion_tokens,
            cacheRead: json.usage.prompt_tokens_details?.cached_tokens || 0,
          };
        }
      } catch {
        // skip malformed chunks
      }
    }
  }
}

async function* streamAnthropic(
  apiKey: string,
  messages: ChatMessage[],
  systemPrompt: string,
  ctx: StreamContext
): AsyncGenerator<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      stream: true,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheRead = 0;
  let cacheCreation = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.type === "content_block_delta" && json.delta?.text) {
          yield json.delta.text;
        }
        if (json.type === "message_start" && json.message?.usage) {
          const u = json.message.usage;
          inputTokens = u.input_tokens;
          cacheRead = u.cache_read_input_tokens || 0;
          cacheCreation = u.cache_creation_input_tokens || 0;
        }
        if (json.type === "message_delta" && json.usage) {
          outputTokens = json.usage.output_tokens;
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  if (inputTokens || outputTokens) {
    ctx.usage = { input: inputTokens, output: outputTokens, cacheRead, cacheCreation };
  }
}
