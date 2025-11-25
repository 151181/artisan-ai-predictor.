// backend/app/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import Artisan from '../models/Artisan.js';

// Get the secret key (must match what's in authRoutes.js)
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export const protect = async (req, res, next) => {
    let token;

    // Check for token in the 'Authorization: Bearer <token>' header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Fetch the artisan associated with the token (excluding password)
            const artisan = await Artisan.findById(decoded.id).select('-password');

            if (!artisan) {
                return res.status(401).json({ message: 'Authorization failed: Artisan not found.' });
            }

            // Attach the artisan object to the request
            req.user = artisan;
            next();

        } catch (error) {
            console.error("JWT Verification Error:", error.message);
            res.status(401).json({ message: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token.' });
    }
};