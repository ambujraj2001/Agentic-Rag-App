import { Request, Response, NextFunction } from "express";
import { extractTextFromFile } from "../services/fileExtractorService";
import { storeDocument } from "../services/weaviateService";
import { IngestResponse } from "../types";
import { createApiError } from "../utils/errors";
import { logger } from "../utils/logger";

export async function uploadHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = req.file;

    if (!file) {
      throw createApiError("No file provided", 400);
    }

    logger.info("UploadController", "File received", {
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    const extracted = await extractTextFromFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const { ids, chunkCount } = await storeDocument(
      extracted.text,
      file.originalname
    );

    const response: IngestResponse = {
      success: true,
      message: `File "${file.originalname}" ingested successfully (${extracted.text.length} chars, ${chunkCount} chunk${chunkCount === 1 ? "" : "s"})`,
      id: ids[0],
    };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}
