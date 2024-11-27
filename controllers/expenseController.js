// controllers/expenseController.js

const Expense = require("../models/Expense");
const Group = require("../models/Group");
const User = require("../models/User");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pinataSDK = require('@pinata/sdk'); // Import Pinata SDK correctly
const ethers = require('ethers');

// Initialize Pinata SDK
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);

// Add Expense
exports.addExpense = async (req, res) => {
  try {
    const { expenseName, amount, payer, participants, groupId } = req.body;

    // Log incoming data for debugging
    console.log("Received Request Body:", req.body);

    // Validate required fields
    if (!expenseName || !amount || !payer || !participants || !groupId) {
      return res.status(400).json({
        message:
          "All fields are required: expenseName, amount, payer, participants, groupId.",
      });
    }

    // Validate participants as an array
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        message: "Participants should be a non-empty array of user IDs.",
      });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid amount. Must be a positive number." });
    }

    // Validate group existence
    const groupExists = await Group.findById(groupId);
    if (!groupExists) {
      return res
        .status(404)
        .json({ message: `Group with ID "${groupId}" not found.` });
    }

    // Format participants
    const formattedParticipants = participants.map((userId) => ({
      user: userId, // Ensure userId is passed as ObjectId
      hasPaid: false, // Default to false
      amountPaid: 0, // Initialize amountPaid
    }));

    // Create a new expense
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

    // Save the expense to the database
    const savedExpense = await newExpense.save();

    // Update the payer's expenses array
    await User.findByIdAndUpdate(payer, {
      $push: { expenses: savedExpense._id },
    });

    // Update each participant's expenses array
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

// Confirm Payment and Add Expense
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

    // Retrieve the PaymentIntent using the ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      console.error("Invalid or incomplete payment intent:", paymentIntent);
      return res.status(400).json({
        message: "Payment not successful. Expense will not be added.",
      });
    }

    console.log("PaymentIntent verified:", paymentIntent);

    // Prepare participants array
    const formattedParticipants = participants.map((userId) => ({
      user: userId,
      hasPaid: false,
      amountPaid: 0,
    }));

    // Create a new expense with splitDetails and IPFS info
    const newExpense = new Expense({
      expenseName,
      amount,
      payer,
      participants: formattedParticipants,
      group: groupId,
      splitDetails,
      ipfsHash, // Store IPFS hash
      transactionHash, // Store blockchain transaction hash
      paymentIntentId, // Store PaymentIntentId
    });

    // Save the expense and populate references
    const savedExpense = await newExpense.save();

    // Update the payer's expenses array
    await User.findByIdAndUpdate(payer, {
      $push: { expenses: savedExpense._id },
    });

    // Update each participant's expenses array
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

// Store Data on IPFS and Blockchain
exports.storeData = async (req, res, wallet, provider) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Data is required.' });
    }

    // Check wallet balance
    const balance = await wallet.getBalance();
    console.log(`Wallet balance: ${ethers.utils.formatEther(balance)} ETH`);
    if (balance.isZero()) {
      return res.status(400).json({ message: 'Insufficient wallet balance for transaction.' });
    }

    // Pin JSON to IPFS using Pinata SDK
    let pinataResult;
    try {
      pinataResult = await pinata.pinJSONToIPFS(data);
      console.log('Data pinned to IPFS with CID:', pinataResult.IpfsHash);
    } catch (pinataError) {
      console.error('Pinata SDK Error:', pinataError);
      return res.status(500).json({
        message: 'Failed to pin data to IPFS.',
        error: pinataError.message,
      });
    }

    const ipfsHash = pinataResult.IpfsHash;

    // Store the IPFS hash on the blockchain
    const tx = {
      to: wallet.address, // Sending to self; modify if needed
      value: ethers.utils.parseEther('0.0'), // Sending 0 Ether
      data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(ipfsHash)),
      gasLimit: 100000, // Adjust gas limit as needed
    };

    // Estimate gas price
    const gasPrice = await provider.getGasPrice();
    tx.gasPrice = gasPrice;

    let transactionResponse;
    try {
      transactionResponse = await wallet.sendTransaction(tx);
      console.log('Transaction sent:', transactionResponse.hash);
    } catch (txError) {
      console.error('Blockchain Transaction Error:', txError);
      return res.status(500).json({
        message: 'Failed to send transaction to blockchain.',
        error: txError.message,
      });
    }

    let receipt;
    try {
      receipt = await transactionResponse.wait();
      console.log('Transaction mined:', receipt.transactionHash);
    } catch (receiptError) {
      console.error('Transaction Receipt Error:', receiptError);
      return res.status(500).json({
        message: 'Failed to retrieve transaction receipt.',
        error: receiptError.message,
      });
    }

    res.status(200).json({
      message: 'Data stored on IPFS and blockchain successfully.',
      ipfsHash,
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    console.error('Error in storeData:', error);
    res.status(500).json({ message: 'Failed to store data.', error: error.message });
  }
};
