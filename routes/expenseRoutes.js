// routes/expensesRoutes.js

const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expenseController'); // Adjust the path as necessary

// Define routes and map to controller functions
router.post('/addExpense', expensesController.addExpense);
router.post('/confirmPaymentAndAddExpense', expensesController.confirmPaymentAndAddExpense);
router.get('/show-data', expensesController.getData);
router.get('/:expenseId', expensesController.getExpenseDetail);
router.delete('/:expenseId', expensesController.deleteExpense);

// Export the router
module.exports = router;
