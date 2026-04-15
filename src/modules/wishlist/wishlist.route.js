const express = require('express');
const router = express.Router();
const { getWishlists, createWishlist, updateWishlist, deleteWishlist, getWishlistStats } = require('./wishlist.controller');
const authMiddleware = require('../../middleware/auth');

router.get('/', authMiddleware, getWishlists);
router.get('/stats', authMiddleware, getWishlistStats);
router.post('/', authMiddleware, createWishlist);
router.put('/:id', authMiddleware, updateWishlist);
router.delete('/:id', authMiddleware, deleteWishlist);

module.exports = router;