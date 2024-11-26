const User = require('../models/User');

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


exports.getUserId = async (req, res) => {
  const { email } = req.body;

  // Validate input
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Return the user ID
    return res.status(200).json({ userId: user._id });
  } catch (error) {
    console.error('Error in fetching user ID:', error.message);
    return res.status(500).json({ error: 'Failed to fetch user ID', details: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};