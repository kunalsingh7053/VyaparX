// Mocks need to be defined before importing the app
const mockUpload = jest.fn();

jest.mock('imagekit', () => {
  return jest.fn().mockImplementation(() => ({
    upload: mockUpload,
  }));
}, { virtual: true });

jest.mock('multer', () => {
  const multer = () => ({
    array: () => (req, _res, next) => {
      // Simulate parsed files in memory
      req.files = [
        { originalname: 'sample.jpg', buffer: Buffer.from('dummy') },
      ];
      next();
    },
  });
  // Needed by routes: multer.memoryStorage()
  multer.memoryStorage = () => ({});
  return multer;
}, { virtual: true });

// Mock auth middleware to bypass JWT and set user
jest.mock('../src/middleware/auth.middleware', () => {
  // Mock to match real signature: createAuthMiddleware(roles) => (req,res,next)
  return (_roles) => (req, _res, next) => {
    req.user = { id: '507f1f77bcf86cd799439011', role: 'seller' };
    next();
  };
});

// Mock Product model to avoid DB operations
const mockCreate = jest.fn();
jest.mock('../src/models/product.model', () => ({
  create: mockCreate,
}));

const request = require('supertest');
const app = require('../src/app');

describe('POST /api/products', () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockCreate.mockReset();
  });

  it('creates a product and uploads image', async () => {
    mockUpload.mockResolvedValue({ url: 'https://ik.example.com/fake.jpg', fileId: 'file_123' });
    mockCreate.mockResolvedValue({
      _id: 'prod_1',
      title: 'Test Product',
      price: { amount: 100, currency: 'INR' },
      seller: '507f1f77bcf86cd799439011',
      category: 'electronics',
      images: [{ url: 'https://ik.example.com/fake.jpg', id: 'file_123' }],
    });

    const res = await request(app)
      .post('/api/products')
      .send({
        title: 'Test Product',
        description: 'A nice thing',
        priceAmount: 100,
        priceCurrency: 'INR',
        category: 'electronics',
      });

    expect(res.status).toBe(201);
    expect(res.body.product).toBeDefined();
    expect(res.body.product.images[0].url).toBe('https://ik.example.com/fake.jpg');
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ title: 'Only title provided' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 500 if ImageKit upload fails', async () => {
    mockUpload.mockRejectedValue(new Error('Upload failed'));

    const res = await request(app)
      .post('/api/products')
      .send({
        title: 'Test Product',
        priceAmount: 100,
        priceCurrency: 'INR',
        category: 'electronics',
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Upload failed');
  });
});
