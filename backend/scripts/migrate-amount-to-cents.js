// One-time backfill: populates amountCents/split[].shareCents on existing
// Expense documents from their legacy float amount/share fields, so every
// document ends up with shares that sum EXACTLY to the total (fixing the
// historical equal-split rounding bug), using the largest-remainder method.
//
// Safe to re-run: already-migrated documents (amountCents already set) are
// excluded at the query level, so running twice is a no-op on the second pass.
//
// Usage:
//   node scripts/migrate-amount-to-cents.js --dry-run   (report only, no writes)
//   node scripts/migrate-amount-to-cents.js              (writes changes)
//
// Take a `mongodump` backup of the real database before running for real —
// this script does not take one for you.

const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const { toCents, reconcileShareCents } = require('../services/money');

const BATCH_SIZE = 500;
// Flag documents whose legacy shares were off from the total by more than
// this many cents per participant — likely genuinely corrupt data, not just
// ordinary float rounding — for manual review rather than silently "fixing".
const SUSPICIOUS_DIFF_PER_PARTICIPANT_CENTS = 50;

async function migrate({ dryRun = false } = {}) {
  const cursor = Expense.find({
    $or: [{ amountCents: { $exists: false } }, { amountCents: null }],
  }).cursor();

  let scanned = 0;
  let migrated = 0;
  const failures = [];
  const flagged = [];
  let batch = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;
    const currentBatch = batch;
    batch = [];

    try {
      await Expense.bulkWrite(currentBatch, { ordered: false });
    } catch (err) {
      // ordered:false means MongoDB already applied every op that didn't
      // fail; retry each individually so we can attribute failures to the
      // specific document rather than losing the whole batch.
      await Promise.all(
        currentBatch.map(async (op) => {
          const id = op.updateOne.filter._id.toString();
          try {
            await Expense.updateOne(op.updateOne.filter, op.updateOne.update);
          } catch (opErr) {
            migrated -= 1;
            failures.push({ id, error: opErr.message });
          }
        })
      );
    }
  };

  for await (const exp of cursor) {
    scanned += 1;

    try {
      const missingShare = exp.split.some((s) => s.share === null || s.share === undefined || Number.isNaN(Number(s.share)));
      if (missingShare) {
        throw new Error('one or more split entries has a missing/non-numeric share');
      }
      if (!Number.isFinite(Number(exp.amount))) {
        throw new Error('amount is missing/non-numeric');
      }

      const amountCents = toCents(exp.amount);
      const rawShares = exp.split.map((s) => ({ user: s.user, share: s.share }));
      const reconciled = reconcileShareCents(amountCents, rawShares);

      if (!Number.isFinite(amountCents) || reconciled.some((r) => !Number.isFinite(r.shareCents))) {
        throw new Error('computed a non-finite amountCents/shareCents');
      }

      const rawSum = rawShares.reduce((sum, s) => sum + Math.round(Number(s.share) * 100), 0);
      const diff = Math.abs(amountCents - rawSum);
      if (diff > exp.split.length * SUSPICIOUS_DIFF_PER_PARTICIPANT_CENTS) {
        flagged.push({ id: exp._id.toString(), amount: exp.amount, diffCents: diff });
      }

      migrated += 1;

      if (dryRun) continue;

      const update = { amountCents };
      reconciled.forEach((r, i) => {
        update[`split.${i}.shareCents`] = r.shareCents;
      });

      batch.push({ updateOne: { filter: { _id: exp._id }, update: { $set: update } } });

      if (batch.length >= BATCH_SIZE) {
        await flushBatch();
      }
    } catch (err) {
      failures.push({ id: exp._id.toString(), error: err.message });
    }
  }

  if (!dryRun) await flushBatch();

  return { scanned, migrated, failures, flagged };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  require('dotenv').config();
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected. Running migration${dryRun ? ' (dry run, no writes)' : ''}...`);

  const result = await migrate({ dryRun });

  console.log('--- Migration report ---');
  console.log(`Scanned:  ${result.scanned}`);
  console.log(`Migrated: ${result.migrated}`);
  console.log(`Failures: ${result.failures.length}`);
  result.failures.forEach((f) => console.log(`  - ${f.id}: ${f.error}`));
  console.log(`Flagged for manual review (large rupee/cents mismatch): ${result.flagged.length}`);
  result.flagged.forEach((f) => console.log(`  - ${f.id}: amount=${f.amount}, diffCents=${f.diffCents}`));

  await mongoose.disconnect();
  process.exit(result.failures.length > 0 ? 1 : 0);
}

module.exports = { migrate };

if (require.main === module) {
  main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
