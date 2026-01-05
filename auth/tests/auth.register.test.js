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

describe('/auth/register', () => {
  it('creates a user and returns 201', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'Secret123!',
        fullName: { firstName: 'John', lastName: 'Doe' },
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({
      username: 'john_doe',
      email: 'john@example.com',
      fullName: { firstName: 'John', lastName: 'Doe' },
      role: 'user',
    });
    // Ensure password is not returned
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('rejects duplicate username/email with 409', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        username: 'jane',
        email: 'jane@example.com',
        password: 'Secret123!',
        fullName: { firstName: 'Jane', lastName: 'Roe' },
      });

    const res = await request(app)
      .post('/auth/register')
      .send({
        username: 'jane',
        email: 'jane@example.com',
        password: 'Secret123!',
        fullName: { firstName: 'Jane', lastName: 'Roe' },
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/exists/i);
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'x', email: 'x@example.com', password: 'p' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing/i);
  });
});
