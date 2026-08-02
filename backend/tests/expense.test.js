const request = require('supertest');
const { app, registerUser } = require('./helpers/testUtils');

async function createGroup(token, members) {
  const res = await request(app)
    .post('/api/group/create')
    .set('x-auth-token', token)
    .send({ name: 'Trip', members });
  return res.body;
}

async function addExpense(token, body) {
  return request(app).post('/api/expense/add').set('x-auth-token', token).send(body);
}

describe('Expense authorization', () => {
  it('allows the payer to create, then edit and delete their own expense', async () => {
    const payer = await registerUser();

    const addRes = await addExpense(payer.token, {
      paidBy: payer.user.id,
      amount: 100,
      description: 'Solo lunch',
      split: [{ user: payer.user.id, share: 100 }],
    });
    expect(addRes.status).toBe(201);
    const expenseId = addRes.body._id;

    const putRes = await request(app)
      .put(`/api/expense/${expenseId}`)
      .set('x-auth-token', payer.token)
      .send({ description: 'Solo dinner' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.description).toBe('Solo dinner');

    const delRes = await request(app)
      .delete(`/api/expense/${expenseId}`)
      .set('x-auth-token', payer.token);
    expect(delRes.status).toBe(200);
  });

  it('rejects edit/delete from a user who is neither the payer nor a group member', async () => {
    const payer = await registerUser();
    const outsider = await registerUser();

    const addRes = await addExpense(payer.token, {
      paidBy: payer.user.id,
      amount: 50,
      description: 'Coffee',
      split: [{ user: payer.user.id, share: 50 }],
    });
    const expenseId = addRes.body._id;

    const putRes = await request(app)
      .put(`/api/expense/${expenseId}`)
      .set('x-auth-token', outsider.token)
      .send({ description: 'Hacked' });
    expect(putRes.status).toBe(403);

    const delRes = await request(app)
      .delete(`/api/expense/${expenseId}`)
      .set('x-auth-token', outsider.token);
    expect(delRes.status).toBe(403);

    // Confirm the expense actually survived the rejected delete.
    const stillThere = await request(app)
      .put(`/api/expense/${expenseId}`)
      .set('x-auth-token', payer.token)
      .send({ description: 'Still mine' });
    expect(stillThere.status).toBe(200);
  });

  it('allows a fellow group member (non-payer) to edit/delete a group expense', async () => {
    const payer = await registerUser();
    const member = await registerUser();

    const group = await createGroup(payer.token, [member.user.id]);

    const addRes = await addExpense(payer.token, {
      group: group._id,
      paidBy: payer.user.id,
      amount: 80,
      description: 'Groceries',
      split: [
        { user: payer.user.id, share: 40 },
        { user: member.user.id, share: 40 },
      ],
    });
    const expenseId = addRes.body._id;

    const putRes = await request(app)
      .put(`/api/expense/${expenseId}`)
      .set('x-auth-token', member.token)
      .send({ description: 'Groceries + snacks' });
    expect(putRes.status).toBe(200);

    const delRes = await request(app)
      .delete(`/api/expense/${expenseId}`)
      .set('x-auth-token', member.token);
    expect(delRes.status).toBe(200);
  });

  it('only registers a single PUT/DELETE handler per path (no duplicate-route shadowing)', async () => {
    const routerStack = require('../routes/expense');
    const layers = routerStack.stack.filter(
      (l) => l.route && (l.route.path === '/:id')
    );
    const putHandlers = layers.filter((l) => l.route.methods.put);
    const deleteHandlers = layers.filter((l) => l.route.methods.delete);
    expect(putHandlers.length).toBe(1);
    expect(deleteHandlers.length).toBe(1);
  });
});
