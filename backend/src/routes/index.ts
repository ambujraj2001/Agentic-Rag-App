import { Router } from "express";
import multer from "multer";
import { ingestHandler } from "../controllers/ingestController";
import { queryHandler } from "../controllers/queryController";
import { uploadHandler } from "../controllers/uploadController";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const router = Router();

router.post("/ingest", ingestHandler);
router.post("/upload", upload.single("file"), uploadHandler);
router.post("/query", queryHandler);

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
