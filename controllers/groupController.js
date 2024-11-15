const Group = require('../models/Group');

// Add a new group
exports.addGroup = async (req, res) => {
  const { groupName, participants } = req.body;

  if (!groupName || !participants || participants.length === 0) {
    return res.status(400).json({ message: 'Group name and participants are required.' });
  }

  try {
    const newGroup = new Group({
      groupName,
      participants: participants.map(p => ({ name: p.name, email: p.email })),
    });
    const savedGroup = await newGroup.save();
    res.status(200).json({ group: savedGroup });
  } catch (error) {
    console.error('Error saving group:', error.message);
    res.status(500).json({ message: 'Error creating group', error: error.message });
  }
};

exports.getData = async (req, res) => {
  try {
    const groups = await Group.find({});
    res.status(200).json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error.message);
    res.status(500).json({ message: 'Error fetching groups', error: error.message });
  }
};