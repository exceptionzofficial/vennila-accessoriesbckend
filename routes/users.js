const express = require('express');
const { db } = require('../config/firebase');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const usersCol = db.collection('users');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', async (req, res) => {
    try {
        const snapshot = await usersCol.orderBy('createdAt', 'desc').get();
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            delete data.password; // Don't send passwords
            return { id: doc.id, ...data };
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get subscription data (Placeholder)
// @route   GET /api/users/subscriptions
// @access  Private/Admin
router.get('/subscriptions', async (req, res) => {
    try {
        // Deferred logic for RevenueCat
        res.status(200).json([]);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
