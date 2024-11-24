const Group = require('../models/Group');
const mongoose = require('mongoose');
const User = require('../models/User');
const Expense = require('../models/ExpenseSchema');

exports.addExpense = async (req, res) => {
    try {
        const { expenseName, amount, payer, participants, groupId } = req.body;

        // Validate required fields
        if (!expenseName || !amount || !payer || !participants || !groupId) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount.' });
        }

        // Validate participants
        if (!Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({ message: 'Participants are required.' });
        }

        const updatedParticipants = participants.map(participant => ({
            user: participant,
            hasPaid: participant.toString() === payer.toString()
        }));

        if (!updatedParticipants.find(p => p.user.toString() === payer.toString())) {
            return res.status(400).json({ message: 'Payer must be one of the participants.' });
        }

        // Create a new expense
        const newExpense = new Expense({
            expenseName,
            amount,
            payer,
            participants: updatedParticipants,
            group: groupId
        });

        // Save the expense to the database
        await newExpense.save();

        res.status(201).json({
            message: 'Expense added successfully.',
            expense: newExpense
        });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};