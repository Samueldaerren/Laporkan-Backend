const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory, getCategoryStats } = require('./category.controller');
const authMiddleware = require('../../middleware/auth');

router.get('/', authMiddleware, getCategories);
router.get('/stats', authMiddleware, getCategoryStats);
router.post('/', authMiddleware, createCategory);
router.put('/:id', authMiddleware, updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);

module.exports = router;