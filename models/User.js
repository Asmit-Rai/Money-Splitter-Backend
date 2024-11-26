// models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String },
    expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }],
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
