// Tests for GET /api/products/seller
// Only test cases are created; if the endpoint doesn't exist yet, the suite is skipped.

describe('GET /api/products/seller', () => {
  const request = require('supertest');

  // Mock ImageKit to avoid env-based initialization during app import
  const mockUpload = jest.fn();
  jest.mock('imagekit', () => {
    return jest.fn().mockImplementation(() => ({ upload: mockUpload }));
  }, { virtual: true });

  // Mock multer so cached app uses consistent mocked middleware
  jest.mock('multer', () => {
    const multer = () => ({
      array: () => (req, _res, next) => {
        req.files = [
          { originalname: 'sample.jpg', buffer: Buffer.from('dummy') },
        ];
        next();
      },
    });
    multer.memoryStorage = () => ({});
    return multer;
  }, { virtual: true });

  // Mock auth middleware to inject a seller user
  const SELLER_ID = '507f1f77bcf86cd799439011';
  jest.mock('../src/middleware/auth.middleware', () => {
    return (_roles) => (req, _res, next) => {
      req.user = { id: SELLER_ID, role: 'seller' };
      next();
    };
  });

  // Mock Product model with chainable query: find().skip().limit()
  let mockFind;
  let chain;
  const sampleProducts = [
    { _id: '1', title: 'Phone', price: { amount: 500, currency: 'INR' }, seller: SELLER_ID },
    { _id: '2', title: 'Laptop', price: { amount: 1500, currency: 'INR' }, seller: SELLER_ID },
    { _id: '3', title: 'Headphones', price: { amount: 200, currency: 'INR' }, seller: SELLER_ID },
  ];

  jest.mock('../src/models/product.model', () => ({
    find: (...args) => mockFind(...args),
  }));

  const app = require('../src/app');

  beforeEach(() => {
    chain = {
      _skip: 0,
      _limit: 20,
      skip: jest.fn(function (n) {
        chain._skip = n;
        return chain;
      }),
      limit: jest.fn(async function (n) {
        chain._limit = n;
        return sampleProducts.slice(chain._skip, chain._skip + n);
      }),
    };

    mockFind = jest.fn(() => chain);
    mockUpload.mockReset();
  });

  it('returns seller products with default pagination', async () => {
    const res = await request(app).get('/api/products/seller');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(mockFind).toHaveBeenCalledWith({ seller: SELLER_ID });
    expect(chain.skip).toHaveBeenCalledWith(0);
    expect(chain.limit).toHaveBeenCalledWith(20);
  });

  it('applies pagination params', async () => {
    const res = await request(app).get('/api/products/seller?skip=1&limit=2');

    expect(res.status).toBe(200);
    expect(mockFind).toHaveBeenCalledWith({ seller: SELLER_ID });
    expect(chain.skip).toHaveBeenCalledWith(1);
    expect(chain.limit).toHaveBeenCalledWith(2);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0]._id).toBe('2');
  });
});
