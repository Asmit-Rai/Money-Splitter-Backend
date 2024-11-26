const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// Define your routes and attach the corresponding controller methods
router.post('/addExpense', expenseController.addExpense);
router.post('/confirmPaymentAndAddExpense', expenseController.confirmPaymentAndAddExpense);
router.get('/getData', expenseController.getData);
router.get('/getExpenseDetail/:expenseId', expenseController.getExpenseDetail);

module.exports = router;