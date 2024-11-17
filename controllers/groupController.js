const Group = require('../models/Group');
const mongoose = require('mongoose');
const User = require('../models/User')

exports.addGroup = async (req, res) => {
  const { email, groupName, participants } = req.body;

  if (!email || !groupName || !participants || participants.length === 0) {
    return res.status(400).json({ message: 'Group name and participants are required.' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Create the group
    const newGroup = new Group({
      groupName,
      participants: participants.map((p) => ({ name: p.name, email: p.email })),
    });

    const savedGroup = await newGroup.save();

    // Associate the group with the user
    user.groups.push(savedGroup._id);
    await user.save(); // Save the updated user

    return res.status(201).json({ message: 'Group created successfully', group: savedGroup });
  } catch (error) {
    console.error('Error saving group:', error.message);
    return res.status(500).json({ message: 'Error saving group', error: error.message });
  }
};


// Fetch all groups
exports.getData = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required to fetch groups.' });
  }

  try {
    const user = await User.findOne({ email }).populate('groups'); // Populate groups
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json(user.groups);
  } catch (error) {
    console.error('Error fetching groups:', error.message);
    return res.status(500).json({ message: 'Error fetching groups', error: error.message });
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
};0