const mongoose = require('mongoose');
const Expense = require('./models/Expense');
const Group = require('./models/Group');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Connected to DB");

        // Find ALL groups matching 'tester'
        const groups = await Group.find({ name: { $regex: 'tester', $options: 'i' } });
        console.log(`Found ${groups.length} Groups matching 'tester'`);

        for (const group of groups) {
            console.log(`\nChecking Group: ${group.name} (${group._id})`);
            const expenses = await Expense.find({ group: group._id });
            console.log(`Found ${expenses.length} expenses.`);

            for (const exp of expenses) {
                console.log(`- [${exp._id}] "${exp.description}" `);
                if (exp.description.toLowerCase().includes('dinner')) {
                    console.log("  >>> MATCH FOUND! Deleting...");
                    await Expense.findByIdAndDelete(exp._id);
                    await Group.findByIdAndUpdate(group._id, { $pull: { expenses: exp._id } });
                    console.log("  >>> Deleted.");
                }
            }
        }

        console.log("Done");
        process.exit();
    })
    .catch(err => console.error(err));
