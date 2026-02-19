import { Request, Response, NextFunction } from "express";
import { semanticSearch } from "../services/weaviateService";
import { generateAnswer } from "../services/llmService";
import { QueryRequest, QueryResponse } from "../types";
import { createApiError } from "../utils/errors";
import { logger } from "../utils/logger";

export async function queryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { question } = req.body as QueryRequest;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      throw createApiError("Request body must include a non-empty 'question' string", 400);
    }

    logger.info("QueryController", "Processing query", { question });

    const chunks = await semanticSearch(question.trim(), 5);

    if (chunks.length === 0) {
      const response: QueryResponse = {
        answer:
          "I don't have any relevant information in my knowledge base to answer this question. Please ingest some documents first.",
        sources: [],
      };
      res.json(response);
      return;
    }

    const answer = await generateAnswer(chunks, question.trim());

    const response: QueryResponse = {
      answer,
      sources: chunks,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
}
