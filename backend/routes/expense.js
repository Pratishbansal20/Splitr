const express = require('express');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User'); // Add User model
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/add', auth, async (req, res) => {
  const { group, paidBy, amount, description, split, type } = req.body;

  // Validation
  // Group is optional now
  const requiredFields = ['paidBy', 'amount', 'split'];
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
    (!group || mongoose.Types.ObjectId.isValid(group)), // Optional group
    mongoose.Types.ObjectId.isValid(paidBy),
    ...split.map(s => mongoose.Types.ObjectId.isValid(s.user))
  ].every(valid => valid);

  if (!validIds) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  try {
    // Verify existence of references
    const [payerExists] = await Promise.all([
      User.exists({ _id: paidBy })
    ]);

    if (group) {
      const groupExists = await Group.exists({ _id: group });
      if (!groupExists) return res.status(404).json({ error: "Group not found" });
    }

    if (!payerExists) {
      return res.status(404).json({ error: "Payer not found" });
    }

    // Create expense
    const expense = new Expense({ group: group || null, paidBy, amount, description, split, type: type || 'EXPENSE' });
    await expense.save();

    // Update group ONLY if group exists
    if (group) {
      await Group.findByIdAndUpdate(group, { $push: { expenses: expense._id } });
    }

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all expenses (with populated references)
router.get('/group/:groupId', auth, async (req, res) => { // Added auth
  const { groupId } = req.params;

  try {
    let expenses;
    if (groupId === 'nongroup') {
      const userId = req.user.id;
      expenses = await Expense.find({
        group: null,
        $or: [{ paidBy: userId }, { 'split.user': userId }]
      })
        .populate('paidBy', 'name email')
        .populate('split.user', 'name email')
        .sort({ createdAt: -1 });
    } else {
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ error: "Invalid group ID" });
      }
      expenses = await Expense.find({ group: groupId })
        .populate('group', 'name')
        .populate('paidBy', 'name email')
        .populate('split.user', 'name email');
    }
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update an expense
router.put('/:id', auth, async (req, res) => {
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
router.delete('/:id', auth, async (req, res) => {
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

// Get recent activity for the user
router.get('/activity', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user.id },
        { 'split.user': req.user.id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('paidBy', 'name')
      .populate('split.user', 'name')
      .populate('group', 'name');

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('group');
    if (!expense) return res.status(404).json({ error: "Expense not found" });

    // Allow Payer OR Group Members to delete
    // We need to check if the user is a member of the group this expense belongs to
    // Since we populated 'group', we can check expense.group.members

    // Fallback: if group is null (personal expense?), only payer can delete.
    let isAuthorized = expense.paidBy.toString() === req.user.id;

    if (expense.group && expense.group.members) {
      const isMember = expense.group.members.some(m => m.toString() === req.user.id);
      if (isMember) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: "Not authorized to delete this expense" });
    }

    await expense.deleteOne();

    // Remove from group's expenses array if applicable
    if (expense.group) {
      await Group.findByIdAndUpdate(expense.group._id, { $pull: { expenses: expense._id } });
    }

    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an expense
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('group');
    if (!expense) return res.status(404).json({ error: "Expense not found" });

    // Allow Payer OR Group Members to edit
    let isAuthorized = expense.paidBy.toString() === req.user.id;

    if (expense.group && expense.group.members) {
      const isMember = expense.group.members.some(m => m.toString() === req.user.id);
      if (isMember) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: "Not authorized to edit this expense" });
    }

    // Update fields
    const { description, amount, split } = req.body;
    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (split) expense.split = split;

    await expense.save();

    // Return populated expense for frontend consistency
    const populated = await Expense.findById(expense._id)
      .populate('group', 'name')
      .populate('paidBy', 'name email')
      .populate('split.user', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
