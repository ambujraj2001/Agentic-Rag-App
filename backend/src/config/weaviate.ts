import weaviate, { WeaviateClient } from "weaviate-client";
import { env } from "./env";

const COLLECTION_NAME = "Document";

let client: WeaviateClient | null = null;

export async function getWeaviateClient(): Promise<WeaviateClient> {
  if (client) return client;

  const url = new URL(env.WEAVIATE_HOST);
  client = await weaviate.connectToLocal({
    host: url.hostname,
    port: parseInt(url.port || "8090", 10),
  });

  console.log("[Weaviate] Connected successfully");
  return client;
}

export async function ensureCollection(): Promise<void> {
  const wClient = await getWeaviateClient();
  const exists = await wClient.collections.exists(COLLECTION_NAME);

  if (!exists) {
    await wClient.collections.create({
      name: COLLECTION_NAME,
      vectorizers: weaviate.configure.vectorizer.text2VecTransformers({
        vectorizeCollectionName: false,
      }),
      properties: [
        { name: "content", dataType: "text" },
        { name: "source", dataType: "text" },
        { name: "ingestedAt", dataType: "date" },
      ],
    });
    console.log(`[Weaviate] Collection "${COLLECTION_NAME}" created`);
  } else {
    console.log(`[Weaviate] Collection "${COLLECTION_NAME}" already exists`);
  }
}

export { COLLECTION_NAME };
