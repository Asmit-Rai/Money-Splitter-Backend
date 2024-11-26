// routes/expenseRoutes.js

const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expenseController');

// Route to confirm payment and add expense
router.post('/confirmPaymentAndAddExpense', expensesController.confirmPaymentAndAddExpense);

// Other routes...
router.get('/show-data', expensesController.getData);
router.get('/:expenseId', expensesController.getExpenseDetail);
router.delete('/:expenseId', expensesController.deleteExpense);

module.exports = router;
