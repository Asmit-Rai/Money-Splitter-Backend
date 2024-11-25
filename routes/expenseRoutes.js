
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');


router.post('/add-expense', expenseController.addExpense);
router.post('/confirm-payment', expenseController.confirmPaymentAndAddExpense );
router.get('/show-data',expenseController.getData)


module.exports = router;
