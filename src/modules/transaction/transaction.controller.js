const pool = require('../../config/db');

const getTransactions = async (req, res, next) => {
  try {
    const { search, category_id, type, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    let conditions = 'WHERE t.user_id = $1';

    if (search) {
      params.push(`%${search}%`);
      conditions += ` AND t.name ILIKE $${params.length}`;
    }
    if (category_id) {
      params.push(category_id);
      conditions += ` AND t.category_id = $${params.length}`;
    }
    if (type) {
      params.push(type);
      conditions += ` AND t.type = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions t ${conditions}`,
      params
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT t.*, c.name as category_name FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      ${conditions}
      ORDER BY t.date DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const { category_id, name, amount, type, description, date } = req.body;

    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, name, amount, type, description, date)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, category_id, name, amount, type, description, date]
    );

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_id, name, amount, type, description, date } = req.body;

    const result = await pool.query(
      `UPDATE transactions SET
        category_id = COALESCE($1, category_id),
        name = COALESCE($2, name),
        amount = COALESCE($3, amount),
        type = COALESCE($4, type),
        description = COALESCE($5, description),
        date = COALESCE($6, date)
      WHERE id = $7 AND user_id = $8
      RETURNING *`,
      [category_id, name, amount, type, description, date, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({
      message: 'Transaction updated successfully',
      transaction: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const getTransactionSummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' AND date = $2 THEN amount ELSE 0 END), 0) as today_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND date = $2 THEN amount ELSE 0 END), 0) as today_expense,
        COALESCE(SUM(CASE WHEN type = 'income' AND date >= $3 THEN amount ELSE 0 END), 0) as weekly_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND date >= $3 THEN amount ELSE 0 END), 0) as weekly_expense
      FROM transactions
      WHERE user_id = $1`,
      [req.user.id, today, startOfWeekStr]
    );

    res.json({ summary: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction, getTransactionSummary };