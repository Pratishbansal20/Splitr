const User = require('../models/User');

async function listFriends(req, res, next) {
  try {
    const user = await User.findById(req.user.id).populate('friends', 'name email');
    res.json(user.friends);
  } catch (error) {
    next(error);
  }
}

async function addFriend(req, res, next) {
  const { email } = req.body;

  try {
    const friend = await User.findOne({ email });
    if (!friend) {
      return res.status(404).json({ error: "User not found" });
    }

    if (friend._id.toString() === req.user.id) {
      return res.status(400).json({ error: "You cannot add yourself" });
    }

    const user = await User.findById(req.user.id);

    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ error: "User is already your friend" });
    }

    // Mutual addition (no accept/reject flow) — intentional MVP simplification.
    user.friends.push(friend._id);
    await user.save();

    if (!friend.friends.includes(user._id)) {
      friend.friends.push(user._id);
      await friend.save();
    }

    res.json({ message: "Friend added successfully", friend: { id: friend._id, name: friend.name, email: friend.email } });
  } catch (error) {
    next(error);
  }
}

module.exports = { listFriends, addFriend };
