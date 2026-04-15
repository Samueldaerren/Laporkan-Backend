const express = require('express');
const router = express.Router();
const { getDashboard } = require('./dashboard.controller');
const authMiddleware = require('../../middleware/auth');

router.get('/', authMiddleware, getDashboard);

module.exports = router;