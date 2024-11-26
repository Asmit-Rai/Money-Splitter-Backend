const Group = require('../models/Group');
const mongoose = require('mongoose');
const User = require('../models/User')


exports.addExpense = async (req, res) => {
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



exports.getData = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required to fetch groups.' });
  }

  try {
    const user = await User.findOne({ email }).populate('groups');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ userId: user._id, groups: user.groups });
  } catch (error) {
    console.error('Error fetching groups:', error.message);
    res.status(500).json({ message: 'Error fetching groups', error: error.message });
  }
};



// Delete a group by ID
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group ID' });
    }

    const deletedGroup = await Group.findByIdAndDelete(id);

    if (!deletedGroup) {
      return res.status(404).json({ message: 'Group not found or already deleted.' });
    }

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error.message);
    res.status(500).json({ message: 'Error deleting group', error: error.message });
  }
};

exports.getId =  async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate({
        path: 'expenses',
        populate: {
          path: 'payer', // Populate payer details
          select: 'name email', // Select only required fields
        },
      });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};