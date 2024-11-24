const Group = require('../models/Group');
const User = require('../models/User');
const mongoose = require('mongoose');

// Add a new group
exports.addGroup = async (req, res) => {
  const { email, groupName, participants } = req.body;

  // Validate request data
  if (!email || !groupName || !participants || participants.length === 0) {
    return res.status(400).json({ message: 'Group name and participants are required.' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if participants exist in the database
    const participantIds = [];
    for (const participant of participants) {
      const participantUser = await User.findOne({ email: participant.email });
      if (!participantUser) {
        return res.status(404).json({ message: `Participant not found: ${participant.email}` });
      }
      participantIds.push(participantUser._id); // Add participant IDs to the list
    }

    // Create the group
    const newGroup = new Group({
      groupName,
      participants: participantIds, // Use participant IDs from the User collection
    });

    const savedGroup = await newGroup.save();

    // Associate the group with the user who created it
    user.groups.push(savedGroup._id);
    await user.save();

    return res.status(201).json({ message: 'Group created successfully', group: savedGroup });
  } catch (error) {
    console.error('Error saving group:', error.message);
    return res.status(500).json({ message: 'Error saving group', error: error.message });
  }
};

// Fetch all groups for a user
exports.getData = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email is required to fetch groups." });
  }

  try {
    // Find the user and populate the groups they are part of
    const user = await User.findOne({ email }).populate({
      path: "groups",
      populate: {
        path: "participants", // Populate participant details in each group
        select: "name email", // Select only relevant fields
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ groups: user.groups });
  } catch (error) {
    console.error("Error fetching groups:", error.message);
    return res.status(500).json({ message: "Error fetching groups", error: error.message });
  }
};

// Delete a group by ID
exports.deleteGroup = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid group ID.' });
  }

  try {
    // Find and delete the group
    const deletedGroup = await Group.findByIdAndDelete(id);

    if (!deletedGroup) {
      return res.status(404).json({ message: 'Group not found or already deleted.' });
    }

    // Remove the group from all users' groups array
    await User.updateMany(
      { groups: id },
      { $pull: { groups: id } }
    );

    return res.status(200).json({ message: 'Group deleted successfully.' });
  } catch (error) {
    console.error('Error deleting group:', error.message);
    return res.status(500).json({ message: 'Error deleting group', error: error.message });
  }
};
