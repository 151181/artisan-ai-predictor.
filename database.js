// backend/app/database.js
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "artisan_ai";

// Function to connect to MongoDB
export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URL, {
      dbName: MONGO_DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connected to database: ${MONGO_DB_NAME}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
