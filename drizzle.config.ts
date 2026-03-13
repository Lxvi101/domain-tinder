import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local (drizzle-kit runs outside Next.js, which auto-loads it)
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
