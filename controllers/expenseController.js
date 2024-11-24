const Group = require('../models/Group');
const mongoose = require('mongoose');
const User = require('../models/User');
const Expense = require('../models/ExpenseSchema');

exports.addExpense = async (req, res) => {
    try {
        const { expenseName, amount, payer, participants} = req.body;

        // Debugging request data
        console.log('Request Body:', req.body);

        // Validate required fields
        if (!expenseName || !amount || !payer || !participants ) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount. Must be a positive number.' });
        }

        // Validate participants
        if (!Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({ message: 'Participants must be a non-empty array.' });
        }

        // Map participants to user IDs
        const updatedParticipants = participants.map((participantName) => ({
            user: participantName, // Directly use the participant name
            hasPaid: participantName === payer,
        }));


        // Create a new expense
        const newExpense = new Expense({
            expenseName,
            amount,
            payer, // Directly use the payer's name
            participants: updatedParticipants,
        });

        // Save the expense to the database
        await newExpense.save();

        res.status(201).json({
            message: 'Expense added successfully.',
            expense: newExpense,
        });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Server error. Please try again later.', error: error.message });
    }
};