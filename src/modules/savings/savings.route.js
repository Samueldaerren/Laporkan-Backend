const express = require('express');
const router = express.Router();
const { getSavings, createSaving, getSavingsChart, getSavingsSummary } = require('./savings.controller');
const authMiddleware = require('../../middleware/auth');

router.get('/', authMiddleware, getSavings);
router.get('/chart', authMiddleware, getSavingsChart);
router.get('/summary', authMiddleware, getSavingsSummary);
router.post('/', authMiddleware, createSaving);

module.exports = router;