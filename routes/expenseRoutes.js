
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');


router.post('/add-expense', expenseController.addExpense);
module.exports = router;
