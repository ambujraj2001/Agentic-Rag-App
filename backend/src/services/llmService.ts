import { env } from "../config/env";
import {
  HFChatCompletionRequest,
  HFChatCompletionResponse,
  RetrievedChunk,
} from "../types";
import { logger } from "../utils/logger";
import { createApiError } from "../utils/errors";

const MODEL_CONTEXT_LIMIT = 32_769;
const MAX_NEW_TOKENS = 2048;
const CHARS_PER_TOKEN = 4;
const SYSTEM_PROMPT_BUDGET = 200;
const QUESTION_BUDGET = 300;
const MAX_CONTEXT_TOKENS =
  MODEL_CONTEXT_LIMIT - MAX_NEW_TOKENS - SYSTEM_PROMPT_BUDGET - QUESTION_BUDGET;
const MAX_CONTEXT_CHARS = MAX_CONTEXT_TOKENS * CHARS_PER_TOKEN;

function buildPrompt(chunks: RetrievedChunk[], question: string): string {
  const fitted: string[] = [];
  let totalChars = 0;

  for (let i = 0; i < chunks.length; i++) {
    const entry = `[${i + 1}] ${chunks[i].content}`;
    if (totalChars + entry.length > MAX_CONTEXT_CHARS) {
      const remaining = MAX_CONTEXT_CHARS - totalChars;
      if (remaining > 200) {
        fitted.push(`[${i + 1}] ${chunks[i].content.slice(0, remaining - 20)}…`);
      }
      break;
    }
    fitted.push(entry);
    totalChars += entry.length + 2;
  }

  const contextBlock = fitted.join("\n\n");
  logger.info("LLMService", "Prompt built", {
    chunksUsed: fitted.length,
    contextChars: contextBlock.length,
    estimatedTokens: Math.ceil(contextBlock.length / CHARS_PER_TOKEN),
  });

  return `Context:\n${contextBlock}\n\nQuestion:\n${question}`;
}

export async function generateAnswer(
  chunks: RetrievedChunk[],
  question: string
): Promise<string> {
  const userMessage = buildPrompt(chunks, question);

  const requestBody: HFChatCompletionRequest = {
    model: env.HF_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Answer the user's question based on the provided context. If the context doesn't contain enough information, say so clearly.",
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    temperature: 0.7,
    max_tokens: MAX_NEW_TOKENS,
  };

  const url = `${env.HF_API_BASE}/chat/completions`;

  logger.info("LLMService", "Calling HuggingFace Router", {
    model: env.HF_MODEL,
    url,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("LLMService", "HuggingFace API error", {
      status: response.status,
      body: errorBody,
    });
    throw createApiError(
      `LLM API returned ${response.status}: ${errorBody}`,
      502
    );
  }

  const data: HFChatCompletionResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw createApiError("LLM returned no choices", 502);
  }

  const answer = data.choices[0].message.content;
  logger.info("LLMService", "Answer generated successfully");
  return answer;
}
