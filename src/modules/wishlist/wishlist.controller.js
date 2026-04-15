const pool = require('../../config/db');

const getWishlists = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const params = [req.user.id];
    let conditions = 'WHERE user_id = $1';

    if (status) {
      params.push(status);
      conditions += ` AND status = $${params.length}`;
    }
    if (priority) {
      params.push(priority);
      conditions += ` AND priority = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT * FROM wishlists ${conditions} ORDER BY created_at DESC`,
      params
    );

    res.json({ wishlists: result.rows });
  } catch (err) {
    next(err);
  }
};

const createWishlist = async (req, res, next) => {
  try {
    const { name, image_url, target_amount, priority, due_date } = req.body;

    const result = await pool.query(
      `INSERT INTO wishlists (user_id, name, image_url, target_amount, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, name, image_url, target_amount, priority, due_date]
    );

    res.status(201).json({
      message: 'Wishlist created successfully',
      wishlist: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const updateWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, image_url, target_amount, priority, status, due_date } = req.body;

    const result = await pool.query(
      `UPDATE wishlists SET
        name = COALESCE($1, name),
        image_url = COALESCE($2, image_url),
        target_amount = COALESCE($3, target_amount),
        priority = COALESCE($4, priority),
        status = COALESCE($5, status),
        due_date = COALESCE($6, due_date)
      WHERE id = $7 AND user_id = $8
      RETURNING *`,
      [name, image_url, target_amount, priority, status, due_date, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    res.json({
      message: 'Wishlist updated successfully',
      wishlist: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const deleteWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM wishlists WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    res.json({ message: 'Wishlist deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const getWishlistStats = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'ongoing' THEN 1 END) as ongoing,
        COUNT(CASE WHEN status = 'finished' THEN 1 END) as finished,
        COALESCE(SUM(target_amount), 0) as total_target_amount
      FROM wishlists
      WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({ stats: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWishlists, createWishlist, updateWishlist, deleteWishlist, getWishlistStats };