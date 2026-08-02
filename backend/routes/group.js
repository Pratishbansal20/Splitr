const express = require('express');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createGroupSchema, updateGroupSchema } = require('../validators/schemas');
const groupController = require('../controllers/groupController');
const router = express.Router();

router.post('/create', auth, validate(createGroupSchema), groupController.createGroup);
router.get('/', auth, groupController.listGroups);
router.get('/:id', auth, groupController.getGroupById);
router.put('/:id', auth, validate(updateGroupSchema), groupController.updateGroup);
router.delete('/:id', auth, groupController.deleteGroup);

module.exports = router;
