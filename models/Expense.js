// models/Expense.js

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    expenseName: { type: String, required: true },
    payer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, "Payer is required and must be a valid user ID"]
    },
    participants: [
        {
            user: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'User', 
                required: [true, "Participant must have a valid user ID"] 
            },
            hasPaid: { 
                type: Boolean, 
                default: false 
            },
            amountPaid: { 
                type: Number, 
                default: 0 
            }
        }
    ],
    splitDetails: [
        {
            participant: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'User', 
                required: true 
            },
            owedAmount: { 
                type: Number, 
                required: true 
            }
        }
    ],
    amount: { 
        type: Number, 
        required: [true, "Amount is required"], 
        validate: {
            validator: value => value > 0,
            message: 'Amount must be a positive number'
        }
    },
    group: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Group', 
        required: true 
    },
    ipfsHash: { type: String },
    transactionHash: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);
