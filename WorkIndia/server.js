const express = require('express');  // Import Express.js to create a web server
const cors = require('cors');  // Import CORS to allow frontend to access API
require('dotenv').config();  // Load environment variables from .env file

//Import API Routes
const authRoutes = require('./routes/authRoutes');  // User Authentication Routes
const adminRoutes = require('./routes/adminRoutes');  // Admin Routes (Adding Trains)
const trainRoutes = require('./routes/trainRoutes');  // Train Booking & Search Routes

const app = express();  // Create an Express application

//Middleware
app.use(cors());  // Enable Cross-Origin Resource Sharing (Allows frontend to communicate with backend)
app.use(express.json());  // Parse incoming JSON request bodies

//API Routes (Defines API Endpoints)
app.use('/auth', authRoutes);    // Handles user authentication (register & login)
app.use('/admin', adminRoutes);  // Handles admin operations (Add Train)
app.use('/api', trainRoutes);    // Handles train search & booking functionalities

//Default Route (Basic check to see if API is running)
app.get('/', (req, res) => {
    res.send("Railway Booking API is running!");  // Returns a simple text response
});

//Define the PORT (Uses value from .env or defaults to 5000)
const PORT = process.env.PORT || 5000;

//Start the Express Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
