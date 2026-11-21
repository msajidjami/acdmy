import fg from "fast-glob";
import fs from "fs/promises";
import path from "path";

export async function readCodebaseContext() {
  // صرف اہم فائلیں پڑھیں، node_modules اور .next کو چھوڑ دیں
  const files = await fg([
    "app/**/*.tsx",
    "app/**/*.ts",
    "components/**/*.tsx",
    "models/**/*.ts",
    "package.json",
    "README.md"
  ], {
    ignore: ["node_modules/**", ".next/**", "**/*.test.ts", "**/*.spec.ts"],
    absolute: true,
  });

  let context = "";

  for (const file of files) {
    // صرف 20 بڑی فائلیں پڑھیں تاکہ Token Limit ختم نہ ہو
    if (context.length > 15000) break; 

    const content = await fs.readFile(file, "utf-8");
    const relativePath = path.relative(process.cwd(), file);
    
    // صرف ضروری کوڈ رکھیں (کمنٹس ہٹا دیں)
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "").trim();
    
    context += `\n--- FILE: ${relativePath} ---\n${cleanContent}\n`;
  }

  return context;
}