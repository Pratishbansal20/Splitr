const express = require('express');
const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');
const router = express.Router();

router.post('/create', async (req, res) => {
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

    // Create group
    const group = new Group({ name, members });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const groups = await Group.find().populate('members', 'name email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single group by ID
router.get('/:groupId', async (req, res) => {
  const { groupId } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ error: "Invalid group ID" });
  }

  try {
    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update group name or members
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
