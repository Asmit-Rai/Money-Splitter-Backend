const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  expenseName: { type: String, require: true },
  amount: { type: String, requrie: true },
  payer: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  decentralizedPaymentId: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment' , paymentSchema)