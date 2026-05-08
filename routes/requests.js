const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

const COLLECTION = 'repair_requests';

// Create a new request
router.post('/create', async (req, res) => {
  try {
    const newRequest = {
      ...req.body,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await db.collection(COLLECTION).add(newRequest);
    res.status(201).json({ success: true, id: docRef.id, request: newRequest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get all pending requests
router.get('/pending', async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION).where('status', '==', 'PENDING').get();
    const requests = [];
    snapshot.forEach(doc => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get requests submitted by a specific user
router.get('/user/:id', async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION).where('userId', '==', req.params.id).get();
    const requests = [];
    snapshot.forEach(doc => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get requests assigned to a specific technician
router.get('/technician/:id', async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION).where('technicianId', '==', req.params.id).get();
    const requests = [];
    snapshot.forEach(doc => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update request status
router.put('/update/:id', async (req, res) => {
  try {
    const { status, technicianId } = req.body;
    const updateData = { 
      status, 
      updatedAt: new Date().toISOString() 
    };
    if (technicianId) updateData.technicianId = technicianId;

    await db.collection(COLLECTION).doc(req.params.id).update(updateData);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
