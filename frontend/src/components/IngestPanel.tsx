import React, { useState, useRef } from "react";
import { useIngest } from "../hooks/useIngest";
import { uploadFile } from "../services/api";
import type { IngestHistoryItem } from "../App";

interface IngestPanelProps {
  onIngest: (title: string, subtitle: string) => void;
  history: IngestHistoryItem[];
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function extractTitle(content: string): { title: string; subtitle: string } {
  const lines = content.trim().split("\n").filter(Boolean);
  const firstLine = lines[0] || "Untitled document";

  if (firstLine.includes(":")) {
    const [before, ...after] = firstLine.split(":");
    return {
      title: before.trim(),
      subtitle: after.join(":").trim().slice(0, 80),
    };
  }

  const words = firstLine.split(" ");
  if (words.length > 8) {
    const title = words.slice(0, 5).join(" ");
    const subtitle = words.slice(5).join(" ").slice(0, 80);
    return { title, subtitle };
  }

  return { title: firstLine.slice(0, 60), subtitle: "" };
}

function UploadIcon() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 5 17 10" />
      <line x1="12" y1="5" x2="12" y2="17" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

export default function IngestPanel({ onIngest, history }: IngestPanelProps) {
  const [text, setText] = useState("");
  const { ingest, loading, result, error, reset } = useIngest();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    const content = text.trim();
    const { title, subtitle } = extractTitle(content);
    const success = await ingest(content);
    if (success) {
      onIngest(title, subtitle);
      setText("");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.metaKey) {
      handleSubmit();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    const textTypes = ["text/plain", "text/markdown", "text/csv", "application/json"];
    const textExts = [".txt", ".md", ".json"];
    const isTextFile =
      textTypes.includes(file.type) ||
      textExts.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (isTextFile) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setText(loadEvent.target?.result as string);
        if (result || error) reset();
      };
      reader.readAsText(file);
      return;
    }

    setUploading(true);
    setUploadMsg(null);
    if (result || error) reset();

    try {
      const response = await uploadFile(file);
      setUploadMsg({ type: "ok", text: response.message });
      onIngest(file.name, `${(file.size / 1024).toFixed(0)} KB`);
    } catch (uploadError: any) {
      setUploadMsg({ type: "err", text: uploadError.message || "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const displayHistory = showAll ? history : history.slice(0, 4);

  return (
    <div className="panel-stack">
      <div className="panel-card">
        <div className="panel-header panel-header-tight">
          <div>
            <h2 className="panel-title">Ingest Documents</h2>
            <p className="panel-subtitle">
              Paste text or upload PDF, CSV, Excel, and Word files into the knowledge base.
            </p>
          </div>
        </div>

        <textarea
          className="textarea-control"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (result || error) reset();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste document content here"
          disabled={loading}
        />

        <div className="ingest-actions">
          <button
            className="button-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || uploading}
            type="button"
          >
            <UploadIcon />
            <span>{uploading ? "Uploading..." : "Upload"}</span>
          </button>

          <button
            className="button-primary"
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            type="button"
          >
            {loading ? "Ingesting..." : "Ingest"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.csv,.json,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        {(result || error || uploadMsg) && (
          <div className="feedback-row">
            {result && <span className="feedback-ok">{result.message}</span>}
            {error && <span className="feedback-error">{error}</span>}
            {uploadMsg && (
              <span className={uploadMsg.type === "ok" ? "feedback-ok" : "feedback-error"}>
                {uploadMsg.text}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="panel-card">
        <div className="panel-header panel-header-tight">
          <h3 className="panel-title panel-title-small">Ingest History</h3>
          {history.length > 4 && (
            <button
              className="button-link"
              onClick={() => setShowAll((prev) => !prev)}
              type="button"
            >
              {showAll ? "Show less" : "View all"}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="empty-state">No documents ingested yet.</p>
        ) : (
          <div className="history-list">
            {displayHistory.map((item, index) => (
              <div
                key={item.id}
                className={`history-item ${index === displayHistory.length - 1 ? "history-item-last" : ""}`}
              >
                <div className="history-icon" aria-hidden="true">
                  <DocIcon />
                </div>
                <div className="history-content">
                  <div className="history-title">{item.title}</div>
                  {item.subtitle && <div className="history-subtitle">{item.subtitle}</div>}
                </div>
                <div className="history-time">{formatTimeAgo(item.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
