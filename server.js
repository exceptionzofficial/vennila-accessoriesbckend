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

// Enable CORS and expose custom headers
app.use(cors({
    exposedHeaders: ['X-Cache']
}));

// Basic Route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Vennila Accessories API' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT || 5000;

// Keep-alive logic for Render free tier
const https = require('https');
const keepAlive = () => {
    const url = process.env.RENDER_EXTERNAL_URL;
    if (url) {
        https.get(url, (res) => {
            console.log(`Keep-alive ping sent to ${url}. Status: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error(`Keep-alive ping failed: ${err.message}`);
        });
    }
};

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    // Start keep-alive interval (every 12 minutes)
    if (process.env.NODE_ENV === 'production') {
        setInterval(keepAlive, 12 * 60 * 1000);
    }
});
