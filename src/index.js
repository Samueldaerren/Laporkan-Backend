const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const errorHandler = require('./middleware/error');
const authRoute = require('./modules/auth/auth.route');
const userRoute = require('./modules/user/user.route');
const categoryRoute = require('./modules/category/category.route');
const transactionRoute = require('./modules/transaction/transaction.route');
const savingsRoute = require('./modules/savings/savings.route');
const wishlistRoute = require('./modules/wishlist/wishlist.route');
const analysisRoute = require('./modules/analysis/analysis.route');
const historyRoute = require('./modules/history/history.route');
const dashboardRoute = require('./modules/dashboard/dashboard.route');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/transactions', transactionRoute);
app.use('/api/savings', savingsRoute);
app.use('/api/wishlists', wishlistRoute);
app.use('/api/analysis', analysisRoute);
app.use('/api/history', historyRoute);
app.use('/api/dashboard', dashboardRoute);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Laporkan API is running!' });
});

// Error Handler
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;