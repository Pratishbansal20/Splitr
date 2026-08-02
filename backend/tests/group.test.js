const request = require('supertest');
const { app, registerUser } = require('./helpers/testUtils');

describe('Group authorization', () => {
  it('allows a member to update/delete their own group', async () => {
    const owner = await registerUser();

    const createRes = await request(app)
      .post('/api/group/create')
      .set('x-auth-token', owner.token)
      .send({ name: 'Roommates', members: [owner.user.id] });
    const groupId = createRes.body._id;

    const putRes = await request(app)
      .put(`/api/group/${groupId}`)
      .set('x-auth-token', owner.token)
      .send({ name: 'Roommates (renamed)' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.name).toBe('Roommates (renamed)');

    const delRes = await request(app)
      .delete(`/api/group/${groupId}`)
      .set('x-auth-token', owner.token);
    expect(delRes.status).toBe(200);
  });

  it('rejects rename/delete from a non-member', async () => {
    const owner = await registerUser();
    const outsider = await registerUser();

    const createRes = await request(app)
      .post('/api/group/create')
      .set('x-auth-token', owner.token)
      .send({ name: 'Private Group', members: [owner.user.id] });
    const groupId = createRes.body._id;

    const putRes = await request(app)
      .put(`/api/group/${groupId}`)
      .set('x-auth-token', outsider.token)
      .send({ name: 'Taken over' });
    expect(putRes.status).toBe(403);

    const delRes = await request(app)
      .delete(`/api/group/${groupId}`)
      .set('x-auth-token', outsider.token);
    expect(delRes.status).toBe(403);
  });

  it('nulls out the group field on that group\'s expenses instead of orphaning them when the group is deleted', async () => {
    const owner = await registerUser();

    const createRes = await request(app)
      .post('/api/group/create')
      .set('x-auth-token', owner.token)
      .send({ name: 'Trip', members: [owner.user.id] });
    const groupId = createRes.body._id;

    const expenseRes = await request(app)
      .post('/api/expense/add')
      .set('x-auth-token', owner.token)
      .send({
        group: groupId,
        paidBy: owner.user.id,
        amount: 30,
        description: 'Snacks',
        split: [{ user: owner.user.id, share: 30 }],
      });
    const expenseId = expenseRes.body._id;

    const delRes = await request(app)
      .delete(`/api/group/${groupId}`)
      .set('x-auth-token', owner.token);
    expect(delRes.status).toBe(200);

    const Expense = require('../models/Expense');
    const expense = await Expense.findById(expenseId);
    expect(expense).not.toBeNull();
    expect(expense.group).toBeNull();
  });
});
