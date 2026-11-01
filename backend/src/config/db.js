/**
 * db.js
 * Handles MongoDB connection using Mongoose.
 * In development, if MONGO_URI fails or times out, falls back to MongoMemoryServer
 * so the app still starts. In production it never falls back: running on a
 * throwaway in-memory database would silently lose every write.
 */

const mongoose = require('mongoose');
const autoSeed = require('../utils/autoSeed');

let mongoMemoryServer = null;

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  try {
    console.log('🔄 Attempting MongoDB connection...');
    await mongoose.connect(process.env.MONGO_URI, {
      // Short timeout in dev so the in-memory fallback kicks in quickly; longer in
      // production where a slow cold start shouldn't be treated as a failure.
      serverSelectionTimeoutMS: isProduction ? 30000 : 3000,
    });

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    await autoSeed();
  } catch (error) {
    if (isProduction) {
      console.error(`❌ MongoDB connection failed: ${error.message}`);
      process.exit(1);
    }

    console.warn(`⚠️ Remote MongoDB unavailable (${error.message}). Falling back to In-Memory MongoDB...`);
    try {
      // Required lazily: mongodb-memory-server is a devDependency and isn't installed in production.
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const uri = mongoMemoryServer.getUri();

      await mongoose.connect(uri);
      console.log(`🚀 In-Memory MongoDB Connected successfully at ${uri}`);
      await autoSeed();
    } catch (memError) {
      console.error(`❌ In-Memory MongoDB Failed: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
