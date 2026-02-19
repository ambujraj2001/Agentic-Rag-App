import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface EnvConfig {
  HF_API_BASE: string;
  HF_MODEL: string;
  HF_API_KEY: string;
  WEAVIATE_HOST: string;
  PORT: number;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

export const env: EnvConfig = {
  HF_API_BASE: requireEnv("HF_API_BASE"),
  HF_MODEL: requireEnv("HF_MODEL"),
  HF_API_KEY: requireEnv("HF_API_KEY"),
  WEAVIATE_HOST: process.env.WEAVIATE_HOST || "http://localhost:8090",
  PORT: parseInt(process.env.PORT || "3001", 10),
};
