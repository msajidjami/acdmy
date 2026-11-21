import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Next.js کی .env.local فائل لوڈ کرنے کے لیے
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./models/schema.ts", // آپ کے سکیما کا راستہ
  out: "./drizzle",             // مائیگریشن فائلیں یہاں محفوظ ہوں گی
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});