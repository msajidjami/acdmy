// scripts/dropIndex.js
const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
  await mongoose.connect(process.env.MONGODB_URI);
  const collection = mongoose.connection.collection('teachers');
  await collection.dropIndex('referralCode_1');
  console.log('Index dropped successfully');
  process.exit(0);
}
dropIndex().catch(console.error);