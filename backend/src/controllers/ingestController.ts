import { Request, Response, NextFunction } from "express";
import { storeDocument } from "../services/weaviateService";
import { IngestRequest, IngestResponse } from "../types";
import { createApiError } from "../utils/errors";
import { logger } from "../utils/logger";

export async function ingestHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { content, source } = req.body as IngestRequest;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      throw createApiError("Request body must include a non-empty 'content' string", 400);
    }

    logger.info("IngestController", "Ingesting document", {
      contentLength: content.length,
      source,
    });

    const { ids, chunkCount } = await storeDocument(content.trim(), source);

    const response: IngestResponse = {
      success: true,
      message: `Document ingested successfully (${chunkCount} chunk${chunkCount === 1 ? "" : "s"})`,
      id: ids[0],
    };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}
