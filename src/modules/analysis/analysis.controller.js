const pool = require('../../config/db');

const getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

    const result = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' AND TO_CHAR(date, 'YYYY-MM') = $2 THEN amount ELSE 0 END), 0) as this_month_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND TO_CHAR(date, 'YYYY-MM') = $2 THEN amount ELSE 0 END), 0) as this_month_expense,
        COALESCE(SUM(CASE WHEN type = 'income' AND TO_CHAR(date, 'YYYY-MM') = $3 THEN amount ELSE 0 END), 0) as last_month_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND TO_CHAR(date, 'YYYY-MM') = $3 THEN amount ELSE 0 END), 0) as last_month_expense
      FROM transactions
      WHERE user_id = $1`,
      [req.user.id, thisMonth, lastMonth]
    );

    const data = result.rows[0];

    const incomeChange = data.last_month_income > 0
      ? ((data.this_month_income - data.last_month_income) / data.last_month_income * 100).toFixed(1)
      : null;

    const expenseChange = data.last_month_expense > 0
      ? ((data.this_month_expense - data.last_month_expense) / data.last_month_expense * 100).toFixed(1)
      : null;

    const thisSavings = data.this_month_income - data.this_month_expense;
    const lastSavings = data.last_month_income - data.last_month_expense;
    const savingsChange = lastSavings !== 0
      ? ((thisSavings - lastSavings) / Math.abs(lastSavings) * 100).toFixed(1)
      : null;

    res.json({
      summary: {
        this_month_income: data.this_month_income,
        this_month_expense: data.this_month_expense,
        this_month_savings: thisSavings,
        last_month_income: data.last_month_income,
        last_month_expense: data.last_month_expense,
        last_month_savings: lastSavings,
        income_change_percent: incomeChange,
        expense_change_percent: expenseChange,
        savings_change_percent: savingsChange,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getByCategory = async (req, res, next) => {
  try {
    const { month } = req.query;
    const params = [req.user.id];
    let conditions = 'WHERE t.user_id = $1';

    if (month) {
      params.push(month);
      conditions += ` AND TO_CHAR(t.date, 'YYYY-MM') = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.type,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COUNT(t.id) as total_transactions
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = $1
      WHERE c.user_id = $1
      GROUP BY c.id, c.name, c.type
      ORDER BY total_amount DESC`,
      [req.user.id]
    );

    res.json({ by_category: result.rows });
  } catch (err) {
    next(err);
  }
};

const getInsight = async (req, res, next) => {
  try {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

    const result = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' AND TO_CHAR(date, 'YYYY-MM') = $2 THEN amount ELSE 0 END), 0) as this_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND TO_CHAR(date, 'YYYY-MM') = $2 THEN amount ELSE 0 END), 0) as this_expense,
        COALESCE(SUM(CASE WHEN type = 'income' AND TO_CHAR(date, 'YYYY-MM') = $3 THEN amount ELSE 0 END), 0) as last_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND TO_CHAR(date, 'YYYY-MM') = $3 THEN amount ELSE 0 END), 0) as last_expense
      FROM transactions
      WHERE user_id = $1`,
      [req.user.id, thisMonth, lastMonth]
    );

    const d = result.rows[0];
    const insights = [];

    // Insight pengeluaran
    if (d.last_expense > 0) {
      const expenseDiff = d.this_expense - d.last_expense;
      if (expenseDiff > 0) {
        insights.push(`Pengeluaran bulan ini naik ${((expenseDiff / d.last_expense) * 100).toFixed(1)}% dibanding bulan lalu.`);
      } else {
        insights.push(`Pengeluaran bulan ini turun ${((Math.abs(expenseDiff) / d.last_expense) * 100).toFixed(1)}% dibanding bulan lalu. Bagus!`);
      }
    }

    // Insight pemasukan
    if (d.last_income > 0) {
      const incomeDiff = d.this_income - d.last_income;
      if (incomeDiff > 0) {
        insights.push(`Pemasukan bulan ini naik ${((incomeDiff / d.last_income) * 100).toFixed(1)}% dibanding bulan lalu.`);
      } else {
        insights.push(`Pemasukan bulan ini turun ${((Math.abs(incomeDiff) / d.last_income) * 100).toFixed(1)}% dibanding bulan lalu.`);
      }
    }

    // Insight tabungan
    const thisSavings = d.this_income - d.this_expense;
    if (thisSavings > 0) {
      insights.push(`Kamu berhasil menabung Rp ${thisSavings.toLocaleString('id-ID')} bulan ini.`);
    } else if (thisSavings < 0) {
      insights.push(`Pengeluaran melebihi pemasukan sebesar Rp ${Math.abs(thisSavings).toLocaleString('id-ID')} bulan ini. Perhatikan pengeluaranmu!`);
    }

    res.json({ insights });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getByCategory, getInsight };