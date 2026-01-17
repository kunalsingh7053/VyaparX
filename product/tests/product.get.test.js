const request = require('supertest');

// Mock ImageKit to avoid real initialization during imports
const mockUpload = jest.fn();
jest.mock('imagekit', () => {
  return jest.fn().mockImplementation(() => ({ upload: mockUpload }));
}, { virtual: true });

// Mock Product model with chainable query: find().skip().limit()
let mockFind;
let chain;

jest.mock('../src/models/product.model', () => ({
  find: (...args) => mockFind(...args),
}));

const app = require('../src/app');

describe('GET /api/products', () => {
  const sampleProducts = [
    { _id: '1', title: 'Phone', price: { amount: 500, currency: 'INR' } },
    { _id: '2', title: 'Laptop', price: { amount: 1500, currency: 'INR' } },
    { _id: '3', title: 'Headphones', price: { amount: 200, currency: 'INR' } },
  ];

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
        // Return first n items after skipping _skip
        return sampleProducts.slice(chain._skip, chain._skip + n);
      }),
    };

    mockFind = jest.fn(() => chain);
  });

  it('returns products with default pagination', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    // default skip 0, limit 20
    expect(chain.skip).toHaveBeenCalledWith(0);
    expect(chain.limit).toHaveBeenCalledWith(20);
  });

  it('applies pagination from query params', async () => {
    const res = await request(app).get('/api/products?skip=1&limit=2');

    expect(res.status).toBe(200);
    expect(chain.skip).toHaveBeenCalledWith(1);
    expect(chain.limit).toHaveBeenCalledWith(2);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0]._id).toBe('2');
  });

  it('applies search filter q=term', async () => {
    await request(app).get('/api/products?q=phone');

    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenCalledWith({ $text: { $search: 'phone' } });
  });

  it('applies minprice filter', async () => {
    await request(app).get('/api/products?minprice=300');

    expect(mockFind).toHaveBeenCalledWith({
      'price.amount': { $gte: 300 },
    });
  });

  it('applies maxprice filter', async () => {
    await request(app).get('/api/products?maxprice=800');

    expect(mockFind).toHaveBeenCalledWith({
      'price.amount': { $lte: 800 },
    });
  });

  it('applies both minprice and maxprice filters together', async () => {
    await request(app).get('/api/products?minprice=300&maxprice=800');

    expect(mockFind).toHaveBeenCalledWith({
      'price.amount': { $gte: 300, $lte: 800 },
    });
  });
});
