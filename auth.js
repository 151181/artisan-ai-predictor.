import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Artisan from './models/Artisan.js';
import { artisanSchema, loginSchema } from './schema.js'; // Imports both schemas
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET; 
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in your .env file.");
    process.exit(1);
}

// --- REGISTRATION ENDPOINT (/api/auth/register) ---
router.post('/register', async (req, res) => {
    // 1. Validation
    const { error } = artisanSchema.validate(req.body);
    if (error) {
        return res.status(400).send({ message: error.details[0].message });
    }

    try {
        // 2. Check for duplicate email
        let artisan = await Artisan.findOne({ email: req.body.email });
        if (artisan) {
            return res.status(409).send({ message: 'User already registered with this email.' });
        }

        // 3. Password Hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // 4. Create and Save User
        artisan = new Artisan({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            phoneNumber: req.body.phoneNumber,
            location: req.body.location
        });
        await artisan.save();

        // 5. Generate and Send Token
        const token = jwt.sign(
            { _id: artisan._id, email: artisan.email, name: artisan.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).header('x-auth-token', token).send({
            message: 'Registration successful!',
            token: token,
            user: {
                _id: artisan._id,
                name: artisan.name,
                email: artisan.email,
            }
        });

    } catch (err) {
        console.error('Registration Failed with detailed error:', err);
        res.status(500).send({ message: 'Something went wrong during registration.' });
    }
});

// --- LOGIN ENDPOINT (/api/auth/login) ---
router.post('/login', async (req, res) => {
    // 1. Validation using login schema (email and password only)
    const { error } = loginSchema.validate(req.body);
    if (error) {
        // Generic error message for security
        return res.status(400).send({ message: 'Invalid email or password.' });
    }

    try {
        // 2. Find User
        let artisan = await Artisan.findOne({ email: req.body.email });
        if (!artisan) {
            return res.status(400).send({ message: 'Invalid email or password.' });
        }

        // 3. Password Comparison (using bcrypt)
        const validPassword = await bcrypt.compare(req.body.password, artisan.password);
        if (!validPassword) {
            return res.status(400).send({ message: 'Invalid email or password.' });
        }

        // 4. Generate and Send Token
        const token = jwt.sign(
            { _id: artisan._id, email: artisan.email, name: artisan.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).header('x-auth-token', token).send({
            message: 'Login successful!',
            token: token,
            user: {
                _id: artisan._id,
                name: artisan.name,
                email: artisan.email,
            }
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).send({ message: 'Something went wrong during login.' });
    }
});

export default router;
