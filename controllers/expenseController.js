const Expense = require("../models/Expense");
const Group = require("../models/Group");
const User = require("../models/User");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
const ethers = require('ethers');

exports.addExpense = async (req, res) => {
  try {
    const { expenseName, amount, payer, participants, groupId } = req.body;

    console.log("Received Request Body:", req.body);

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

    const groupExists = await Group.findById(groupId);
    if (!groupExists) {
      return res.status(404).json({ message: `Group with ID "${groupId}" not found.` });
    }

    const formattedParticipants = participants.map((userId) => ({
      user: userId,
      hasPaid: false,
      amountPaid: 0,
    }));

    const newExpense = new Expense({
      expenseName,
      amount,
      payer,
      participants: formattedParticipants,
      group: groupId,
      paymentIntentId: req.body.paymentIntentId || null,
      splitDetails: req.body.splitDetails || [],
      ipfsHash: req.body.ipfsHash || null,
      transactionHash: req.body.transactionHash || null,
    });

    const savedExpense = await newExpense.save();

    await User.findByIdAndUpdate(payer, {
      $push: { expenses: savedExpense._id },
    });

    for (const participant of participants) {
      await User.findByIdAndUpdate(participant, {
        $push: { expenses: savedExpense._id },
      });
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
      ipfsHash,
      transactionHash,
    } = req.body;

    console.log("Received request:", req.body);

    if (!paymentIntentId) {
      return res.status(400).json({
        message: "PaymentIntentId is required for verification.",
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      console.error("Invalid or incomplete payment intent:", paymentIntent);
      return res.status(400).json({
        message: "Payment not successful. Expense will not be added.",
      });
    }

    console.log("PaymentIntent verified:", paymentIntent);

    const formattedParticipants = participants.map((userId) => ({
      user: userId,
      hasPaid: false,
      amountPaid: 0,
    }));

    const newExpense = new Expense({
      expenseName,
      amount,
      payer,
      participants: formattedParticipants,
      group: groupId,
      splitDetails,
      ipfsHash,
      transactionHash,
      paymentIntentId,
    });

    const savedExpense = await newExpense.save();

    await User.findByIdAndUpdate(payer, {
      $push: { expenses: savedExpense._id },
    });

    for (const participant of participants) {
      await User.findByIdAndUpdate(participant, {
        $push: { expenses: savedExpense._id },
      });
    }

    const populatedExpense = await Expense.findById(savedExpense._id)
      .populate("payer", "name email")
      .populate("participants.user", "name email")
      .populate("splitDetails.participant", "name email");

    res.status(201).json({
      message: "Payment verified, and expense added successfully.",
      expense: populatedExpense,
    });
  } catch (error) {
    console.error("Error in payment confirmation and expense creation:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: error.message,
    });
  }
};

exports.getData = async (req, res) => {
  try {
    const expenses = await Expense.find();

    res.status(200).json({
      success: true,
      expenses,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
    });
  }
};

exports.getExpenseDetail = async (req, res) => {
  const { expenseId } = req.params;

  try {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const paymentIntentId = expense.paymentIntentId;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "PaymentIntentId not found in expense." });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) {
      return res.status(404).json({ error: "PaymentIntent not found" });
    }

    const charges = paymentIntent.charges.data || [];
    const paymentStatus = charges.map((charge) => ({
      participant: charge.billing_details.name || "Unknown",
      status: charge.status,
      amountPaid: charge.amount / 100,
    }));

    const splitDetails = paymentIntent.metadata?.splitDetails
      ? JSON.parse(paymentIntent.metadata.splitDetails)
      : [];

    res.json({ paymentStatus, splitDetails });
  } catch (error) {
    console.error("Error fetching expense details:", error.message);
    res.status(500).json({
      error: "Failed to retrieve expense details",
      details: error.message,
    });
  }
};

exports.deleteExpense = async (req, res) => {
  const { expenseId } = req.params;

  try {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    for (const participant of expense.participants) {
      await User.findByIdAndUpdate(participant.user, {
        $pull: { expenses: expenseId },
      });
    }

    await User.findByIdAndUpdate(expense.payer, {
      $pull: { expenses: expenseId },
    });

    await Expense.findByIdAndDelete(expenseId);

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error.message);
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: error.message,
    });
  }
};

exports.getExpenseById = async (req, res) => {
  const { expenseId } = req.params;

  try {
    const expense = await Expense.findById(expenseId)
      .populate("payer", "name")
      .populate("participants.user", "name")
      .lean();

    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    expense.paymentHistory = await fetchPaymentHistory(expense);

    res.status(200).json({ expense });
  } catch (error) {
    console.error("Error fetching expense:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const fetchPaymentHistory = async (expense) => {
  const paymentIntentId = expense.paymentIntentId;
  if (!paymentIntentId) return [];

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const charges = paymentIntent.charges.data;

  return charges.map((charge) => ({
    participantName: charge.billing_details.name || "Unknown",
    status: charge.status,
    amountPaid: charge.amount / 100,
    date: new Date(charge.created * 1000),
  }));
};

exports.storeData = async (req, res, wallet, provider) => {
  try {
    const data = req.body;

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: data,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretApiKey,
        },
      }
    );

    const ipfsHash = response.data.IpfsHash;
    console.log('Data pinned to IPFS with hash:', ipfsHash);

    const contractABI = [];
    const contractAddress = 'YOUR_CONTRACT_ADDRESS';

    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    const tx = await contract.storeExpense(ipfsHash);
    await tx.wait();
    console.log('Data stored on blockchain with transaction hash:', tx.hash);

    res.status(200).json({
      message: 'Data stored successfully.',
      ipfsHash: ipfsHash,
      transactionHash: tx.hash,
    });
  } catch (error) {
    console.error(
      'Error storing data:',
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      message: 'Failed to store data.',
      error: error.message,
    });
  }
};