import express from 'express';
const router = express.Router();

// Placeholder route for listing products
router.get('/', (req, res) => {
    // This file will contain logic for CRUD operations on Product data
    res.json({ message: "Product routes are set up." });
});

export default router;
