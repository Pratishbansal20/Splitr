const { z } = require('zod');
const mongoose = require('mongoose');

const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ID format',
});

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

const splitEntrySchema = z.object({
  user: objectId,
  share: z.number().optional(),
});

const addExpenseSchema = z.object({
  group: objectId.nullish(),
  paidBy: objectId,
  amount: z.number({ error: 'Amount is required' }).positive('Amount must be greater than 0'),
  description: z.string().trim().optional(),
  type: z.enum(['EXPENSE', 'SETTLEMENT']).optional(),
  split: z.array(splitEntrySchema).min(1, 'Split must be a non-empty array'),
});

const updateExpenseSchema = z.object({
  description: z.string().trim().optional(),
  amount: z.number().positive().optional(),
  split: z.array(splitEntrySchema).min(1).optional(),
});

const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  members: z.array(objectId).min(1, 'Members must be a non-empty array'),
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(1).optional(),
  members: z.array(objectId).min(1).optional(),
});

const addFriendSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
  addExpenseSchema,
  updateExpenseSchema,
  createGroupSchema,
  updateGroupSchema,
  addFriendSchema,
};
