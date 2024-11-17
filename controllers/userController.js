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
