const mongoose = require('mongoose');

const SplitDetailSchema = new mongoose.Schema({
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owedAmount: { type: Number, required: true },
});

const ExpenseSchema = new mongoose.Schema({
  expenseName: { type: String, required: true },
  amount: { type: Number, required: true },
  payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hasPaid: { type: Boolean, default: false },
    amountPaid: { type: Number, default: 0 },
  }],
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  splitDetails: [SplitDetailSchema],
});

module.exports = mongoose.model('Expense', ExpenseSchema);
