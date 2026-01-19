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

describe('POST /api/orders/:orderId/cancel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cancels a pending order successfully', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const order = {
      _id: '64f1a2b3c4d5e6f7a8b9c001',
      user: '507f1f77bcf86cd799439011',
      status: 'pending',
      save,
    };

    mockFindOne.mockResolvedValue(order);

    const res = await request(app)
      .post('/api/orders/64f1a2b3c4d5e6f7a8b9c001/cancel')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Order cancelled successfully');
    expect(order.status).toBe('cancelled');
    expect(save).toHaveBeenCalled();
    expect(mockFindOne).toHaveBeenCalledWith({ _id: '64f1a2b3c4d5e6f7a8b9c001', user: '507f1f77bcf86cd799439011' });
  });

  it('returns 400 when order is not pending', async () => {
    const order = {
      _id: '64f1a2b3c4d5e6f7a8b9c002',
      user: '507f1f77bcf86cd799439011',
      status: 'confirmed',
      save: jest.fn(),
    };
    mockFindOne.mockResolvedValue(order);

    const res = await request(app)
      .post('/api/orders/64f1a2b3c4d5e6f7a8b9c002/cancel')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only pending orders can be cancelled');
  });

  it('returns 403 when attempting to cancel another user\'s order', async () => {
    const order = {
      _id: '64f1a2b3c4d5e6f7a8b9c003',
      user: '507f1f77bcf86cd799439012', // different user
      status: 'pending',
      save: jest.fn(),
    };
    mockFindOne.mockResolvedValue(order);

    const res = await request(app)
      .post('/api/orders/64f1a2b3c4d5e6f7a8b9c003/cancel')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden: You can only cancel your own orders');
  });

  it('returns 404 when order is not found', async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/orders/64f1a2b3c4d5e6f7a8b9c099/cancel')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Order not found');
  });

  it('returns 400 for invalid orderId', async () => {
    const res = await request(app)
      .post('/api/orders/not-a-valid-id/cancel')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid orderId');
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it('returns 500 on internal error', async () => {
    mockFindOne.mockRejectedValue(new Error('boom'));

    const res = await request(app)
      .post('/api/orders/64f1a2b3c4d5e6f7a8b9c001/cancel')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
    expect(res.body.error).toBe('boom');
  });
});
