const express = require('express');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { addExpenseSchema, updateExpenseSchema } = require('../validators/schemas');
const expenseController = require('../controllers/expenseController');
const router = express.Router();

router.post('/add', auth, validate(addExpenseSchema), expenseController.addExpense);
router.get('/group/:groupId', auth, expenseController.getExpensesForGroup);
router.get('/activity', auth, expenseController.getActivity);
router.put('/:id', auth, validate(updateExpenseSchema), expenseController.updateExpense);
router.delete('/:id', auth, expenseController.deleteExpense);

module.exports = router;
