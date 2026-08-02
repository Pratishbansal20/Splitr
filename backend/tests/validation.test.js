const request = require('supertest');
const { app, registerUser } = require('./helpers/testUtils');

describe('Request validation (zod middleware)', () => {
  it('rejects register with a missing field', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('rejects register with a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'a@b.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('rejects register with a malformed email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('rejects add-expense with an empty split array', async () => {
    const { token, user } = await registerUser();
    const res = await request(app)
      .post('/api/expense/add')
      .set('x-auth-token', token)
      .send({ paidBy: user.id, amount: 20, split: [] });
    expect(res.status).toBe(400);
  });

  it('rejects add-expense with a malformed ObjectId in the split', async () => {
    const { token, user } = await registerUser();
    const res = await request(app)
      .post('/api/expense/add')
      .set('x-auth-token', token)
      .send({ paidBy: user.id, amount: 20, split: [{ user: 'not-an-id', share: 20 }] });
    expect(res.status).toBe(400);
  });

  it('rejects create-group with a non-array members field', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/api/group/create')
      .set('x-auth-token', token)
      .send({ name: 'Trip', members: 'not-an-array' });
    expect(res.status).toBe(400);
  });
});

describe('404 handler', () => {
  it('returns a JSON 404 for an unknown route', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
