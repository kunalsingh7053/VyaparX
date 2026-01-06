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

describe('/api/auth/login', () => {
  const register = async (payload) => {
    return request(app).post('/api/auth/register').send(payload);
  };

  it('returns 200 and user + cookie on valid credentials', async () => {
    await register({
      username: 'jdoe',
      email: 'john@example.com',
      password: 'Secret123!',
      fullName: { firstName: 'John', lastName: 'Doe' },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'Secret123!' });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({
      username: 'jdoe',
      email: 'john@example.com',
      fullName: { firstName: 'John', lastName: 'Doe' },
      role: 'user',
    });
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 on invalid credentials', async () => {
    await register({
      username: 'jdoe',
      email: 'john@example.com',
      password: 'Secret123!',
      fullName: { firstName: 'John', lastName: 'Doe' },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'WrongPass1!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com' }); // missing password

    expect(res.status).toBe(400);
  });
});
