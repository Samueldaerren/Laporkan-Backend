const pool = require('../../config/db');
const ExcelJS = require('exceljs');

const getHistory = async (req, res, next) => {
  try {
    const { search, type, category_id, start_date, end_date, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    let conditions = 'WHERE t.user_id = $1';

    if (search) {
      params.push(`%${search}%`);
      conditions += ` AND t.name ILIKE $${params.length}`;
    }
    if (type) {
      params.push(type);
      conditions += ` AND t.type = $${params.length}`;
    }
    if (category_id) {
      params.push(category_id);
      conditions += ` AND t.category_id = $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      conditions += ` AND t.date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      conditions += ` AND t.date <= $${params.length}`;
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
      history: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
};

const exportHistory = async (req, res, next) => {
  try {
    const { start_date, end_date, type } = req.query;
    const params = [req.user.id];
    let conditions = 'WHERE t.user_id = $1';

    if (type) {
      params.push(type);
      conditions += ` AND t.type = $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      conditions += ` AND t.date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      conditions += ` AND t.date <= $${params.length}`;
    }

    const result = await pool.query(
      `SELECT t.name, c.name as category_name, t.type, t.amount, t.description, t.date
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      ${conditions}
      ORDER BY t.date DESC`,
      params
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Riwayat Transaksi');

    // Header
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Category', key: 'category_name', width: 20 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Date', key: 'date', width: 15 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Rows
    result.rows.forEach((row) => {
      worksheet.addRow({
        name: row.name,
        category_name: row.category_name || '-',
        type: row.type,
        amount: row.amount,
        description: row.description || '-',
        date: new Date(row.date).toLocaleDateString('id-ID'),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=history.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getHistory, exportHistory };