const API_BASE = "/api";

export interface IngestResponse {
  success: boolean;
  message: string;
  id?: string;
}

export interface QuerySource {
  content: string;
  score: number;
  source?: string;
}

export interface QueryResponse {
  answer: string;
  sources: QuerySource[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as any).error || `Request failed with status ${response.status}`
    );
  }
  return response.json();
}

export async function ingestDocument(
  content: string,
  source?: string
): Promise<IngestResponse> {
  const response = await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, source }),
  });
  return handleResponse<IngestResponse>(response);
}

export async function uploadFile(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<IngestResponse>(response);
}

export async function queryDocuments(
  question: string
): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  return handleResponse<QueryResponse>(response);
}
