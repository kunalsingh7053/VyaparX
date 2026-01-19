// Mock auth middleware to bypass JWT and set user
jest.mock('../src/middlewares/auth.middleware', () => {
  return (_roles) => (req, _res, next) => {
    req.user = { id: '507f1f77bcf86cd799439011', role: 'user' };
    next();
  };
});

// Mock order model methods used in controller
const mockFindOne = jest.fn();
jest.mock('../src/models/order.model', () => ({
  findOne: (...args) => mockFindOne(...args),
}));

const request = require('supertest');
const app = require('../src/app');

describe('GET /api/orders/:orderId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the order when found for the authenticated user', async () => {
    const order = {
      _id: '64f1a2b3c4d5e6f7a8b9c001',
      user: '507f1f77bcf86cd799439011',
      status: 'pending',
      items: [
        { product: '64f1a2b3c4d5e6f7a8b9c100', qty: 1, price: { amount: 50, currency: 'INR' } },
      ],
      totalAmount: { amount: 50, currency: 'INR' },
    };

    mockFindOne.mockResolvedValue(order);

    const res = await request(app)
      .get('/api/orders/64f1a2b3c4d5e6f7a8b9c001')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(200);
    expect(res.body.order).toEqual(order);
    expect(mockFindOne).toHaveBeenCalledWith({ _id: '64f1a2b3c4d5e6f7a8b9c001', user: '507f1f77bcf86cd799439011' });
  });

  it('returns 404 when the order is not found', async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/orders/64f1a2b3c4d5e6f7a8b9c099')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Order not found');
  });

  it('returns 400 for invalid orderId format', async () => {
    const res = await request(app)
      .get('/api/orders/not-a-valid-id')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid orderId');
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it('returns 500 on internal error', async () => {
    mockFindOne.mockRejectedValue(new Error('boom'));

    const res = await request(app)
      .get('/api/orders/64f1a2b3c4d5e6f7a8b9c001')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
    expect(res.body.error).toBe('boom');
  });
});
