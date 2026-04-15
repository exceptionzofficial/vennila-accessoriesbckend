const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { db } = require('./config/firebase'); // Initializes Firebase
const { connectRedis } = require('./config/redis');

// Load env vars
dotenv.config();

// Connect to databases
// MongoDB removed, Firebase initialized above
connectRedis();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Basic Route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Vennila Accessories API' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
