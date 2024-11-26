// routes/expenseRoutes.js

const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expensesController');

// Route to confirm payment and add expense
router.post('/confirmPaymentAndAddExpense', expensesController.confirmPaymentAndAddExpense);

// Route to get all expenses
router.get('/show-data', expensesController.getData);

// Route to get expense details
router.get('/:expenseId', expensesController.getExpenseDetail);

// Route to delete an expense
router.delete('/:expenseId', expensesController.deleteExpense);

module.exports = router;
