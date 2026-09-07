const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set in environment variables");
  }
  await mongoose.connect(uri, {
    dbName: process.env.DB_NAME || "mah_research_db",
  });
  console.log(`[DB] Connected to MongoDB -> db: ${mongoose.connection.name}`);
}

module.exports = connectDB;
