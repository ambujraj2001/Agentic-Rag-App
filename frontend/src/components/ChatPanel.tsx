import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { useChat, ChatMessage } from "../hooks/useChat";

const EXAMPLE_QUESTIONS = [
  { icon: "auto_awesome", text: "What are the key points from the ingested documents?" },
  { icon: "summarize", text: "Give me a concise summary in five bullets." },
  { icon: "search", text: "Which source chunk is most relevant to this topic?" },
];

const SUGGESTION_CHIPS = [
  { icon: "lightbulb", text: "Identify major competitors mentioned" },
  { icon: "trending_up", text: "Show revenue charts" },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-white rounded-2xl rounded-tr-sm py-3 px-5 max-w-[80%] shadow-md">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 max-w-[90%]">
      <div className="flex-none size-8 rounded-full bg-bg-surface border border-border-main flex items-center justify-center text-primary mt-1 shadow-sm">
        <span className="material-symbols-outlined text-sm">smart_toy</span>
      </div>
      <div className="flex-1 space-y-3">
        <div className="prose prose-sm max-w-none text-text-main [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_strong]:text-text-main [&_strong]:font-semibold [&_code]:bg-code-bg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-text-main [&_pre]:bg-[#1e293b] [&_pre]:text-slate-200 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-200 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary [&_a]:text-primary [&_a]:underline [&_table]:text-xs [&_th]:border [&_th]:border-border-main [&_th]:px-2 [&_th]:py-1 [&_th]:bg-bg-sidebar [&_td]:border [&_td]:border-border-main [&_td]:px-2 [&_td]:py-1 [&_hr]:border-border-main">
          <Markdown>{message.content}</Markdown>
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="border border-border-main rounded-lg overflow-hidden bg-bg-surface shadow-sm">
            <details className="group">
              <summary className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-bg-surface-hover transition-colors">
                <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                  <span className="material-symbols-outlined text-base">library_books</span>
                  Show Sources ({message.sources.length})
                </div>
                <span className="material-symbols-outlined text-text-muted text-sm transform transition-transform group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <div className="p-3 border-t border-border-main bg-bg-surface-alt space-y-3">
                {message.sources.map((source, idx) => (
                  <div key={idx} className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-main flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-blue-500">description</span>
                        {source.source || "Chunk"}
                      </span>
                      <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono border border-emerald-500/20">
                        Score: {source.score.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-text-secondary italic border-l-2 border-border-main pl-2 line-clamp-2 bg-bg-surface p-1 rounded-r">
                      "{source.content.length > 220 ? source.content.slice(0, 220) + "..." : source.content}"
                    </p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-4 max-w-[90%]">
      <div className="flex-none size-8 rounded-full bg-bg-surface border border-border-main flex items-center justify-center text-text-muted mt-1 shadow-sm">
        <span className="material-symbols-outlined text-sm">smart_toy</span>
      </div>
      <div className="flex items-center gap-1 pt-3">
        <div className="size-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="size-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="size-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "300ms" }} />
        <span className="text-xs text-text-secondary ml-2 font-medium">Thinking...</span>
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, loading, error, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (question?: string) => {
    const text = question || input.trim();
    if (!text || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "40px";
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "40px";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  };

  const hasMessages = messages.length > 0;

  return (
    <main className="flex-1 flex flex-col relative bg-bg-main transition-colors duration-200">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!hasMessages && !loading && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary mb-4">
              <span className="material-symbols-outlined text-3xl">psychology</span>
            </div>
            <h2 className="text-text-main text-lg font-bold mb-1">How can I help?</h2>
            <p className="text-text-secondary text-sm mb-6 max-w-xs text-center">
              Ask questions about your ingested documents and I'll find the answers.
            </p>
            <div className="space-y-2 w-full max-w-md">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-bg-surface border border-border-main hover:border-primary/30 text-left transition-all group"
                  onClick={() => handleSend(q.text)}
                >
                  <span className="material-symbols-outlined text-primary text-lg">{q.icon}</span>
                  <span className="text-sm text-text-secondary group-hover:text-text-main transition-colors">
                    {q.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMessages && (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && <ThinkingIndicator />}
            <div ref={messagesEndRef} className="h-4" />
          </>
        )}
      </div>

      {/* Suggestion Chips */}
      {hasMessages && !loading && (
        <div className="flex-none px-6 py-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {SUGGESTION_CHIPS.map((chip, i) => (
              <button
                key={i}
                className="whitespace-nowrap bg-bg-surface hover:bg-bg-surface-hover border border-border-main text-text-main text-xs py-1.5 px-3 rounded-full transition-colors flex items-center gap-1 shadow-sm"
                onClick={() => handleSend(chip.text)}
              >
                <span className="material-symbols-outlined text-sm text-primary">{chip.icon}</span>
                {chip.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-6 pb-2">
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-6 bg-bg-main border-t border-border-main/50 transition-colors duration-200">
        <div className="max-w-4xl mx-auto relative">
          <div className="relative flex items-end gap-2 bg-bg-surface border border-border-main rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-lg">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent border-0 focus:ring-0 p-2 text-sm text-text-main placeholder-text-muted resize-none leading-relaxed"
              placeholder="Ask a follow-up question..."
              rows={1}
              style={{ minHeight: "40px" }}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="p-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-md flex items-center justify-center"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-[10px] text-text-muted">
              AI can make mistakes. Please verify important information.
            </p>
            {hasMessages && (
              <button
                className="text-xs text-text-muted hover:text-text-main flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-bg-surface transition-colors"
                onClick={clearChat}
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Clear Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
