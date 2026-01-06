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

describe('GET /api/auth/logout', () => {
  const register = (payload) =>
    request(app).post('/api/auth/register').send(payload);

  it('returns 200 and clears the auth cookie', async () => {
    const reg = await register({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'Secret123!',
      fullName: { firstName: 'John', lastName: 'Doe' },
    });
    expect(reg.status).toBe(201);
    const cookie = reg.headers['set-cookie'];
    expect(cookie).toBeDefined();

    const res = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const tokenCookie = Array.isArray(setCookie)
      ? setCookie.find((c) => c.startsWith('token='))
      : setCookie;
    expect(tokenCookie).toBeDefined();
    // Cookie should be cleared (value empty) and expired/max-age 0
    expect(tokenCookie).toContain('token=');
    expect(tokenCookie).toMatch(/token=;|token=""/);
    expect(tokenCookie).toMatch(/Expires=|Max-Age=0/i);
  });

  it('returns 200 even when no cookie is provided', async () => {
    const res = await request(app).get('/api/auth/logout');
    expect(res.status).toBe(200);
  });
});
