const pool = require('../../config/db');

const getSavings = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const params = [req.user.id];
    let conditions = 'WHERE user_id = $1';

    if (start_date) {
      params.push(start_date);
      conditions += ` AND date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      conditions += ` AND date <= $${params.length}`;
    }

    const result = await pool.query(
      `SELECT * FROM savings ${conditions} ORDER BY date DESC`,
      params
    );

    res.json({ savings: result.rows });
  } catch (err) {
    next(err);
  }
};

const createSaving = async (req, res, next) => {
  try {
    const { amount, type, description, date } = req.body;

    const result = await pool.query(
      `INSERT INTO savings (user_id, amount, type, description, date)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, amount, type, description, date]
    );

    res.status(201).json({
      message: 'Saving created successfully',
      saving: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const getSavingsChart = async (req, res, next) => {
  try {
    const { period = 'daily' } = req.query;

    let groupBy, dateFormat;
    if (period === 'monthly') {
      groupBy = "TO_CHAR(date, 'YYYY-MM')";
      dateFormat = "TO_CHAR(date, 'Mon YYYY')";
    } else {
      groupBy = "TO_CHAR(date, 'YYYY-MM-DD')";
      dateFormat = "TO_CHAR(date, 'DD Mon')";
    }

    const result = await pool.query(
      `SELECT 
        ${dateFormat} as label,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net
      FROM savings
      WHERE user_id = $1
      GROUP BY ${groupBy}, ${dateFormat}
      ORDER BY ${groupBy} ASC
      LIMIT 30`,
      [req.user.id]
    );

    res.json({ chart: result.rows });
  } catch (err) {
    next(err);
  }
};

const getSavingsSummary = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as total_savings
      FROM savings
      WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({ summary: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSavings, createSaving, getSavingsChart, getSavingsSummary };