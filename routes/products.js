const express = require('express');
const { db } = require('../config/firebase');
const { protect, authorize } = require('../middleware/auth');
const { client } = require('../config/redis');

const router = express.Router();
const productsCol = db.collection('products');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const cacheKey = `products_${category || 'all'}`;

        // Try to get from Redis (with fallback if Redis is down)
        try {
            if (client.isOpen) {
                const cachedProducts = await client.get(cacheKey);
                if (cachedProducts) {
                    return res.status(200).json(JSON.parse(cachedProducts));
                }
            }
        } catch (redisError) {
            console.error('Redis GET error:', redisError);
        }

        let query = productsCol.orderBy('createdAt', 'desc');
        if (category) {
            console.log(`Searching for category: "${category}"`);
            query = query.where('category', '==', category);
        }

        const snapshot = await query.get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Save to Redis (expire in 1 hour)
        try {
            if (client.isOpen) {
                await client.setEx(cacheKey, 3600, JSON.stringify(products));
            }
        } catch (redisError) {
            console.error('Redis SET error:', redisError);
        }

        res.status(200).json(products);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', async (req, res) => {
    try {
        const productData = {
            ...req.body,
            createdAt: new Date().toISOString()
        };
        const docRef = await productsCol.add(productData);
        const newProduct = { id: docRef.id, ...productData };

        // Clear cache
        try {
            const keys = await client.keys('products_*');
            if (keys.length > 0) await client.del(keys);
        } catch (redisError) {
            console.error('Redis CACHE CLEAR error:', redisError);
        }

        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await productsCol.doc(id).update(req.body);

        // Clear cache
        try {
            const keys = await client.keys('products_*');
            if (keys.length > 0) await client.del(keys);
        } catch (redisError) {
            console.error('Redis CACHE CLEAR error:', redisError);
        }

        res.status(200).json({ success: true, message: 'Product updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await productsCol.doc(id).delete();

        // Clear cache
        try {
            const keys = await client.keys('products_*');
            if (keys.length > 0) await client.del(keys);
        } catch (redisError) {
            console.error('Redis CACHE CLEAR error:', redisError);
        }

        res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
