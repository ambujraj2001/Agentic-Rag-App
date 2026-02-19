import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { env } from "./config/env";
import { ensureCollection } from "./config/weaviate";
import routes from "./routes";
import { ApiError } from "./utils/errors";
import { logger } from "./utils/logger";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const frontendDist = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));

app.use("/api", routes);

app.get("/api/*", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  logger.error("ErrorHandler", message, {
    statusCode,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

async function start(): Promise<void> {
  try {
    logger.info("Server", "Initializing Weaviate collection...");
    await ensureCollection();

    app.listen(env.PORT, () => {
      logger.info("Server", `Running on http://localhost:${env.PORT}`);
      logger.info("Server", `API available at http://localhost:${env.PORT}/api`);
      logger.info("Server", `Frontend served from ${frontendDist}`);
    });
  } catch (err) {
    logger.error("Server", "Failed to start", err);
    process.exit(1);
  }
}

start();
