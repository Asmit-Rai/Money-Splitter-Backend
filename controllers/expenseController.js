const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

eexports.addExpense = async (req, res) => {
  try {
    const { expenseName, amount, payer, participants, groupId } = req.body;

    console.log("Received Request Body:", req.body);

    // Validate required fields
    if (!expenseName || !amount || !payer || !participants || !groupId) {
      return res.status(400).json({
        message: "All fields are required: expenseName, amount, payer, participants, groupId.",
      });
    }

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        message: "Participants should be a non-empty array of user IDs.",
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount. Must be a positive number." });
    }

    // Validate group existence and participants
    const group = await Group.findById(groupId).populate("participants.user");
    if (!group) {
      return res.status(404).json({ message: `Group with ID "${groupId}" not found.` });
    }

    // Ensure all participants are part of the group
    const validParticipants = [];
    const groupParticipantIds = group.participants.map((p) => String(p.user._id));

    for (const participantId of participants) {
      if (groupParticipantIds.includes(String(participantId))) {
        validParticipants.push(participantId);
      } else {
        console.warn(`Participant with ID "${participantId}" is not part of the group.`);
      }
    }

    if (validParticipants.length === 0) {
      return res.status(400).json({
        message: "No valid participants found in the group.",
      });
    }

    // Format participants array
    const formattedParticipants = validParticipants.map((userId) => ({
      user: userId,
      hasPaid: false,
      amountPaid: 0,
    }));

    // Create a new expense
    const newExpense = new Expense({
      expenseName,
      amount,
      payer,
      participants: formattedParticipants,
      group: groupId,
    });

    const savedExpense = await newExpense.save();

    // Update the payer's and participants' expense references
    await User.findByIdAndUpdate(payer, { $push: { expenses: savedExpense._id } });

    for (const participantId of validParticipants) {
      await User.findByIdAndUpdate(participantId, { $push: { expenses: savedExpense._id } });
    }

    res.status(201).json({
      message: "Expense added successfully.",
      expense: savedExpense,
    });
  } catch (error) {
    console.error("Error adding expense:", error.message);
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: error.message,
    });
  }
};



exports.confirmPaymentAndAddExpense = async (req, res) => {
  try {
    const {
      expenseName,
      amount,
      payer,
      participants,
      groupId,
      paymentIntentId,
      splitDetails,
    } = req.body;

    console.log("Received request for expense:", req.body);

    if (!paymentIntentId) {
      return res.status(400).json({
        message: "PaymentIntentId is required for verification.",
      });
    }

    // Retrieve and validate the PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      console.error("Invalid or incomplete payment intent:", paymentIntent);
      return res.status(400).json({
        message: "Payment not successful. Expense will not be added.",
      });
    }

    console.log("PaymentIntent verified:", paymentIntent);

    // Validate Payer
    const payerUser = await User.findById(payer);
    if (!payerUser) {
      return res.status(404).json({
        message: `Payer with ID "${payer}" not found.`,
      });
    }

    // Validate Group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        message: `Group with ID "${groupId}" not found.`,
      });
    }

    // Validate Participants
    const validParticipants = [];
    for (const participantId of participants) {
      const participant = await User.findById(participantId);
      if (!participant) {
        console.warn(`Participant with ID "${participantId}" not found.`);
        continue;
      }
      validParticipants.push(participantId);
    }

    if (validParticipants.length === 0) {
      return res.status(400).json({
        message: "No valid participants found.",
      });
    }

    // Prepare Participants Array
    const formattedParticipants = validParticipants.map((userId) => ({
      user: userId,
      hasPaid: false,
      amountPaid: 0,
    }));

    // Create Expense
    const newExpense = new Expense({
      expenseName,
      amount,
      payer,
      participants: formattedParticipants,
      group: groupId,
      splitDetails,
    });

    const savedExpense = await newExpense.save();

    // Update Payer's Expenses
    if (!payerUser.expenses.includes(savedExpense._id)) {
      payerUser.expenses.push(savedExpense._id);
      await payerUser.save();
    }

    // Update Participants' Expenses
    for (const participantId of validParticipants) {
      await User.findByIdAndUpdate(participantId, {
        $push: { expenses: savedExpense._id },
      });
    }

    console.log("Expense added successfully:", savedExpense);

    // Populate and Return Response
    const populatedExpense = await Expense.findById(savedExpense._id)
      .populate("payer", "name email")
      .populate("participants.user", "name email")
      .populate("splitDetails.participant", "name email");

    res.status(201).json({
      message: "Payment verified, and expense added successfully.",
      expense: populatedExpense,
    });
  } catch (error) {
    console.error("Error in confirmPaymentAndAddExpense:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
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

exports.deleteExpense = async (req, res) => {
  const { expenseId } = req.params;

  try {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Remove the expense from the participants' expenses array
    for (const participant of expense.participants) {
      await User.findByIdAndUpdate(participant.user, { $pull: { expenses: expenseId } });
    }

    // Remove the expense from the payer's expenses array
    await User.findByIdAndUpdate(expense.payer, { $pull: { expenses: expenseId } });

    // Delete the expense
    await Expense.findByIdAndDelete(expenseId);

    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.', error: error.message });
  }
};