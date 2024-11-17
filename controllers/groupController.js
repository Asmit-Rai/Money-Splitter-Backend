const Group = require('../models/Group');
const mongoose = require('mongoose');

exports.addGroup = async (req, res) => {
  const { groupName, participants } = req.body;

  if (!groupName || !participants || participants.length === 0) {
    return res
      .status(400)
      .json({ message: 'Group name and participants are required.' });
  }

  try {
    const newGroup = new Group({
      groupName,
      participants: participants.map((p) => ({ name: p.name, email: p.email })),
    });
    const savedGroup = await newGroup.save();
  } catch (error) {
    console.error('Error saving group:', error.message);
  }
};

// Fetch all groups
exports.getData = async (req, res) => {
  try {
    const groups = await Group.find({});
    res.status(200).json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error.message);
    res
      .status(500)
      .json({ message: 'Error fetching groups', error: error.message });
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