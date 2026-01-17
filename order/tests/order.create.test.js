// Mock external dependencies before importing app

// Mock auth middleware to bypass JWT and set user
jest.mock('../src/middlewares/auth.middleware', () => {
  return (_roles) => (req, _res, next) => {
    req.user = { id: '507f1f77bcf86cd799439011', role: 'user' };
    next();
  };
});

// Mock order model to avoid real DB
const mockCreate = jest.fn();
jest.mock('../src/models/order.model', () => ({
  create: (...args) => mockCreate(...args),
}));

// Mock axios calls to cart and product services
jest.mock('axios', () => ({
  get: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const axios = require('axios');

describe('POST /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an order successfully from cart items', async () => {
    // Arrange: mock cart response
    axios.get
      // First call: cart service
      .mockResolvedValueOnce({
        data: {
          cart: {
            items: [
              { productId: '64f1a2b3c4d5e6f7a8b9c001', qty: 2 },
              { productId: '64f1a2b3c4d5e6f7a8b9c002', qty: 1 },
            ],
          },
        },
      })
      // Second call: product 1
      .mockResolvedValueOnce({
        data: {
          data: {
            _id: '64f1a2b3c4d5e6f7a8b9c001',
            title: 'Widget',
            price: { amount: 100, currency: 'INR' },
            stock: 10,
          },
        },
      })
      // Third call: product 2
      .mockResolvedValueOnce({
        data: {
          data: {
            _id: '64f1a2b3c4d5e6f7a8b9c002',
            title: 'Gadget',
            price: { amount: 50, currency: 'INR' },
            stock: 5,
          },
        },
      });

    // Mock Order.create return
    mockCreate.mockResolvedValue({
      _id: 'order_123',
      user: '507f1f77bcf86cd799439011',
      status: 'pending',
      items: [
        {
          product: '64f1a2b3c4d5e6f7a8b9c001',
          qty: 2,
          price: { amount: 200, currency: 'INR' },
        },
        {
          product: '64f1a2b3c4d5e6f7a8b9c002',
          qty: 1,
          price: { amount: 50, currency: 'INR' },
        },
      ],
      totalAmount: { amount: 250, currency: 'INR' },
      shippingAddress: {
        street: '123 Main St',
        city: 'Metropolis',
        state: 'NY',
        pinCode: '12345',
        country: 'India',
      },
    });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer fake.jwt.token')
      .send({
        shippingAddress: {
          street: '123 Main St',
          city: 'Metropolis',
          state: 'NY',
          pinCode: '12345',
          country: 'India',
        },
      });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Order Created Successfully');
    expect(res.body.order).toBeDefined();

    // Axios get should be called 3 times: 1 cart + 2 products
    expect(axios.get).toHaveBeenCalledTimes(3);

    // Order.create should be called with computed totals
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const payload = mockCreate.mock.calls[0][0];
    expect(payload.totalAmount.amount).toBe(250);
    expect(payload.items).toHaveLength(2);
  });

  it('returns 400 when shippingAddress validation fails', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer fake.jwt.token')
      .send({
        shippingAddress: {
          street: '123 Main St',
          // city missing
          state: 'NY',
          pinCode: '12345',
          country: 'India',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    // Ensure order is not attempted
    expect(mockCreate).not.toHaveBeenCalled();
    expect(axios.get).not.toHaveBeenCalled();
  });
});
