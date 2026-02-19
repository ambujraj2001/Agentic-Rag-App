import { PDFParse } from "pdf-parse";
import { parse as csvParse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { createApiError } from "../utils/errors";
import { logger } from "../utils/logger";

export interface ExtractedFile {
  text: string;
  filename: string;
  mimeType: string;
}

const SUPPORTED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "text/csv": "csv",
  "application/vnd.ms-excel": "excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "text/plain": "text",
  "text/markdown": "text",
  "application/json": "text",
};

function getFileType(mimeType: string, filename: string): string {
  if (SUPPORTED_TYPES[mimeType]) return SUPPORTED_TYPES[mimeType];

  const ext = filename.split(".").pop()?.toLowerCase();
  const extMap: Record<string, string> = {
    pdf: "pdf",
    csv: "csv",
    xls: "excel",
    xlsx: "excel",
    doc: "doc",
    docx: "docx",
    txt: "text",
    md: "text",
    json: "text",
  };

  if (ext && extMap[ext]) return extMap[ext];

  throw createApiError(
    `Unsupported file type: ${mimeType} (${filename})`,
    400
  );
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

function extractCsv(buffer: Buffer): string {
  const content = buffer.toString("utf-8");
  try {
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    if (records.length === 0) return content;

    return records
      .map((row) =>
        Object.entries(row)
          .map(([key, val]) => `${key}: ${val}`)
          .join(", ")
      )
      .join("\n");
  } catch {
    return content;
  }
}

function extractExcel(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const lines: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    if (workbook.SheetNames.length > 1) {
      lines.push(`--- Sheet: ${sheetName} ---`);
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    for (const row of rows) {
      const parts = Object.entries(row)
        .map(([key, val]) => `${key}: ${val}`)
        .join(", ");
      lines.push(parts);
    }
  }

  return lines.join("\n");
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractText(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

export async function extractTextFromFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ExtractedFile> {
  const fileType = getFileType(mimeType, filename);

  logger.info("FileExtractor", `Extracting text from ${fileType} file`, {
    filename,
    mimeType,
    size: buffer.length,
  });

  let text: string;

  switch (fileType) {
    case "pdf":
      text = await extractPdf(buffer);
      break;
    case "csv":
      text = extractCsv(buffer);
      break;
    case "excel":
      text = extractExcel(buffer);
      break;
    case "docx":
      text = await extractDocx(buffer);
      break;
    case "doc":
      text = await extractDocx(buffer);
      break;
    case "text":
      text = extractText(buffer);
      break;
    default:
      throw createApiError(`Cannot extract text from: ${fileType}`, 400);
  }

  text = text.trim();

  if (!text) {
    throw createApiError("No text content could be extracted from the file", 400);
  }

  logger.info("FileExtractor", "Text extracted", {
    filename,
    extractedLength: text.length,
  });

  return { text, filename, mimeType };
}
