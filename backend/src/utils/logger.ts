type LogLevel = "info" | "warn" | "error" | "debug";

function timestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, context: string, message: string, meta?: unknown): void {
  const entry = {
    timestamp: timestamp(),
    level,
    context,
    message,
    ...(meta !== undefined ? { meta } : {}),
  };
  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  info: (context: string, message: string, meta?: unknown) =>
    log("info", context, message, meta),
  warn: (context: string, message: string, meta?: unknown) =>
    log("warn", context, message, meta),
  error: (context: string, message: string, meta?: unknown) =>
    log("error", context, message, meta),
  debug: (context: string, message: string, meta?: unknown) =>
    log("debug", context, message, meta),
};
