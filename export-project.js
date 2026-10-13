// export-project.js
// Yeh script aap ke project ko ek hi file mein export karta hai.
// Kuch bhi delete ya modify NAHI karta.

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'project-export.txt');

// Yeh folders skip honge
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  'dist',
  'build',
  'out',
  'coverage',
  '.vercel',
  '.idea',
  '.vscode',
  'public',        // agar public ki images chhahiye to hata dein
  '.cache',
]);

// Yeh extensions skip honge
const SKIP_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.mp4', '.mp3', '.wav', '.pdf', '.zip', '.rar', '.7z',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.lock',
]);

// In files mein secrets hide karne hain
const SECRET_FILES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
]);

// Sensitive key names — inki value hide ho jayegi
const SECRET_KEYS = [
  'SECRET', 'KEY', 'PASSWORD', 'PASS', 'TOKEN',
  'API_KEY', 'APIKEY', 'PRIVATE', 'CLIENT_SECRET',
  'DATABASE_URL', 'MONGODB_URI', 'JWT',
];

function isSecretKey(key) {
  const k = key.toUpperCase();
  return SECRET_KEYS.some((s) => k.includes(s));
}

function maskEnvFile(content) {
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      const eq = line.indexOf('=');
      if (eq === -1) return line;
      const key = line.slice(0, eq);
      if (isSecretKey(key)) {
        return `${key}=***HIDDEN***`;
      }
      return line;
    })
    .join('\n');
}

// Yeh extensions include honge
const INCLUDE_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.css', '.scss', '.md', '.mdx', '.txt',
  '.prisma', '.env', '.yml', '.yaml',
]);

let totalFiles = 0;
let output = '';

function writeHeader(title) {
  output += `\n\n${'='.repeat(80)}\n${title}\n${'='.repeat(80)}\n\n`;
}

function writeFileHeader(relPath) {
  output += `\n${'-'.repeat(80)}\n📄 FILE: ${relPath}\n${'-'.repeat(80)}\n`;
}

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(fullPath);
      continue;
    }

    if (!entry.isFile()) continue;

    // .env files ko special handling
    const isEnvFile = SECRET_FILES.has(entry.name);

    const ext = path.extname(entry.name).toLowerCase();
    if (!isEnvFile && !INCLUDE_EXTS.has(ext)) continue;
    if (SKIP_EXTS.has(ext)) continue;

    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      continue;
    }

    if (isEnvFile) {
      content = maskEnvFile(content);
    }

    // bohat bara file skip karo (> 200KB)
    if (content.length > 200 * 1024) {
      writeFileHeader(relPath);
      output += `[SKIPPED — file too large: ${content.length} bytes]\n`;
      continue;
    }

    writeFileHeader(relPath);
    output += content;
    if (!content.endsWith('\n')) output += '\n';
    totalFiles++;
  }
}

/* ============================================================ */

writeHeader('PROJECT EXPORT');
output += `Project root : ${ROOT}\n`;
output += `Exported at  : ${new Date().toISOString()}\n`;
output += `Total files  : (see end)\n`;

// package.json first
const pkgPath = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgPath)) {
  writeHeader('📦 package.json');
  output += fs.readFileSync(pkgPath, 'utf8');
}

// ab baaki sab
writeHeader('📁 PROJECT FILES');
walk(ROOT);

output += `\n\n${'='.repeat(80)}\n✅ TOTAL FILES EXPORTED: ${totalFiles}\n${'='.repeat(80)}\n`;

fs.writeFileSync(OUTPUT, output, 'utf8');

console.log('✅ Export complete!');
console.log('📄 File:', OUTPUT);
console.log('📊 Files included:', totalFiles);
console.log('📏 Size:', (output.length / 1024).toFixed(1), 'KB');