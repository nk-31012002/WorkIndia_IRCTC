const express = require('express');  // Importing Express.js framework to create API routes
const db = require('../db');  // Importing the database connection file

const router = express.Router();  // Creating an Express Router to define API routes

// Middleware function to authenticate admin requests
const authenticateAdmin = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];  // Getting the API key from the request headers

    if (apiKey !== process.env.ADMIN_API_KEY) {  // Checking if the API key is correct
        return res.status(403).json({ message: "Unauthorized" });  // If incorrect, deny access
    }

    next();  // If correct, proceed to the next function
};

// **Route to add a new train (Only Admins can use this)**
router.post('/train', authenticateAdmin, async (req, res) => {
    const { name, source, destination, total_seats } = req.body;  // Extract train details from request

    try {
        // Insert train details into the `trains` table
        const [result] = await db.execute(
            "INSERT INTO trains (name, source, destination, total_seats) VALUES (?, ?, ?, ?)",
            [name, source, destination, total_seats]
        );

        // Insert the number of available seats for the new train into the `seats` table
        await db.execute("INSERT INTO seats (train_id, available_seats) VALUES (?, ?)", 
            [result.insertId, total_seats]);

        // Send success response with the new train's ID
        res.json({ message: "Train added successfully", trainId: result.insertId });

    } catch (error) {
        // If any error occurs, return a 500 status code with the error message
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;  // Exporting the router so it can be used in `server.js`
