const express = require('express');
const router = express.Router();
const { getHistory, exportHistory } = require('./history.controller');
const authMiddleware = require('../../middleware/auth');

router.get('/', authMiddleware, getHistory);
router.get('/export', authMiddleware, exportHistory);

module.exports = router;