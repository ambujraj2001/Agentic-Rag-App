import React, { useState, useRef, useEffect } from "react";
import { useChat, ChatMessage } from "../hooks/useChat";

const EXAMPLE_QUESTIONS = [
  "What are the key points from the ingested documents?",
  "Give me a concise summary in five bullets.",
  "Which source chunk is most relevant to this topic?",
];

const SUGGESTED_QUESTIONS = [
  "What assumptions should I validate before implementation?",
  "List risks and mitigation steps based on the available context.",
];

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const [showSources, setShowSources] = useState(false);

  if (message.role === "user") {
    return <div className="chat-message chat-message-user">{message.content}</div>;
  }

  return (
    <div className="chat-message chat-message-assistant">
      <div className="chat-message-content">{message.content}</div>

      {message.sources && message.sources.length > 0 && (
        <div className="chat-sources-wrap">
          <button
            className="button-link sources-toggle"
            onClick={() => setShowSources((prev) => !prev)}
            type="button"
          >
            {showSources ? "Hide sources" : `Show ${message.sources.length} sources`}
          </button>

          {showSources && (
            <div className="chat-sources-list">
              {message.sources.map((source, index) => (
                <div key={index} className="chat-source-item">
                  <div className="chat-source-label">
                    [{index + 1}] score: {source.score.toFixed(3)}
                  </div>
                  <div>
                    {source.content.length > 220
                      ? `${source.content.slice(0, 220)}...`
                      : source.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatPanel() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, loading, error, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (question?: string) => {
    const text = question || input.trim();
    if (!text || loading) return;
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="panel-card chat-panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Ask Questions</h2>
          <p className="panel-subtitle">
            Answers are grounded in retrieved context from your ingested data.
          </p>
        </div>
        {hasMessages && (
          <button className="button-link" onClick={clearChat} type="button">
            Clear chat
          </button>
        )}
      </div>

      {hasMessages ? (
        <div className="chat-messages">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {loading && (
            <div className="chat-message chat-message-assistant chat-loading">Thinking...</div>
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="chat-empty-state">
          <p className="section-label">Sample questions</p>
          <div className="prompt-list">
            {EXAMPLE_QUESTIONS.map((question, index) => (
              <button
                key={index}
                className="prompt-button"
                onClick={() => handleSend(question)}
                type="button"
              >
                {question}
              </button>
            ))}
          </div>

          <p className="section-label section-offset">Suggested</p>
          <div className="prompt-list">
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <button
                key={index}
                className="prompt-button prompt-button-arrow"
                onClick={() => handleSend(question)}
                type="button"
              >
                <span>{question}</span>
                <ArrowIcon />
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div className="panel-error">{error}</div>}

      <div className="chat-compose">
        <input
          className="input-control"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question"
          disabled={loading}
        />
        <button
          className="button-primary"
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          type="button"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
