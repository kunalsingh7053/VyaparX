// Mock auth middleware to bypass JWT and set user
jest.mock('../src/middlewares/auth.middleware', () => {
  return (_roles) => (req, _res, next) => {
    req.user = { id: '507f1f77bcf86cd799439011', role: 'user' };
    next();
  };
});

// Mock order model methods used in controller
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();
jest.mock('../src/models/order.model', () => ({
  find: (...args) => mockFind(...args),
  countDocuments: (...args) => mockCountDocuments(...args),
}));

const request = require('supertest');
const app = require('../src/app');

describe('GET /api/orders/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated orders for the authenticated user (default page/limit)', async () => {
    const sampleOrders = [
      {
        _id: 'order_1',
        user: '507f1f77bcf86cd799439011',
        status: 'pending',
        items: [],
        totalAmount: { amount: 100, currency: 'INR' },
      },
      {
        _id: 'order_2',
        user: '507f1f77bcf86cd799439011',
        status: 'confirmed',
        items: [],
        totalAmount: { amount: 200, currency: 'INR' },
      },
    ];

    const skipFn = jest.fn().mockReturnThis();
    const limitFn = jest.fn().mockReturnThis();
    const sortFn = jest.fn().mockResolvedValue(sampleOrders);

    mockFind.mockReturnValue({ skip: skipFn, limit: limitFn, sort: sortFn });
    mockCountDocuments.mockResolvedValue(sampleOrders.length);

    const res = await request(app)
      .get('/api/orders/me')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    expect(res.body.totalOrders).toBe(2);
    expect(res.body.totalPages).toBe(1);
    expect(res.body.orders).toEqual(sampleOrders);

    // Ensure model methods are called as expected
    expect(mockFind).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439011' });
    expect(skipFn).toHaveBeenCalledWith(0); // (page-1) * limit => (1-1)*10
    expect(limitFn).toHaveBeenCalledWith(10);
    expect(sortFn).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('honors page and limit query params', async () => {
    const pagedOrders = [
      {
        _id: 'order_2',
        user: '507f1f77bcf86cd799439011',
        status: 'confirmed',
        items: [],
        totalAmount: { amount: 200, currency: 'INR' },
      },
    ];

    const skipFn = jest.fn().mockReturnThis();
    const limitFn = jest.fn().mockReturnThis();
    const sortFn = jest.fn().mockResolvedValue(pagedOrders);

    mockFind.mockReturnValue({ skip: skipFn, limit: limitFn, sort: sortFn });
    mockCountDocuments.mockResolvedValue(2);

    const res = await request(app)
      .get('/api/orders/me?page=2&limit=1')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(1);
    expect(res.body.totalOrders).toBe(2);
    expect(res.body.totalPages).toBe(2);
    expect(res.body.orders).toEqual(pagedOrders);

    expect(skipFn).toHaveBeenCalledWith(1); // (2-1) * 1
    expect(limitFn).toHaveBeenCalledWith(1);
    expect(sortFn).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('handles internal errors gracefully', async () => {
    const skipFn = jest.fn().mockReturnThis();
    const limitFn = jest.fn().mockReturnThis();
    const sortFn = jest.fn().mockRejectedValue(new Error('boom'));

    mockFind.mockReturnValue({ skip: skipFn, limit: limitFn, sort: sortFn });
    mockCountDocuments.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/orders/me')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
    expect(res.body.error).toBe('boom');
  });
});
