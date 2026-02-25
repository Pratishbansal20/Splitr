// models/Expense.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // Optional for non-group expenses
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  type: { type: String, enum: ['EXPENSE', 'SETTLEMENT'], default: 'EXPENSE' },
  split: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    share: { type: Number }
  }],
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
