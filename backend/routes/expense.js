const express = require('express');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User'); // Add User model
const router = express.Router();

router.post('/add', async (req, res) => {
  const { group, paidBy, amount, description, split } = req.body;

  // Validation
  const requiredFields = ['group', 'paidBy', 'amount', 'split'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: `Missing required fields: ${missingFields.join(', ')}` 
    });
  }

  if (!Array.isArray(split) || split.length === 0) {
    return res.status(400).json({ error: "Split must be a non-empty array" });
  }

  // Validate ObjectId formats
  const validIds = [
    mongoose.Types.ObjectId.isValid(group),
    mongoose.Types.ObjectId.isValid(paidBy),
    ...split.map(s => mongoose.Types.ObjectId.isValid(s.user))
  ].every(valid => valid);

  if (!validIds) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  try {
    // Verify existence of references
    const [groupExists, payerExists] = await Promise.all([
      Group.exists({ _id: group }),
      User.exists({ _id: paidBy })
    ]);

    if (!groupExists || !payerExists) {
      return res.status(404).json({ error: "Group or payer not found" });
    }

    // Create expense
    const expense = new Expense({ group, paidBy, amount, description, split });
    await expense.save();

    // Update group
    await Group.findByIdAndUpdate(group, { $push: { expenses: expense._id } });
    
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all expenses (with populated references)
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('group', 'name')
      .populate('paidBy', 'name email')
      .populate('split.user', 'name email');
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an expense
router.put('/:id', async (req, res) => {
  const expenseId = req.params.id;
  const { amount, description, split } = req.body;

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      { $set: { ...(amount && { amount }), ...(description && { description }), ...(split && { split }) } },
      { new: true }
    )
      .populate('group', 'name')
      .populate('paidBy', 'name email')
      .populate('split.user', 'name email');
    if (!updatedExpense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  const expenseId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  try {
    const deletedExpense = await Expense.findByIdAndDelete(expenseId);
    if (!deletedExpense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    // Optionally, remove from group's expenses array
    await Group.updateMany({}, { $pull: { expenses: expenseId } });

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
