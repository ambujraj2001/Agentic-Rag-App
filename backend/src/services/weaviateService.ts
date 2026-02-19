import { getWeaviateClient, COLLECTION_NAME } from "../config/weaviate";
import { RetrievedChunk } from "../types";
import { logger } from "../utils/logger";
import { chunkText } from "../utils/textChunker";

export async function storeDocument(
  content: string,
  source?: string
): Promise<{ ids: string[]; chunkCount: number }> {
  const client = await getWeaviateClient();
  const collection = client.collections.get(COLLECTION_NAME);
  const chunks = await chunkText(content);
  const sourceLabel = source || "manual";
  const ingestedAt = new Date().toISOString();

  const BATCH_SIZE = 20;
  const ids: string[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((chunk) =>
        collection.data.insert({
          content: chunk,
          source: sourceLabel,
          ingestedAt,
        })
      )
    );
    ids.push(...results.map(String));
  }

  logger.info("WeaviateService", "Document stored", {
    chunkCount: ids.length,
    source: sourceLabel,
  });
  return { ids, chunkCount: ids.length };
}

export async function semanticSearch(
  query: string,
  limit: number = 5
): Promise<RetrievedChunk[]> {
  const client = await getWeaviateClient();
  const collection = client.collections.get(COLLECTION_NAME);

  const results = await collection.query.nearText(query, {
    limit,
    returnMetadata: ["distance"],
  });

  if (!results.objects || results.objects.length === 0) {
    logger.warn("WeaviateService", "No results found for query", { query });
    return [];
  }

  const chunks: RetrievedChunk[] = results.objects.map((obj: any) => ({
    content: obj.properties.content as string,
    score: obj.metadata?.distance !== undefined ? 1 - obj.metadata.distance : 0,
    source: (obj.properties.source as string) || undefined,
  }));

  logger.info("WeaviateService", `Found ${chunks.length} chunks`, { query });
  return chunks;
}
