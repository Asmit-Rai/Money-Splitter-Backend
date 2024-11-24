const Expense = require('../models/Expense');
const Group = require('../models/Group');

exports.addExpense = async (req, res) => {
    try {
        const { expenseName, amount, payer, participants, groupId  } = req.body;

        console.log('Received Request Body:', req.body); // Log the request body for debugging

        // Validate required fields
        if (!expenseName || !amount || !payer || !participants || !groupId) {
            return res.status(400).json({ message: 'All fields are required: expenseName, amount, payer, participants, groupId.' });
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount. Must be a positive number.' });
        }

        // Validate group existence
        const groupExists = await Group.exists({ _id: groupId });
        if (!groupExists) {
            return res.status(404).json({ message: `Group with ID "${groupId}" not found.` });
        }

        // Create the expense
        const newExpense = new Expense({
            expenseName,
            amount,
            payer, // Directly use payer ObjectId from the request
            participants, // Use participants array directly from the request
            group: groupId, // Use groupId directly
        });

        // Save the expense to the database
        await newExpense.save();

        res.status(201).json({
            message: 'Expense added successfully.',
            expense: newExpense,
        });
    } catch (error) {
        console.error('Error adding expense:', error.message);
        res.status(500).json({ message: 'Server error. Please try again later.', error: error.message });
    }
};
