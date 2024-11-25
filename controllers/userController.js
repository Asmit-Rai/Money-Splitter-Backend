const User = require('../models/User');

exports.addUser = async (req, res) => {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, Email, and password are required.' });
    }

    try {
        // Create a new user
        const newUser = new User({ name, email, password });
        const savedUser = await newUser.save();

        // Return success response
        return res.status(201).json({ message: 'User created successfully', user: savedUser });
    } catch (error) {
        console.error('Error in Creating User:', error.message);
        return res.status(500).json({ error: 'Failed to create user', details: error.message });
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