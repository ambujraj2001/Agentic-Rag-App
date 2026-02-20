import React, { useState, useRef, useCallback } from "react";
import { useIngest } from "../hooks/useIngest";
import { uploadFile } from "../services/api";
import type { IngestHistoryItem } from "../App";
import { getFileIcon } from "../App";

interface IngestPanelProps {
  history: IngestHistoryItem[];
  onIngest: (title: string, subtitle: string, fileType?: string) => void;
  onProcessingStart: (title: string, fileType?: string) => string;
  onProcessingDone: (id: string, subtitle: string) => void;
  onProcessingError: (id: string, errorMsg: string) => void;
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}b`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}kb`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}mb`;
}

export default function IngestPanel({
  history,
  onIngest,
  onProcessingStart,
  onProcessingDone,
  onProcessingError,
}: IngestPanelProps) {
  const [text, setText] = useState("");
  const { ingest, loading, result, error, reset } = useIngest();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    const content = text.trim();
    const preview = content.slice(0, 40).replace(/\n/g, " ");
    const success = await ingest(content);
    if (success) {
      onIngest(preview + (content.length > 40 ? "..." : ""), `${content.length} chars`, "text");
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) handleSubmit();
  };

  const processFile = useCallback(
    async (file: File) => {
      const textTypes = ["text/plain", "text/markdown", "text/csv", "application/json"];
      const textExts = [".txt", ".md", ".json"];
      const isTextFile =
        textTypes.includes(file.type) || textExts.some((ext) => file.name.toLowerCase().endsWith(ext));

      if (isTextFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setText(e.target?.result as string);
          if (result || error) reset();
        };
        reader.readAsText(file);
        return;
      }

      const ext = file.name.split(".").pop() || "";
      const id = onProcessingStart(file.name, ext);
      try {
        const response = await uploadFile(file);
        onProcessingDone(id, `${formatSize(file.size)} • Indexed`);
        if (result || error) reset();
        void response;
      } catch (err: any) {
        onProcessingError(id, err.message || "Upload failed");
      }
    },
    [onProcessingStart, onProcessingDone, onProcessingError, result, error, reset]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const displayHistory = showAll ? history : history.slice(0, 4);

  return (
    <aside className="w-80 flex-none bg-bg-sidebar border-r border-border-main flex flex-col overflow-hidden transition-colors duration-200">
      <div className="p-4 flex flex-col h-full">
        {/* Ingest Section */}
        <div className="mb-4">
          <h2 className="text-text-main text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">cloud_upload</span>
            Ingest Content
          </h2>

          {/* Paste Text */}
          <div className="mb-4">
            <label className="block text-text-secondary text-xs font-medium mb-1.5">Paste raw text</label>
            <div className="relative group">
              <textarea
                className="w-full h-32 bg-bg-surface border border-border-main rounded-lg p-3 text-sm text-text-main placeholder-text-muted focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all shadow-sm"
                placeholder="Paste context here..."
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (result || error) reset();
                }}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <div className="absolute bottom-2 right-2 text-[10px] text-text-muted pointer-events-none">
                Cmd+Enter
              </div>
            </div>
            <button
              className="mt-2 w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-lg transition-colors shadow-sm"
              onClick={handleSubmit}
              disabled={loading || !text.trim()}
            >
              {loading ? "Ingesting..." : "Ingest Text"}
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-4">
            <label className="block text-text-secondary text-xs font-medium mb-1.5">Upload Documents</label>
            <div
              className={`relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg transition-colors cursor-pointer group ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border-main bg-bg-surface hover:bg-bg-surface-hover hover:border-primary/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <span className="material-symbols-outlined text-text-muted group-hover:text-primary mb-2 transition-colors">
                upload_file
              </span>
              <p className="mb-1 text-xs text-text-secondary">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-[10px] text-text-muted">PDF, CSV, Excel, Word, TXT, MD, JSON</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Feedback */}
          {(result || error) && (
            <div className={`text-xs font-medium mb-2 px-1 ${error ? "text-red-500" : "text-emerald-500"}`}>
              {result?.message || error}
            </div>
          )}
        </div>

        {/* Ingestion History */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-text-main text-sm font-semibold">Ingestion History</h3>
            {history.length > 4 && (
              <button
                className="text-primary text-xs hover:text-primary-hover font-medium"
                onClick={() => setShowAll((p) => !p)}
              >
                {showAll ? "Show less" : "View all"}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {history.length === 0 ? (
              <p className="text-text-muted text-xs text-center py-6">No documents ingested yet.</p>
            ) : (
              displayHistory.map((item) => {
                const fi = getFileIcon(item.fileType);
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-bg-surface border border-border-main hover:border-primary/30 transition-all"
                  >
                    <div className={`flex-none p-1.5 rounded ${fi.bg} ${fi.text}`}>
                      <span className="material-symbols-outlined text-lg">{fi.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-main truncate">{item.title}</p>
                      <p className="text-xs text-text-secondary">
                        {item.subtitle} • {formatTimeAgo(item.timestamp)}
                      </p>
                    </div>
                    <div className="flex-none">
                      {item.status === "processing" && (
                        <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      )}
                      {item.status === "done" && (
                        <span className="material-symbols-outlined text-lg text-emerald-500">check_circle</span>
                      )}
                      {item.status === "error" && (
                        <span className="material-symbols-outlined text-lg text-red-500">error</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
