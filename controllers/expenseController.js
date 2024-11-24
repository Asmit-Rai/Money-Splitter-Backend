const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/ExpenseSchema');

exports.addExpense = async (req, res) => {
    try {
        const { expenseName, amount, payer, participants, groupId } = req.body;

        console.log('Request Body:', req.body);

        // Validate required fields
        if (!expenseName || !amount || !payer || !participants || !groupId) {
            return res.status(400).json({ message: 'All fields are required: expenseName, amount, payer, participants, groupId.' });
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount. Must be a positive number.' });
        }

        // Find payer in the database
        const payerUser = await User.findOne({ name: payer });
        if (!payerUser) {
            return res.status(404).json({ message: `Payer "${payer}" not found.` });
        }

        // Find participants in the database and map to ObjectId
        const updatedParticipants = await Promise.all(participants.map(async (participantName) => {
            const participantUser = await User.findOne({ name: participantName });
            if (!participantUser) {
                throw new Error(`Participant "${participantName}" not found.`);
            }
            return {
                user: participantUser._id,
                hasPaid: participantUser._id.toString() === payerUser._id.toString(),
            };
        }));

        // Validate that the payer is included in the participants
        if (!updatedParticipants.some(p => p.user.toString() === payerUser._id.toString())) {
            return res.status(400).json({ message: 'Payer must be one of the participants.' });
        }

        // Validate group existence
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: `Group with ID "${groupId}" not found.` });
        }

        // Create a new expense
        const newExpense = new Expense({
            expenseName,
            amount,
            payer: payerUser._id,
            participants: updatedParticipants,
            group: group._id,
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
