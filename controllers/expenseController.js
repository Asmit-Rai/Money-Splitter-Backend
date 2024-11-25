const Expense = require('../models/Expense');
const Group = require('../models/Group');
require('dotenv').config();

exports.addExpense = async (req, res) => {
    try {
        const { expenseName, amount, payer, participants, groupId } = req.body;

        // Log incoming data for debugging
        console.log('Received Request Body:', req.body);

        // Validate required fields
        if (!expenseName || !amount || !payer || !participants || !groupId) {
            return res.status(400).json({
                message: 'All fields are required: expenseName, amount, payer, participants, groupId.'
            });
        }

        // Validate participants as an array
        if (!Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({
                message: 'Participants should be a non-empty array of user IDs.'
            });
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount. Must be a positive number.' });
        }

        // Validate group existence
        const groupExists = await Group.findById(groupId);
        if (!groupExists) {
            return res.status(404).json({ message: `Group with ID "${groupId}" not found.` });
        }

        // Format participants
        const formattedParticipants = participants.map(userId => ({
            user: userId, // Ensure userId is passed as ObjectId
            hasPaid: false // Default to false
        }));

        // Create a new expense
        const newExpense = new Expense({
            expenseName,
            amount,
            payer, // Use payer ObjectId from the request
            participants: formattedParticipants, // Use formatted participants array
            group: groupId, // Use groupId directly
        });

        // Save the expense to the database
        const savedExpense = await newExpense.save();

        res.status(201).json({
            message: 'Expense added successfully.',
            expense: savedExpense,
        });
    } catch (error) {
        console.error('Error adding expense:', error.message);
        res.status(500).json({
            message: 'Server error. Please try again later.',
            error: error.message,
        });
    }
};


const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.confirmPaymentAndAddExpense = async (req, res) => {
    try {
        const { expenseName, amount, payer, participants, groupId, paymentIntentId } = req.body;

        console.log('Received Request Body:', req.body); // Debugging log

        // Validate required fields
        if (!expenseName || !amount || !payer || !participants || !groupId || !paymentIntentId) {
            return res.status(400).json({
                message: 'All fields are required: expenseName, amount, payer, participants, groupId, paymentIntentId.',
            });
        }

        // Verify the payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (!paymentIntent || paymentIntent.status !== 'succeeded') {
            console.error('Payment not successful or invalid payment intent:', paymentIntent); // Debugging log
            return res.status(400).json({ message: 'Payment not successful. Expense will not be added.' });
        }

        console.log('Payment verified:', paymentIntent.id); // Debugging log

        // Format participants array
        const formattedParticipants = participants.map((userId) => ({
            user: userId,
            hasPaid: false,
        }));

        console.log('Formatted Participants:', formattedParticipants); // Debugging log

        // Create the expense
        const newExpense = new Expense({
            expenseName,
            amount,
            payer,
            participants: formattedParticipants,
            group: groupId,
        });

        // Save the expense
        const savedExpense = await newExpense.save();

        console.log('Expense saved successfully:', savedExpense); // Debugging log

        res.status(201).json({
            message: 'Payment verified, and expense added successfully.',
            expense: savedExpense,
        });
    } catch (error) {
        console.error('Error in payment confirmation and expense creation:', error.message);
        res.status(500).json({
            message: 'Server error. Please try again later.',
            error: error.message,
        });
    }
};

