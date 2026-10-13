// scripts/fix-contact-indexes.js
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI missing in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const col = mongoose.connection.collection('contacts');

  /* ---------- 1. Purane indexes drop karo ---------- */
  console.log('\n📋 Existing indexes:');
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
      console.log(`✅ Dropped index: ${name}`);
    } catch (e) {
      console.log(`ℹ️  Index not found or already dropped: ${name}`);
    }
  }

  /* ---------- 2. Data clean karo ---------- */
  console.log('\n🧹 Cleaning null/empty email & phone fields...');

  const cleanEmail = await col.updateMany(
    { $or: [{ email: null }, { email: '' }] },
    { $unset: { email: '' } }
  );
  console.log(`   email unset: ${cleanEmail.modifiedCount}`);

  const cleanPhone = await col.updateMany(
    { $or: [{ phone: null }, { phone: '' }] },
    { $unset: { phone: '' } }
  );
  console.log(`   phone unset: ${cleanPhone.modifiedCount}`);

  const cleanContactId = await col.updateMany(
    { contactId: null },
    { $unset: { contactId: '' } }
  );
  console.log(`   contactId unset: ${cleanContactId.modifiedCount}`);

  /* ---------- 3. Naye indexes banao ---------- */
  console.log('\n🔨 Creating new partial indexes...');

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
  console.log('✅ ownerId_1_contactId_1');

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
  console.log('✅ ownerId_1_email_1');

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
  console.log('✅ ownerId_1_phone_1');

  /* ---------- 4. Verify ---------- */
  console.log('\n📋 Final indexes:');
  const after = await col.indexes();
  after.forEach((idx) => {
    console.log('  -', idx.name, JSON.stringify(idx.key));
  });

  await mongoose.disconnect();
  console.log('\n🎉 Migration complete!');
}

run().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});