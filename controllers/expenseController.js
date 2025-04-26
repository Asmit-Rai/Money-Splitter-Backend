const Expense = require("../models/Expense");
const Group = require("../models/Group");
const User = require("../models/User");

exports.addExpense = async (req, res) => {
  try {
    const { expenseName, amount, payer, participants, groupId, splitDetails } = req.body;

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
      splitDetails: splitDetails || [],
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

    res.status(200).json({ expense });
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

    res.status(200).json({ expense });
  } catch (error) {
    console.error("Error fetching expense:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};
