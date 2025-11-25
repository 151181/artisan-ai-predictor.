import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// --- ROUTES IMPORTS ---
// Assuming 'auth.js' is at the same level as server.js
import authRoutes from "./auth.js"; 
import artisanRoutes from "./routers/artisansRoutes.js";
import productRoutes from "./routers/productRoutes.js";
import campaignRoutes from "./routers/campaignRoutes.js";
import analyticsRoutes from "./routers/analyticsRoutes.js";
import recommendationsRoutes from "./routers/recommendationsRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- MIDDLEWARE ---
// Mandatory to parse incoming JSON data (like user registration details)
app.use(express.json()); 
app.use(cors({ origin: ["http://127.0.0.1:5000", "http://localhost:5500"] }));

// --- MONGODB CONNECTION ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            // These parameters ensure Mongoose uses the correct connection pool setup
            dbName: process.env.MONGO_DB_NAME, // MANDATORY: Explicitly defines the database name
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected ✅");
    } catch (err) {
        console.error("MongoDB connection error ❌:", err.message);
        // Exit process with failure code if connection fails
        process.exit(1);
    }
}

// Execute the database connection
connectDB(); 

// --- ROUTES ---
app.use("/api/auth", authRoutes); // Authentication routes (Registration/Login)
app.use("/api/artisans", artisanRoutes);
app.use("/api/products", productRoutes); 
app.use("/api/campaigns", campaignRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/recommendations", recommendationsRoutes);

// API status endpoint
app.get("/api", (req, res) => {
  res.json({ message: "Artisan AI Platform API is running 🚀" });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, "./public")));

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "./public/home.html"))
);


// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
