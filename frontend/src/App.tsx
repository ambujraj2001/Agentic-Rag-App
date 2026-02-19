import { useState, useCallback } from "react";
import IngestPanel from "./components/IngestPanel";
import ChatPanel from "./components/ChatPanel";

export interface IngestHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: Date;
}

function WeaviateLogo() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <rect width="42" height="42" rx="12" fill="url(#logoGradient)" />
      <path
        d="M11.5 14L21 29L30.5 14"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 14L21 22.5L26 14"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <defs>
        <linearGradient id="logoGradient" x1="7" y1="6" x2="33" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f766e" />
          <stop offset="1" stopColor="#155e75" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function App() {
  const [ingestHistory, setIngestHistory] = useState<IngestHistoryItem[]>([]);

  const addToHistory = useCallback((title: string, subtitle: string) => {
    setIngestHistory((prev) => [
      {
        id: `${Date.now()}`,
        title,
        subtitle,
        timestamp: new Date(),
      },
      ...prev,
    ]);
  }, []);

  return (
    <div className="app-shell">
      <div className="app-glow app-glow-left" aria-hidden="true" />
      <div className="app-glow app-glow-right" aria-hidden="true" />

      <div className="app-layout">
        <header className="app-header surface-card fade-in-up">
          <div className="brand-row">
            <div className="brand-logo">
              <WeaviateLogo />
            </div>
            <div>
              <h1 className="app-title">RAG Assistant</h1>
              <p className="app-subtitle">
                Professional retrieval and answer generation over your private knowledge base.
              </p>
            </div>
          </div>
          <div className="status-row">
            <span className="status-pill">Weaviate local vectors</span>
            <span className="status-pill">Qwen 2.5 answer synthesis</span>
          </div>
        </header>

        <main className="main-grid">
          <div className="fade-in-up delay-1">
            <IngestPanel onIngest={addToHistory} history={ingestHistory} />
          </div>
          <div className="fade-in-up delay-2">
            <ChatPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
