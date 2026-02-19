import { useState } from "react";
import { ingestDocument, IngestResponse } from "../services/api";

interface UseIngestReturn {
  ingest: (content: string, source?: string) => Promise<boolean>;
  loading: boolean;
  result: IngestResponse | null;
  error: string | null;
  reset: () => void;
}

export function useIngest(): UseIngestReturn {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ingest = async (content: string, source?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await ingestDocument(content, source);
      setResult(res);
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to ingest document");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { ingest, loading, result, error, reset };
}
