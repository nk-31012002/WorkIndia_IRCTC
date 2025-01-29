const express = require('express');  // Importing Express.js framework to create API routes
const db = require('../db');  // Importing the database connection file
const jwt = require('jsonwebtoken'); // Importing JWT for authentication

const router = express.Router();  // Creating an Express Router to define API routes

// **Middleware to Authenticate Users**
const authenticateUser = (req, res, next) => {
    const token = req.headers['authorization'];  // Extract JWT token from request headers

    if (!token) return res.status(401).json({ message: "Unauthorized" });  // If no token, deny access

    try {
        // Verify and decode the JWT token
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded;  // Store user info in request object
        next();  // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });  // If token is invalid, deny access
    }
};

// **Get Seat Availability**
router.get('/trains', async (req, res) => {
    const { source, destination } = req.query;  // Get source and destination from query parameters

    try {
        // **Fetch all trains available between the given source and destination**
        const [trains] = await db.query(
            "SELECT t.*, s.available_seats FROM trains t JOIN seats s ON t.id = s.train_id WHERE t.source = ? AND t.destination = ?",
            [source, destination]
        );

        res.json(trains);  // Return train details as JSON response

    } catch (error) {
        res.status(500).json({ error: error.message });  // If any error occurs, return a 500 status
    }
});

// **Book a Seat (Handles Multiple Users Simultaneously)**
router.post('/book-seat', authenticateUser, async (req, res) => {
    const { train_id } = req.body;  // Extract train ID from request body
    const user_id = req.user.id;  // Get user ID from JWT token

    let connection;  // Declare database connection variable

    try {
        connection = await db.getConnection();  // Get a database connection
        await connection.beginTransaction();  // Start a database transaction

        // 🔹 **Lock the row to prevent race conditions (Multiple users booking at the same time)**
        const [seats] = await connection.query(
            "SELECT available_seats FROM seats WHERE train_id = ? FOR UPDATE", [train_id]
        );

        if (seats.length === 0) {  // If no train found, rollback transaction
            await connection.rollback();
            return res.status(404).json({ message: "Train not found" });
        }

        if (seats[0].available_seats <= 0) {  // If no seats available, rollback transaction
            await connection.rollback();
            return res.status(400).json({ message: "No seats available" });
        }

        // 🔹 **Deduct seat from availability (Reserve the seat)**
        await connection.query(
            "UPDATE seats SET available_seats = available_seats - 1 WHERE train_id = ?", [train_id]
        );

        // 🔹 **Insert a new booking record in the database**
        await connection.query(
            "INSERT INTO bookings (user_id, train_id, seat_no, status) VALUES (?, ?, ?, 'confirmed')",
            [user_id, train_id, seats[0].available_seats]  // Assigning last available seat number
        );

        await connection.commit();  // Commit the transaction
        connection.release();  // Release the database connection

        res.json({ message: "Seat booked successfully" });  // Send success response

    } catch (error) {
        if (connection) await connection.rollback();  // **Rollback transaction if any error occurs**
        res.status(500).json({ error: error.message });
    }
});

// **Get User's Bookings**
router.get('/bookings', authenticateUser, async (req, res) => {
    const user_id = req.user.id;  // Get user ID from JWT token

    try {
        // **Fetch all bookings made by the logged-in user**
        const [bookings] = await db.execute(
            "SELECT * FROM bookings WHERE user_id = ?",
            [user_id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ message: "No bookings found for this user" });  // No bookings found
        }

        res.json(bookings);  // Return booking details

    } catch (error) {
        res.status(500).json({ error: error.message });  // If any error occurs, return a 500 status
    }
});

module.exports = router;  // Exporting the router so it can be used in `server.js`
