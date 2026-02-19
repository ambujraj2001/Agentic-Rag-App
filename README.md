# RAG Assistant

A production-ready Retrieval Augmented Generation application using local embeddings and HuggingFace LLM.

## Architecture

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: Vite + React + TypeScript
- **Vector DB**: Weaviate (Docker) with `text2vec-transformers` for local embeddings
- **LLM**: Qwen 2.5 7B via HuggingFace Router API

All embeddings are generated locally inside Weaviate — no OpenAI dependency.
Only the final answer generation calls HuggingFace Router.

## Prerequisites

- **Docker** (with Docker Compose)
- **Node.js** >= 18
- **npm**
- ~4GB free disk space (for the transformer model image)

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url> && cd RAGApp

# 2. Set your HuggingFace API key
cp backend/.env.example backend/.env
# Edit backend/.env and set HF_API_KEY

# 3. Start everything
./start.sh

# 4. Open http://localhost:3001
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `HF_API_BASE` | HuggingFace Router base URL | `https://router.huggingface.co/v1` |
| `HF_MODEL` | Model identifier | `Qwen/Qwen2.5-7B-Instruct` |
| `HF_API_KEY` | HuggingFace API key | (required) |
| `WEAVIATE_HOST` | Weaviate connection URL | `http://localhost:8090` |
| `PORT` | Backend server port | `3001` |

## Scripts

| Script | Description |
|---|---|
| `./start.sh` | Start Docker, install deps, build, and run |
| `./stop.sh` | Stop backend and Docker services |
| `./restart.sh` | Stop then start everything |
| `./clean-vector-db.sh` | Delete Weaviate vector DB volume data (with confirmation prompt) |

## API Endpoints

### `POST /api/ingest`
Ingest a text document into the knowledge base.

```json
{ "content": "Your text here", "source": "optional-label" }
```

### `POST /api/query`
Ask a question against the knowledge base.

```json
{ "question": "What is...?" }
```

Response:
```json
{
  "answer": "Based on the context...",
  "sources": [{ "content": "...", "score": 0.95 }]
}
```

### `GET /api/health`
Health check endpoint.

## How It Works

1. **Ingest**: Text is stored in Weaviate. The `text2vec-transformers` module automatically generates embeddings locally using `sentence-transformers/multi-qa-MiniLM-L6-cos-v1`.
2. **Query**: User question is converted to an embedding by Weaviate, and the top 5 semantically similar chunks are retrieved via HNSW index.
3. **Generate**: Retrieved chunks + question are sent to Qwen 2.5 7B via HuggingFace Router chat completion API.
4. **Response**: The LLM answer and source chunks are returned to the user.

## Project Structure

```
root/
  backend/
    src/
      config/       # Environment and Weaviate config
      services/     # Weaviate and LLM service layer
      routes/       # Express routes
      controllers/  # Request handlers
      utils/        # Error classes, logger
      types/        # TypeScript interfaces
      index.ts      # Entry point
  frontend/
    src/
      components/   # React components
      hooks/        # Custom hooks
      services/     # API client
      styles/       # Global CSS
      App.tsx       # Root component
  docker-compose.yml
  start.sh / stop.sh / restart.sh / clean-vector-db.sh
```
