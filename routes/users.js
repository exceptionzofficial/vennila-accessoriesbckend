const express = require('express');
const { db } = require('../config/firebase');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const usersCol = db.collection('users');

// @desc    Add Technician
// @route   POST /api/users/technicians
router.post('/technicians', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const snapshot = await usersCol.where('email', '==', email).get();
        if (!snapshot.empty) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userDoc = {
            name: name || 'Technician',
            email,
            password: hashedPassword,
            role: 'technician',
            createdAt: new Date().toISOString()
        };

        const docRef = await usersCol.add(userDoc);
        res.status(201).json({ success: true, id: docRef.id, ...userDoc });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get Technicians
// @route   GET /api/users/technicians
router.get('/technicians', async (req, res) => {
    try {
        const snapshot = await usersCol.where('role', '==', 'technician').get();
        const technicians = snapshot.docs.map(doc => {
            const data = doc.data();
            delete data.password;
            return { id: doc.id, ...data };
        });
        res.status(200).json(technicians);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


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
