/**
 * db.js
 * Handles MongoDB connection using Mongoose.
 *
 * Why separated? So that connection logic is centralized.
 * Any change (e.g., replica sets, auth) only touches this file.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options silence deprecation warnings in Mongoose 6+
      // and ensure stable, predictable connection behavior.
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit the process if DB connection fails — the app shouldn't run without it.
    process.exit(1);
  }
};

module.exports = connectDB;
