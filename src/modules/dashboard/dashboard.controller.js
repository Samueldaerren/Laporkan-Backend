const pool = require('../../config/db');

const getDashboard = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Income & Expense summary
    const summaryResult = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' AND date = $2 THEN amount ELSE 0 END), 0) as today_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND date = $2 THEN amount ELSE 0 END), 0) as today_expense,
        COALESCE(SUM(CASE WHEN type = 'income' AND date >= $3 THEN amount ELSE 0 END), 0) as weekly_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND date >= $3 THEN amount ELSE 0 END), 0) as weekly_expense,
        COALESCE(SUM(CASE WHEN type = 'income' AND TO_CHAR(date, 'YYYY-MM') = $4 THEN amount ELSE 0 END), 0) as monthly_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND TO_CHAR(date, 'YYYY-MM') = $4 THEN amount ELSE 0 END), 0) as monthly_expense
      FROM transactions
      WHERE user_id = $1`,
      [req.user.id, today, startOfWeekStr, thisMonth]
    );

    // Recent transactions
    const recentTransactions = await pool.query(
      `SELECT t.*, c.name as category_name FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = $1
      ORDER BY t.date DESC
      LIMIT 5`,
      [req.user.id]
    );

    // Wishlist preview
    const wishlistPreview = await pool.query(
      `SELECT * FROM wishlists
      WHERE user_id = $1 AND status = 'ongoing'
      ORDER BY created_at DESC
      LIMIT 3`,
      [req.user.id]
    );

    // Daily savings chart (last 7 days)
    const savingsChart = await pool.query(
      `SELECT
        TO_CHAR(date, 'DD Mon') as label,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM savings
      WHERE user_id = $1 AND date >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(date, 'DD Mon'), date
      ORDER BY date ASC`,
      [req.user.id]
    );

    // Wishlist stats
    const wishlistStats = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'ongoing' THEN 1 END) as ongoing,
        COUNT(CASE WHEN status = 'finished' THEN 1 END) as finished
      FROM wishlists
      WHERE user_id = $1`,
      [req.user.id]
    );

    const summary = summaryResult.rows[0];

    res.json({
      summary: {
        today_income: summary.today_income,
        today_expense: summary.today_expense,
        weekly_income: summary.weekly_income,
        weekly_expense: summary.weekly_expense,
        monthly_income: summary.monthly_income,
        monthly_expense: summary.monthly_expense,
        monthly_savings: summary.monthly_income - summary.monthly_expense,
      },
      recent_transactions: recentTransactions.rows,
      wishlist_preview: wishlistPreview.rows,
      wishlist_stats: wishlistStats.rows[0],
      savings_chart: savingsChart.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };