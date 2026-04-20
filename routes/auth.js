const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { db } = require('../config/firebase');

const router = express.Router();
const usersCol = db.collection('users');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, shopName, password } = req.body;

        // Check if user exists
        const snapshot = await usersCol.where('email', '==', email).get();
        if (!snapshot.empty) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user doc
        const userDoc = {
            name,
            email,
            phone,
            shopName,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date().toISOString()
        };

        const docRef = await usersCol.add(userDoc);

        // Create token
        const token = jwt.sign({ id: docRef.id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: docRef.id,
                name: userDoc.name,
                email: userDoc.email,
                role: userDoc.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const snapshot = await usersCol.where('email', '==', email).get();
        if (snapshot.empty) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        // Check if password matches
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign({ id: userDoc.id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.status(200).json({
            success: true,
            token,
            user: {
                id: userDoc.id,
                name: userData.name,
                email: userData.email,
                role: userData.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const snapshot = await usersCol.where('email', '==', email).get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userDoc = snapshot.docs[0];

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save OTP
        await usersCol.doc(userDoc.id).update({
            resetOtp: otp,
            otpExpires: Date.now() + 10 * 60 * 1000
        });

        // Send email using nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: `"Vennila Accessories" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Password Reset OTP - Vennila Accessories',
            text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`
        });

        console.log(`OTP sent via email for ${email}: ${otp}`);

        res.status(200).json({ success: true, message: 'OTP sent to email' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const snapshot = await usersCol
            .where('email', '==', email)
            .where('resetOtp', '==', otp)
            .get();

        if (snapshot.empty) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        const userData = snapshot.docs[0].data();
        if (userData.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        res.status(200).json({ success: true, message: 'OTP verified' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const snapshot = await usersCol.where('email', '==', email).get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userDoc = snapshot.docs[0];

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await usersCol.doc(userDoc.id).update({
            password: hashedPassword,
            resetOtp: admin.firestore.FieldValue.delete(),
            otpExpires: admin.firestore.FieldValue.delete()
        });

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
