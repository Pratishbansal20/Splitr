const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const { toCents, reconcileShareCents } = require('../services/money');

function isAuthorizedForExpense(expense, userId) {
  let isAuthorized = expense.paidBy.toString() === userId;

  if (expense.group && expense.group.members) {
    const isMember = expense.group.members.some(m => m.toString() === userId);
    if (isMember) isAuthorized = true;
  }

  return isAuthorized;
}

async function addExpense(req, res, next) {
  const { group, paidBy, amount, description, split, type } = req.body;

  try {
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

    const amountCents = toCents(amount);
    const reconciled = reconcileShareCents(amountCents, split);

    const expense = new Expense({ group: group || null, paidBy, amount, description, split, type: type || 'EXPENSE', amountCents });
    expense.split.forEach((s, i) => { s.shareCents = reconciled[i].shareCents; });
    await expense.save();

    if (group) {
      await Group.findByIdAndUpdate(group, { $push: { expenses: expense._id } });
    }

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
}

async function getExpensesForGroup(req, res, next) {
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
    next(error);
  }
}

async function updateExpense(req, res, next) {
  const expenseId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  try {
    const expense = await Expense.findById(expenseId).populate('group');
    if (!expense) return res.status(404).json({ error: "Expense not found" });

    if (!isAuthorizedForExpense(expense, req.user.id)) {
      return res.status(403).json({ error: "Not authorized to edit this expense" });
    }

    const { description, amount, split } = req.body;
    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (split) expense.split = split;

    if (amount || split) {
      const amountCents = toCents(expense.amount);
      const reconciled = reconcileShareCents(amountCents, expense.split.map((s) => ({ share: s.share })));
      expense.amountCents = amountCents;
      expense.split.forEach((s, i) => { s.shareCents = reconciled[i].shareCents; });
    }

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('group', 'name')
      .populate('paidBy', 'name email')
      .populate('split.user', 'name email');

    res.json(populated);
  } catch (error) {
    next(error);
  }
}

async function deleteExpense(req, res, next) {
  const expenseId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  try {
    const expense = await Expense.findById(expenseId).populate('group');
    if (!expense) return res.status(404).json({ error: "Expense not found" });

    if (!isAuthorizedForExpense(expense, req.user.id)) {
      return res.status(403).json({ error: "Not authorized to delete this expense" });
    }

    await expense.deleteOne();

    if (expense.group) {
      await Group.findByIdAndUpdate(expense.group._id, { $pull: { expenses: expense._id } });
    }

    res.json({ message: "Expense deleted" });
  } catch (error) {
    next(error);
  }
}

async function getActivity(req, res, next) {
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
    next(error);
  }
}

module.exports = {
  addExpense,
  getExpensesForGroup,
  updateExpense,
  deleteExpense,
  getActivity,
};
