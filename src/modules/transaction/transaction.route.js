const express = require('express');
const router = express.Router();
const { getTransactions, createTransaction, updateTransaction, deleteTransaction, getTransactionSummary } = require('./transaction.controller');
const authMiddleware = require('../../middleware/auth');

router.get('/', authMiddleware, getTransactions);
router.get('/summary', authMiddleware, getTransactionSummary);
router.post('/', authMiddleware, createTransaction);
router.put('/:id', authMiddleware, updateTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);

module.exports = router;