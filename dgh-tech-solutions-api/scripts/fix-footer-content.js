/**
 * One-time script — updates the footer.main body text in MongoDB.
 * Run: node scripts/fix-footer-content.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const NEW_BODY = 'Building modern websites, AI-powered applications, cloud solutions, and enterprise software that help businesses grow.';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const col = mongoose.connection.db.collection('sitecontents');

  const existing = await col.findOne({ key: 'footer.main' });
  if (!existing) {
    // Document doesn't exist yet — insert it
    await col.insertOne({
      key: 'footer.main',
      data: { body: NEW_BODY },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Created footer.main with new body text.');
  } else {
    // Update the body field inside data
    await col.updateOne(
      { key: 'footer.main' },
      { $set: { 'data.body': NEW_BODY, updatedAt: new Date() } }
    );
    console.log('Updated footer.main body text.');
    console.log('Previous:', existing.data?.body ?? '(empty)');
  }

  console.log('New text:', NEW_BODY);
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
