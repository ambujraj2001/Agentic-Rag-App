export interface IngestRequest {
  content: string;
  source?: string;
}

export interface IngestResponse {
  success: boolean;
  message: string;
  id?: string;
}

export interface QueryRequest {
  question: string;
}

export interface QueryResponse {
  answer: string;
  sources: RetrievedChunk[];
}

export interface RetrievedChunk {
  content: string;
  score: number;
  source?: string;
}

export interface HFChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface HFChatCompletionRequest {
  model: string;
  messages: HFChatMessage[];
  temperature: number;
  max_tokens?: number;
}

export interface HFChatCompletionResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

export interface AppError extends Error {
  statusCode?: number;
}
