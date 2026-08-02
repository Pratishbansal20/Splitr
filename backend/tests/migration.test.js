const Expense = require('../models/Expense');
const User = require('../models/User');
const { migrate } = require('../scripts/migrate-amount-to-cents');

async function makeUser(name) {
  const user = new User({
    name,
    email: `${name}${Date.now()}${Math.random()}@example.com`,
    password: 'hashed-password',
  });
  await user.save();
  return user;
}

describe('migrate-amount-to-cents', () => {
  it('backfills amountCents/shareCents so shares sum exactly, including the 100/3 remainder case', async () => {
    const alice = await makeUser('alice');
    const bob = await makeUser('bob');
    const carol = await makeUser('carol');

    const expense = new Expense({
      paidBy: alice._id,
      amount: 100,
      description: 'Dinner',
      split: [
        { user: alice._id, share: 33.33 },
        { user: bob._id, share: 33.33 },
        { user: carol._id, share: 33.33 },
      ],
    });
    await expense.save();

    const result = await migrate({ dryRun: false });
    expect(result.migrated).toBe(1);
    expect(result.failures).toHaveLength(0);

    const updated = await Expense.findById(expense._id);
    expect(updated.amountCents).toBe(10000);
    const sum = updated.split.reduce((s, x) => s + x.shareCents, 0);
    expect(sum).toBe(10000);
  });

  it('is idempotent — a second run migrates nothing further and leaves values unchanged', async () => {
    const alice = await makeUser('alice2');
    const expense = new Expense({
      paidBy: alice._id,
      amount: 50,
      split: [{ user: alice._id, share: 50 }],
    });
    await expense.save();

    await migrate({ dryRun: false });
    const firstPass = await Expense.findById(expense._id);

    const second = await migrate({ dryRun: false });
    expect(second.migrated).toBe(0);

    const secondPass = await Expense.findById(expense._id);
    expect(secondPass.amountCents).toBe(firstPass.amountCents);
    expect(secondPass.split[0].shareCents).toBe(firstPass.split[0].shareCents);
  });

  it('isolates a document with a missing/non-numeric split share as a failure instead of aborting the whole run', async () => {
    const alice = await makeUser('alice4');
    const bob = await makeUser('bob4');

    // Mirrors real corrupt data found in production: split entries with no `share` at all.
    const badExpense = new Expense({
      paidBy: alice._id,
      amount: 20,
      split: [{ user: alice._id }, { user: bob._id }],
    });
    await badExpense.save();

    const goodExpense = new Expense({
      paidBy: alice._id,
      amount: 40,
      split: [{ user: alice._id, share: 20 }, { user: bob._id, share: 20 }],
    });
    await goodExpense.save();

    const result = await migrate({ dryRun: false });
    expect(result.migrated).toBe(1);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].id).toBe(badExpense._id.toString());

    const stillUnmigrated = await Expense.findById(badExpense._id);
    expect(stillUnmigrated.amountCents).toBeUndefined();

    const migratedGood = await Expense.findById(goodExpense._id);
    expect(migratedGood.amountCents).toBe(4000);
  });

  it('dry-run mode reports what would change without writing anything', async () => {
    const alice = await makeUser('alice3');
    const expense = new Expense({
      paidBy: alice._id,
      amount: 20,
      split: [{ user: alice._id, share: 20 }],
    });
    await expense.save();

    const result = await migrate({ dryRun: true });
    expect(result.migrated).toBe(1);

    const stillUnmigrated = await Expense.findById(expense._id);
    expect(stillUnmigrated.amountCents).toBeUndefined();
  });
});
