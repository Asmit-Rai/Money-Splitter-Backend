const Group = require('../models/Group');
const mongoose = require('mongoose');
const User = require('../models/User');
const Expense = require('../models/ExpenseSchema');

exports.addExpense = async (req, res) => {
    try {
        const { expenseName, amount, payer, participants, groupId } = req.body;

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

        // Find the payer
        const payerUser = await User.findOne({ name: payer });
        if (!payerUser) {
            return res.status(404).json({ message: 'Payer not found.' });
        }

        // Map participants to user IDs
        const updatedParticipants = await Promise.all(
            participants.map(async (participantName) => {
                const participantUser = await User.findOne({ name: participantName });
                if (!participantUser) {
                    throw new Error(`Participant not found: ${participantName}`);
                }
                return {
                    user: participantUser._id,
                    hasPaid: participantUser._id.toString() === payerUser._id.toString(),
                };
            })
        );

        // Ensure the payer is included in the participants
        if (!updatedParticipants.some((p) => p.user.toString() === payerUser._id.toString())) {
            return res.status(400).json({ message: 'Payer must be one of the participants.' });
        }

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        // Create a new expense
        const newExpense = new Expense({
            expenseName,
            amount,
            payer: payerUser._id,
            participants: updatedParticipants,
            group: groupId,
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
