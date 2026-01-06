const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const connectDB = require('../src/db/db');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test_jwt_secret';
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const { name } of collections) {
    await mongoose.connection.db.collection(name).deleteMany({});
  }
});

describe('GET /api/auth/me', () => {
  const register = (payload) =>
    request(app).post('/api/auth/register').send(payload);

  it('returns 200 and current user when authenticated via cookie', async () => {
    const reg = await register({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'Secret123!',
      fullName: { firstName: 'John', lastName: 'Doe' },
    });
    expect(reg.status).toBe(201);

    const cookie = reg.headers['set-cookie'];

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({
      username: 'john_doe',
      email: 'john@example.com',
      role: 'user',
    });
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 when no auth cookie is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for invalid token cookie', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['token=invalid.token.value; Path=/; HttpOnly']);
    expect(res.status).toBe(401);
  });
});
