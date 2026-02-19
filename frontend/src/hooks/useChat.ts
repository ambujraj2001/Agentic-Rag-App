import { useState, useCallback } from "react";
import { queryDocuments, QuerySource } from "../services/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: QuerySource[];
  timestamp: Date;
}

interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (question: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearChat: () => void;
}

let messageIdCounter = 0;
function generateId(): string {
  return `msg_${Date.now()}_${++messageIdCounter}`;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (question: string) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await queryDocuments(question);

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || "Failed to get response");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sendMessage, loading, error, clearChat };
}
