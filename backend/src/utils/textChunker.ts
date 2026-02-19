import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export async function chunkText(text: string): Promise<string[]> {
  if (!text || text.trim().length === 0) return [];
  return splitter.splitText(text);
}
