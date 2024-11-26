const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    groupName: { type: String, required: true },
    participants: [
        {
            user: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'User', 
                required: true 
            }
        }
    ],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Group', groupSchema);
