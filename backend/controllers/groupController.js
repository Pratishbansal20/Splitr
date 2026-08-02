const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const { computeGroupBalances, fromCents } = require('../services/money');

async function createGroup(req, res, next) {
  const { name, members } = req.body;

  try {
    const usersExist = await User.countDocuments({ _id: { $in: members } });
    if (usersExist !== members.length) {
      return res.status(404).json({ error: "One or more users not found" });
    }

    // Ensure creator is a member
    const uniqueMembers = [...new Set([...members, req.user.id])];

    const group = new Group({ name, members: uniqueMembers });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
}

async function listGroups(req, res, next) {
  try {
    const userId = req.user.id;
    const groups = await Group.find({ members: userId }).populate('members', 'name email');
    const groupIds = groups.map(g => g._id);

    // Single query for all groups' expenses instead of one query per group.
    const allExpenses = await Expense.find({ group: { $in: groupIds } });
    const expensesByGroup = {};
    allExpenses.forEach(exp => {
      const key = exp.group.toString();
      (expensesByGroup[key] = expensesByGroup[key] || []).push(exp);
    });

    const groupsWithBalance = groups.map((group) => {
      const expenses = expensesByGroup[group._id.toString()] || [];
      const { myBalanceCents, balanceMapCents } = computeGroupBalances(expenses, userId);

      const memberDetails = group.members
        .filter(m => m._id.toString() !== userId)
        .map(m => ({
          id: m._id,
          name: m.name,
          amount: fromCents(balanceMapCents[m._id.toString()] || 0)
        }));

      return { ...group.toObject(), myBalance: fromCents(myBalanceCents), memberDetails };
    });

    res.json(groupsWithBalance);
  } catch (error) {
    next(error);
  }
}

async function getGroupById(req, res, next) {
  try {
    if (req.params.id === 'nongroup') {
      const user = await User.findById(req.user.id).populate('friends', 'name email');
      return res.json({
        _id: 'nongroup',
        name: 'Non-Group Expenses',
        members: user.friends, // Use friends as members for selection
        isVirtual: true
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    const group = await Group.findById(id)
      .populate('members', 'name email')
      .populate('expenses');

    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!group.members.some(m => m._id.toString() === req.user.id)) {
      return res.status(403).json({ error: "Not a member" });
    }

    res.json(group);
  } catch (error) {
    next(error);
  }
}

async function updateGroup(req, res, next) {
  const groupId = req.params.id;
  const { name, members } = req.body;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ error: "Invalid group ID" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.some(m => m.toString() === req.user.id)) {
      return res.status(403).json({ error: "Not authorized to update this group" });
    }

    if (name) group.name = name;
    if (members) group.members = members;
    await group.save();

    const populated = await Group.findById(groupId).populate('members', 'name email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
}

async function deleteGroup(req, res, next) {
  const groupId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ error: "Invalid group ID" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.some(m => m.toString() === req.user.id)) {
      return res.status(403).json({ error: "Not authorized to delete this group" });
    }

    await group.deleteOne();

    // Detach the group's expenses rather than leaving them pointing at a
    // deleted group (they fall back to "non-group" expenses, preserving history).
    await Expense.updateMany({ group: groupId }, { $set: { group: null } });

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createGroup,
  listGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
};
