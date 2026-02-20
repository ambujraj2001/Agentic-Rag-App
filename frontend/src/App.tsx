import { useState, useCallback, useEffect } from "react";
import IngestPanel from "./components/IngestPanel";
import ChatPanel from "./components/ChatPanel";

export interface IngestHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: Date;
  status: "processing" | "done" | "error";
  fileType?: string;
}

function getFileIcon(fileType?: string): { icon: string; bg: string; text: string } {
  if (!fileType) return { icon: "description", bg: "bg-blue-500/10", text: "text-blue-500" };
  const t = fileType.toLowerCase();
  if (t.includes("pdf")) return { icon: "picture_as_pdf", bg: "bg-red-500/10", text: "text-red-500" };
  if (t.includes("csv") || t.includes("xls")) return { icon: "table_view", bg: "bg-green-500/10", text: "text-green-500" };
  if (t.includes("json")) return { icon: "data_object", bg: "bg-orange-500/10", text: "text-orange-500" };
  if (t.includes("doc")) return { icon: "article", bg: "bg-purple-500/10", text: "text-purple-500" };
  return { icon: "description", bg: "bg-blue-500/10", text: "text-blue-500" };
}

export { getFileIcon };

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("rag-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("rag-theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

export default function App() {
  const { dark, toggle } = useTheme();
  const [ingestHistory, setIngestHistory] = useState<IngestHistoryItem[]>([]);

  const addToHistory = useCallback(
    (title: string, subtitle: string, fileType?: string) => {
      const id = `${Date.now()}`;
      setIngestHistory((prev) => [
        { id, title, subtitle, timestamp: new Date(), status: "done", fileType },
        ...prev,
      ]);
    },
    []
  );

  const addProcessing = useCallback((title: string, fileType?: string): string => {
    const id = `${Date.now()}`;
    setIngestHistory((prev) => [
      { id, title, subtitle: "Processing...", timestamp: new Date(), status: "processing", fileType },
      ...prev,
    ]);
    return id;
  }, []);

  const markDone = useCallback((id: string, subtitle: string) => {
    setIngestHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, subtitle, status: "done" as const } : item))
    );
  }, []);

  const markError = useCallback((id: string, errorMsg: string) => {
    setIngestHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, subtitle: errorMsg, status: "error" as const } : item))
    );
  }, []);

  return (
    <div className="bg-bg-main text-text-main h-screen flex flex-col overflow-hidden transition-colors duration-200">
      {/* Header */}
      <header className="flex-none flex items-center justify-between border-b border-border-main bg-bg-surface px-6 py-3 h-16 z-20 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <div>
            <h1 className="text-text-main text-lg font-bold leading-tight tracking-tight">
              RAG Assistant
            </h1>
            <p className="text-text-secondary text-xs font-normal">
              Augmenting knowledge with AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wide">
              System Online
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="size-2 rounded-full bg-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-wide">
              Vector DB Connected
            </span>
          </div>
          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="flex items-center justify-center size-9 rounded-lg border border-border-main bg-bg-surface hover:bg-bg-surface-hover text-text-secondary hover:text-text-main transition-colors"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="material-symbols-outlined text-lg">
              {dark ? "light_mode" : "dark_mode"}
            </span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        <IngestPanel
          history={ingestHistory}
          onIngest={addToHistory}
          onProcessingStart={addProcessing}
          onProcessingDone={markDone}
          onProcessingError={markError}
        />
        <ChatPanel />
      </div>
    </div>
  );
}
