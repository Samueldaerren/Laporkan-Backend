const pool = require('../../config/db');

const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM categories WHERE user_id = $1';
    const params = [req.user.id];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ categories: result.rows });
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, type } = req.body;

    const result = await pool.query(
      'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, type]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    const result = await pool.query(
      `UPDATE categories SET 
        name = COALESCE($1, name),
        type = COALESCE($2, type)
      WHERE id = $3 AND user_id = $4
      RETURNING *`,
      [name, type, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const getCategoryStats = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.type,
        COUNT(t.id) as total_usage,
        COALESCE(SUM(t.amount), 0) as total_amount
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id
      WHERE c.user_id = $1
      GROUP BY c.id, c.name, c.type
      ORDER BY total_amount DESC`,
      [req.user.id]
    );

    res.json({ stats: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, getCategoryStats };