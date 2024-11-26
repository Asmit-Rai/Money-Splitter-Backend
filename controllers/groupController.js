const Group = require('../models/Group');
const mongoose = require('mongoose');
const User = require('../models/User')


exports.addGroup = async (req, res) => {
  const { email, groupName, participants } = req.body;

  if (!email || !groupName || !participants || participants.length === 0) {
    return res.status(400).json({ message: 'Group name and participants are required.' });
  }

  try {
    // Find the creator
    const creator = await User.findOne({ email });
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found.' });
    }

    // Create the new group
    const newGroup = new Group({
      groupName,
      participants: participants.map((p) => ({ name: p.name, email: p.email })),
    });

    const savedGroup = await newGroup.save();

    // Add the group to the creator's user record
    if (!creator.groups.includes(savedGroup._id)) {
      creator.groups.push(savedGroup._id);
      await creator.save();
    }

    // Handle participants
    const nonExistentEmails = [];
    for (const participant of participants) {
      const user = await User.findOne({ email: participant.email });
      if (user) {
        if (!user.groups.includes(savedGroup._id)) {
          user.groups.push(savedGroup._id);
          await user.save(); // Save updated user record
        }
      } else {
        nonExistentEmails.push(participant.email);
      }
    }

    // Return success response
    return res.status(201).json({
      message: 'Group created successfully',
      group: savedGroup,
      nonExistentEmails, // Notify frontend of any missing users
    });
  } catch (error) {
    console.error('Error saving group:', error.message);
    return res.status(500).json({ message: 'Error saving group', error: error.message });
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

    res.status(200).json(user.groups);
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