const express = require('express');
const router = express.Router();
const { getSummary, getByCategory, getInsight } = require('./analysis.controller');
const authMiddleware = require('../../middleware/auth');

router.get('/summary', authMiddleware, getSummary);
router.get('/by-category', authMiddleware, getByCategory);
router.get('/insight', authMiddleware, getInsight);

module.exports = router;