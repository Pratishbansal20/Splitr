// models/Expense.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null }, // Optional for non-group expenses
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // legacy rupee field, kept until the frontend speaks cents (see amountCents)
  amountCents: { type: Number, min: 0 },
  description: { type: String },
  type: { type: String, enum: ['EXPENSE', 'SETTLEMENT'], default: 'EXPENSE' },
  split: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    share: { type: Number }, // legacy rupee field, kept until the frontend speaks cents (see shareCents)
    shareCents: { type: Number, min: 0 }
  }],
}, { timestamps: true });

expenseSchema.index({ group: 1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ 'split.user': 1 });

module.exports = mongoose.model('Expense', expenseSchema);
