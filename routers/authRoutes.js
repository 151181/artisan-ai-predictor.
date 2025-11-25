// backend/app/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// Use the Artisan model for all authentication, consolidating away from User.js
import Artisan from "../models/Artisan.js"; 
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// ----------------- Login (Artisan Authentication) -----------------
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find artisan: We MUST explicitly select the password hash to compare it
        const artisan = await Artisan.findOne({ email }).select('+password');
        if (!artisan) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, artisan.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { id: artisan._id, email: artisan.email },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        // 4. Send success response (excluding password)
        res.json({
            message: "Login successful",
            token,
            artisan: {
                id: artisan._id,
                name: artisan.name,
                email: artisan.email,
                location: artisan.location,
            },
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ error: "Login failed", details: err.message });
    }
});

// ----------------- Registration (Artisan Registration) -----------------
// Implementing registration directly here for simplicity, replacing authController.js dependency
router.post('/register', async (req, res) => {
    const { name, email, password, phoneNumber, location } = req.body;

    try {
        let artisan = await Artisan.findOne({ email });
        if (artisan) {
            return res.status(400).json({ message: 'Artisan already exists with that email.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        artisan = new Artisan({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            location
        });

        await artisan.save();

        // Generate token upon successful registration for immediate login
        const token = jwt.sign(
            { id: artisan._id, email: artisan.email },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful. User created.',
            token,
            artisan: { name: artisan.name, email: artisan.email }
        });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: 'Server error during registration.', details: error.message });
    }
});


// ----------------- Get Authenticated User Details -----------------
// Uses the new middleware to check the token and populate req.user
router.get("/me", protect, async (req, res) => {
    // req.user is already populated by the protect middleware and excludes the password
    res.json(req.user);
});


export default router;
