const request = require('supertest');
const { app, registerUser } = require('./helpers/testUtils');

describe('Friends', () => {
  it('mutually adds two users as friends', async () => {
    const a = await registerUser();
    const b = await registerUser();

    const res = await request(app)
      .post('/api/friends/add')
      .set('x-auth-token', a.token)
      .send({ email: b.payload.email });
    expect(res.status).toBe(200);

    const aFriends = await request(app).get('/api/friends').set('x-auth-token', a.token);
    const bFriends = await request(app).get('/api/friends').set('x-auth-token', b.token);
    expect(aFriends.body.map((f) => f._id)).toContain(b.user.id);
    expect(bFriends.body.map((f) => f._id)).toContain(a.user.id);
  });

  it('rejects adding yourself', async () => {
    const a = await registerUser();
    const res = await request(app)
      .post('/api/friends/add')
      .set('x-auth-token', a.token)
      .send({ email: a.payload.email });
    expect(res.status).toBe(400);
  });

  it('rejects adding a friend twice', async () => {
    const a = await registerUser();
    const b = await registerUser();

    await request(app).post('/api/friends/add').set('x-auth-token', a.token).send({ email: b.payload.email });
    const res = await request(app)
      .post('/api/friends/add')
      .set('x-auth-token', a.token)
      .send({ email: b.payload.email });
    expect(res.status).toBe(400);
  });
});
