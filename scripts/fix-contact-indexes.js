// scripts/fix-contact-indexes.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnv() {
  const candidates = ['.env.local', '.env.development', '.env'];
  let loadedAny = false;

  for (const f of candidates) {
    const full = path.join(process.cwd(), f);
    if (!fs.existsSync(full)) continue;

    const text = fs.readFileSync(full, 'utf8');
    let count = 0;

    text.split(/\r?\n/).forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      const eq = t.indexOf('=');
      if (eq === -1) return;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && !process.env[key]) {
        process.env[key] = val;
        count++;
      }
    });

    console.log('Loaded ' + count + ' vars from ' + f);
    if (count > 0) loadedAny = true;
  }

  if (!loadedAny) console.warn('WARNING: No env variables loaded.');
}

async function run() {
  loadEnv();

  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    process.env.DATABASE_URL ||
    process.env.DB_URI;

  if (!uri) {
    console.error('\nERROR: MongoDB URI not found.');
    console.error('Available env keys:');
    Object.keys(process.env)
      .filter((k) => /MONGO|DB|URI|DATABASE/i.test(k))
      .forEach((k) => console.error('  -', k));
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected');

  const col = mongoose.connection.collection('contacts');

  console.log('\nExisting indexes:');
  const before = await col.indexes();
  before.forEach((idx) => {
    console.log('  -', idx.name, JSON.stringify(idx.key));
  });

  const indexesToDrop = [
    'ownerId_1_email_1',
    'ownerId_1_phone_1',
    'ownerId_1_contactId_1',
  ];

  for (const name of indexesToDrop) {
    try {
      await col.dropIndex(name);
      console.log('Dropped:', name);
    } catch {
      console.log('Not found:', name);
    }
  }

  console.log('\nCleaning null/empty fields...');

  const cleanEmail = await col.updateMany(
    { $or: [{ email: null }, { email: '' }] },
    { $unset: { email: '' } }
  );
  console.log('  email unset:', cleanEmail.modifiedCount);

  const cleanPhone = await col.updateMany(
    { $or: [{ phone: null }, { phone: '' }] },
    { $unset: { phone: '' } }
  );
  console.log('  phone unset:', cleanPhone.modifiedCount);

  const cleanContactId = await col.updateMany(
    { contactId: null },
    { $unset: { contactId: '' } }
  );
  console.log('  contactId unset:', cleanContactId.modifiedCount);

  console.log('\nCreating partial indexes...');

  await col.createIndex(
    { ownerId: 1, contactId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        contactId: { $exists: true, $type: 'objectId' },
      },
      name: 'ownerId_1_contactId_1',
    }
  );
  console.log('  created ownerId_1_contactId_1');

  await col.createIndex(
    { ownerId: 1, email: 1 },
    {
      unique: true,
      partialFilterExpression: {
        email: { $exists: true, $type: 'string', $ne: '' },
      },
      name: 'ownerId_1_email_1',
    }
  );
  console.log('  created ownerId_1_email_1');

  await col.createIndex(
    { ownerId: 1, phone: 1 },
    {
      unique: true,
      partialFilterExpression: {
        phone: { $exists: true, $type: 'string', $ne: '' },
      },
      name: 'ownerId_1_phone_1',
    }
  );
  console.log('  created ownerId_1_phone_1');

  console.log('\nFinal indexes:');
  const after = await col.indexes();
  after.forEach((idx) => {
    console.log('  -', idx.name, JSON.stringify(idx.key));
  });

  await mongoose.disconnect();
  console.log('\nMigration complete!');
}

run().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
