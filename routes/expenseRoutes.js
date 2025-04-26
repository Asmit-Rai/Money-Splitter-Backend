const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// Routes for handling expenses
router.post('/addExpense', expenseController.addExpense);
router.get('/show-data', expenseController.getData);
router.get('/:expenseId', expenseController.getExpenseById);
router.delete('/:expenseId', expenseController.deleteExpense);

module.exports = router;
