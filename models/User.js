const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        validate: {
            validator: email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
            message: 'Invalid email format'
        }
    },
    password: { type: String, required: true },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
