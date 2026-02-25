const express = require('express');
const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware'); // Import auth middleware
const router = express.Router();

router.post('/create', auth, async (req, res) => {
  const { name, members } = req.body;

  // Validation
  if (!name || !members) {
    return res.status(400).json({ error: "Name and members are required" });
  }

  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: "Members must be a non-empty array" });
  }

  // Validate each member ID format
  const validMembers = members.every(id => mongoose.Types.ObjectId.isValid(id));
  if (!validMembers) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    // Verify members exist
    const usersExist = await User.countDocuments({ _id: { $in: members } });
    if (usersExist !== members.length) {
      return res.status(404).json({ error: "One or more users not found" });
    }

    // Ensure creator is a member
    const uniqueMembers = [...new Set([...members, req.user.id])];

    // Create group
    const group = new Group({ name, members: uniqueMembers });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const Expense = require('../models/Expense'); // Import Expense

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    // Find groups where user is a member
    const groups = await Group.find({ members: userId }).populate('members', 'name email');

    // Calculate balance for each group
    const groupsWithBalance = await Promise.all(groups.map(async (group) => {
      const expenses = await Expense.find({ group: group._id });
      let myBalance = 0;
      const balanceMap = {}; // userId -> amount (positive = they owe me)

      expenses.forEach(exp => {
        const payerId = exp.paidBy.toString();

        // Calculate Member-to-Member Balances (Who owes whom)
        if (payerId === userId) {
          // I paid. Others owe me their share.
          exp.split.forEach(s => {
            if (s.user.toString() !== userId) {
              balanceMap[s.user.toString()] = (balanceMap[s.user.toString()] || 0) + s.share;
            }
          });
        } else {
          // Someone else paid. If I'm in the split, I owe them (reduce my "credit" with them).
          const mySplit = exp.split.find(s => s.user.toString() === userId);
          if (mySplit) {
            balanceMap[payerId] = (balanceMap[payerId] || 0) - mySplit.share;
          }
        }

        // Calculate My Net Balance (What I get back vs what I owe in total)
        // Formula: (Amount I Paid) - (My Share of Expense)
        if (payerId === userId) {
          myBalance += exp.amount;
        }

        const mySplit = exp.split.find(s => s.user.toString() === userId);
        if (mySplit) {
          myBalance -= mySplit.share;
        }
      });

      // Format balanceMap to details
      const memberDetails = group.members
        .filter(m => m._id.toString() !== userId)
        .map(m => ({
          id: m._id,
          name: m.name,
          amount: balanceMap[m._id.toString()] || 0
        }));

      return { ...group.toObject(), myBalance, memberDetails };
    }));

    res.json(groupsWithBalance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group details
router.get('/:id', auth, async (req, res) => {
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

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    const group = await Group.findById(id)
      .populate('members', 'name email')
      .populate('expenses');

    if (!group) return res.status(404).json({ error: "Group not found" });

    // Check if user is member
    if (!group.members.some(m => m._id.toString() === req.user.id)) {
      return res.status(403).json({ error: "Not a member" });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update group name or members
router.put('/:id', auth, async (req, res) => {
  const groupId = req.params.id;
  const { name, members } = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ error: "Invalid group ID" });
  }

  // Optional: Validate members array if provided
  if (members && (!Array.isArray(members) || !members.every(id => mongoose.Types.ObjectId.isValid(id)))) {
    return res.status(400).json({ error: "Invalid member ID(s)" });
  }



  try {
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $set: { ...(name && { name }), ...(members && { members }) } },
      { new: true }
    ).populate('members', 'name email');
    if (!updatedGroup) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a group
router.delete('/:id', auth, async (req, res) => {
  const groupId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ error: "Invalid group ID" });
  }

  try {
    const deletedGroup = await Group.findByIdAndDelete(groupId);
    if (!deletedGroup) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




module.exports = router;
