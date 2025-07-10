// models/Group.js
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // referencing users
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }], // referencing expenses
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);
