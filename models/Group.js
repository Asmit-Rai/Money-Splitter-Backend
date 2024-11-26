const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  groupName: { type: String, required: true },
  participants: [{ name: String, email: String }],
  expenses: [{ type: Schema.Types.ObjectId, ref: 'Expense' }]
});

module.exports = mongoose.model('Group', groupSchema);