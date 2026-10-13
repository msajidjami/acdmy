const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnv() {
  const files = ['.env.local', '.env'];
  for (const f of files) {
    const full = path.join(process.cwd(), f);
    if (!fs.existsSync(full)) continue;
    fs.readFileSync(full, 'utf8').split(/\r?\n/).forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      const eq = t.indexOf('=');
      if (eq === -1) return;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (key && !process.env[key]) process.env[key] = val;
    });
    console.log('Loaded env from', f);
    break;
  }
}

async function run() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const col = mongoose.connection.collection('whatsapp_auth');
  const before = await col.countDocuments();
  console.log('Before:', before, 'documents');

  const result = await col.deleteMany({});
  console.log('Deleted:', result.deletedCount, 'documents');

  const after = await col.countDocuments();
  console.log('After:', after, 'documents');

  await mongoose.disconnect();
  console.log('Done! Now restart dev server and try again.');
}

run().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
