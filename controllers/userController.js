const User = require('../models/User');

exports.addUser = async (req, res) => {
  const { email, password, groups, expenses } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const newUser = new User({ email, password, groups, expenses });
    const savedUser = await newUser.save();
    return res.status(201).json({ message: 'User created successfully', user: savedUser });
  } catch (error) {
    console.error('Error adding user:', error.message);
    return res.status(500).json({ message: 'Error adding user', error: error.message });
  }
};

exports.getUserId = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json({ userId: user._id });
  } catch (error) {
    console.error('Error fetching user ID:', error.message);
    return res.status(500).json({ error: 'Failed to fetch user ID', details: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Fetching user with ID:", id); // Debug log

    const user = await User.findById(id).select('email groups expenses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};