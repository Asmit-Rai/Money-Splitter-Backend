
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');


router.post('/add-expense', expenseController.addExpense);
router.post('/confirm-payment', expenseController.confirmPaymentAndAddExpense );



module.exports = router;
