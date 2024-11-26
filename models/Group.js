const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  participants: [
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Group',groupSchema);