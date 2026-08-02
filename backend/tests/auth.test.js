const request = require('supertest');
const { app, registerUser } = require('./helpers/testUtils');

describe('GET /api/auth/users', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/auth/users');
    expect(res.status).toBe(401);
  });

  it('returns the user list for an authenticated request', async () => {
    const { token } = await registerUser();
    const res = await request(app).get('/api/auth/users').set('x-auth-token', token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  it('rejects an incorrect password', async () => {
    const { payload } = await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'wrong-password' });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    const { payload } = await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
