const request = require('supertest');
const app = require('../../app');

let counter = 0;

// Registers a new user via the real /api/auth/register endpoint and returns
// the created user's id/token alongside the raw payload used to create it.
async function registerUser(overrides = {}) {
  counter += 1;
  const payload = {
    name: 'Test User',
    email: `user${Date.now()}${counter}@example.com`,
    password: 'password123',
    ...overrides,
  };

  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.token, user: res.body.user, payload };
}

module.exports = { registerUser, app, request };
