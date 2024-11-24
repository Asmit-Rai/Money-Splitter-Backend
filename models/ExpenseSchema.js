const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    expenseName: { type: String, required: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            hasPaid: { type: Boolean, default: false } 
        }
    ],
    amount: { type: Number, required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);

