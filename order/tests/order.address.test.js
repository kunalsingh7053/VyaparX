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

describe('POST /api/orders/:orderId/address', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const newAddress = {
    street: '221B Baker Street',
    city: 'London',
    state: 'London',
    pinCode: 'NW1',
    country: 'UK',
  };

  it('updates shipping address for pending order', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const order = {
      _id: '64f1a2b3c4d5e6f7a8b9c100',
      user: '507f1f77bcf86cd799439011',
      status: 'pending',
      shippingAddress: {
        street: 'Old St', city: 'London', state: 'London', pinCode: 'E1', country: 'UK'
      },
      save,
    };

    mockFindOne.mockResolvedValue(order);

    const res = await request(app)
      .post('/api/orders/64f1a2b3c4d5e6f7a8b9c100/address')
      .set('Authorization', 'Bearer fake.jwt.token')
      .send({ shippingAddress: newAddress });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Order address updated successfully');
    expect(order.shippingAddress).toEqual(newAddress);
    expect(save).toHaveBeenCalled();
    expect(mockFindOne).toHaveBeenCalledWith({ _id: '64f1a2b3c4d5e6f7a8b9c100', user: '507f1f77bcf86cd799439011' });
  });

  it('returns 400 for invalid orderId', async () => {
    const res = await request(app)
      .post('/api/orders/not-a-valid-id/address')
      .set('Authorization', 'Bearer fake.jwt.token')
      .send({ shippingAddress: newAddress });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid orderId');
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid shipping address payload', async () => {
    const res = await request(app)
      .post('/api/orders/64f1a2b3c4d5e6f7a8b9c100/address')
      .set('Authorization', 'Bearer fake.jwt.token')
      .send({ shippingAddress: { street: 'X', city: 'Y' } }); // missing fields

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid shipping address');
  });

  it('returns 404 when order is not found', async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/orders/64f1a2b3c4d5e6f7a8b9c100/address')
      .set('Authorization', 'Bearer fake.jwt.token')
      .send({ shippingAddress: newAddress });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Order not found');
  });

  it('returns 403 when attempting to update another user\'s order', async () => {
    const order = {
      _id: '64f1a2b3c4d5e6f7a8b9c100',
      user: '507f1f77bcf86cd799439012', // different user
      status: 'pending',
      shippingAddress: {},
      save: jest.fn(),
    };
    mockFindOne.mockResolvedValue(order);

    const res = await request(app)
      .post('/api/orders/64f1a2b3c4d5e6f7a8b9c100/address')
      .set('Authorization', 'Bearer fake.jwt.token')
      .send({ shippingAddress: newAddress });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden: You can only update your own orders');
  });

  it('returns 400 when order status is not modifiable', async () => {
    const order = {
      _id: '64f1a2b3c4d5e6f7a8b9c100',
      user: '507f1f77bcf86cd799439011',
      status: 'shipped',
      shippingAddress: {},
      save: jest.fn(),
    };
    mockFindOne.mockResolvedValue(order);

    const res = await request(app)
      .post('/api/orders/64f1a2b3c4d5e6f7a8b9c100/address')
      .set('Authorization', 'Bearer fake.jwt.token')
      .send({ shippingAddress: newAddress });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only pending or confirmed orders can be updated');
  });

  it('returns 500 on internal error', async () => {
    mockFindOne.mockRejectedValue(new Error('boom'));

    const res = await request(app)
      .post('/api/orders/64f1a2b3c4d5e6f7a8b9c100/address')
      .set('Authorization', 'Bearer fake.jwt.token')
      .send({ shippingAddress: newAddress });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
    expect(res.body.error).toBe('boom');
  });
});
