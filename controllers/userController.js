const User = require('../models/User');

exports.addUser = async (req, res) => {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Create a new user
        const newUser = new User({ email, password });
        const savedUser = await newUser.save();

        // Return success response
        return res.status(201).json({ message: 'User created successfully', user: savedUser });
    } catch (error) {
        console.error('Error in Creating User:', error.message);
        return res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
};

exports.getUserById = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        return res.status(200).json({ name: user.name });
    } catch (error) {
        console.error('Error fetching user:', error.message);
        return res.status(500).json({ error: 'Failed to fetch user', details: error.message });
    }
};