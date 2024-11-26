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


// Server-side code (e.g., expensesController.js)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// expensesController.js



exports.confirmPaymentAndAddExpense = async (req, res) => {
  try {
    const {
      expenseName,
      amount,
      payer,
      participants, // Array of user IDs
      groupId,
      paymentIntentId,
      splitDetails,
    } = req.body;

    console.log('Received request:', req.body);

    // Validate required fields
    if (!expenseName || !amount || !payer || !participants || !groupId || !splitDetails) {
      return res.status(400).json({
        message: 'All fields are required: expenseName, amount, payer, participants, groupId, splitDetails.'
      });
    }

    // Validate paymentIntentId
    if (!paymentIntentId) {
      return res.status(400).json({
        message: 'PaymentIntentId is required for verification.',
      });
    }

    // Retrieve the PaymentIntent using the ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      console.error('Invalid or incomplete payment intent:', paymentIntent);
      return res.status(400).json({
        message: 'Payment not successful. Expense will not be added.',
      });
    }

    console.log('PaymentIntent verified:', paymentIntent);

    // Validate group existence and participants
    const group = await Group.findById(groupId).populate("participants.user");
    if (!group) {
      return res.status(404).json({
        message: `Group with ID "${groupId}" not found.`,
      });
    }

    // Extract valid participant IDs from the group
    const groupParticipantIds = group.participants.map((p) => String(p.user._id));

    console.log('Group Participant IDs:', groupParticipantIds);
    console.log('Expense Participants:', participants);

    // Validate participants against the group
    const validParticipants = participants.filter((id) =>
      groupParticipantIds.includes(String(id))
    );

    console.log('Valid Participants:', validParticipants);

    if (validParticipants.length === 0) {
      return res.status(400).json({
        message: 'No valid participants found in the group.',
      });
    }

    // Validate and filter splitDetails
    const validSplitDetails = splitDetails.filter((detail) =>
      validParticipants.includes(String(detail.participant))
    );

    console.log('Valid Split Details:', validSplitDetails);

    if (validSplitDetails.length !== validParticipants.length) {
      return res.status(400).json({
        message: 'Split details do not match the valid participants.',
      });
    }

    // Format participants for the expense
    const formattedParticipants = validParticipants.map((userId) => ({
      user: userId,
      hasPaid: false,
      amountPaid: 0,
    }));

    // Create a new expense with splitDetails
    const newExpense = new Expense({
      expenseName,
      amount,
      payer,
      participants: formattedParticipants,
      group: groupId,
      splitDetails: validSplitDetails,
    });

    // Save the expense to the database
    const savedExpense = await newExpense.save();

    // Update payer's and participants' expense references
    await User.findByIdAndUpdate(payer, { $push: { expenses: savedExpense._id } });

    for (const participantId of validParticipants) {
      await User.findByIdAndUpdate(participantId, { $push: { expenses: savedExpense._id } });
    }

    // Populate the expense for detailed response
    const populatedExpense = await Expense.findById(savedExpense._id)
      .populate('payer', 'name email')
      .populate('participants.user', 'name email')
      .populate('splitDetails.participant', 'name email');

    res.status(201).json({
      message: 'Payment verified, and expense added successfully.',
      expense: populatedExpense,
    });
  } catch (error) {
    console.error('Error in confirmPaymentAndAddExpense:', error.message);
    res.status(500).json({
      message: 'Server error. Please try again later.',
      error: error.message,
    });
  }
};





  exports.getData = async (req, res) => {
    try {
      // Fetch all expenses from the database
      const expenses = await Expense.find();
      
      // Respond with the data
      res.status(200).json({
        success: true,
        expenses,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch data',
      });
    }
  };



  exports.getExpenseDetail = async (req, res) => {
    const { expenseId } = req.params;

    try {
        // Retrieve the PaymentIntent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(expenseId);

        if (!paymentIntent) {
            return res.status(404).json({ error: 'PaymentIntent not found' });
        }

        const charges = paymentIntent.charges.data || [];
        const paymentStatus = charges.map((charge) => ({
            participant: charge.billing_details.name || 'Unknown',
            status: charge.status,
            amountPaid: charge.amount / 100, // Convert from smallest currency unit
        }));

        // Extract split details from metadata if available
        const splitDetails = paymentIntent.metadata?.splitDetails
            ? JSON.parse(paymentIntent.metadata.splitDetails)
            : [];

        res.json({ paymentStatus, splitDetails });
    } catch (error) {
        console.error('Error fetching expense details:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve expense details',
            details: error.message,
        });
    }
};


