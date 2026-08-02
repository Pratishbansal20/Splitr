const express = require('express');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { addFriendSchema } = require('../validators/schemas');
const friendsController = require('../controllers/friendsController');
const router = express.Router();

router.get('/', auth, friendsController.listFriends);
router.post('/add', auth, validate(addFriendSchema), friendsController.addFriend);

module.exports = router;
