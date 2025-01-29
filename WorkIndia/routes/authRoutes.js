const express = require('express');  // Importing Express.js framework to create API routes
const bcrypt = require('bcryptjs');  // Importing bcryptjs to hash and compare passwords securely
const jwt = require('jsonwebtoken'); // Importing JWT to generate authentication tokens
const db = require('../db');  // Importing the database connection file

const router = express.Router();  // Creating an Express Router to define API routes

// **User Registration Endpoint**
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;  // Extracting user input from request body

    try {
        // **Hash the password before storing it in the database** (for security)
        const hashedPassword = await bcrypt.hash(password, 10);

        // **Insert the new user into the `users` table**
        const [result] = await db.execute(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role]
        );

        // **Return success response with the new user ID**
        res.json({ message: "User registered successfully", userId: result.insertId });

    } catch (error) {
        // **If an error occurs, return a 500 status code with the error message**
        res.status(500).json({ error: error.message });
    }
});

// **User Login Endpoint**
router.post('/login', async (req, res) => {
    const { email, password } = req.body;  // Extracting login credentials from request body

    try {
        // **Check if the user exists in the database by email**
        const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

        if (users.length === 0) {
            // **If user is not found, return "Invalid credentials"**
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = users[0];  // Get user details from database
        const isMatch = await bcrypt.compare(password, user.password);  // **Compare the provided password with stored hashed password**

        if (!isMatch) {
            // **If password does not match, return "Invalid credentials"**
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // **Generate a JWT token with the user's ID & role**
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,  // Secret key from .env file
            { expiresIn: "1h" }  // Token expires in 1 hour
        );

        // **Return success response with JWT token**
        res.json({ message: "Login successful", token });

    } catch (error) {
        // **If an error occurs, return a 500 status code with the error message**
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;  // Exporting the router so it can be used in `server.js`
