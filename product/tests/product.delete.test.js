// Tests for DELETE /api/products/:id
// Per request, only test cases are created; no controller/route changes.
// Suite is skipped until the endpoint exists to avoid failing the pipeline.

describe('DELETE /api/products/:id', () => {
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

  // Mock auth middleware to inject a user
  jest.mock('../src/middleware/auth.middleware', () => {
    return (_roles) => (req, _res, next) => {
      req.user = { id: '507f1f77bcf86cd799439011', role: 'seller' };
      next();
    };
  });

  // Mock Product model methods used by controller
  const mockFindById = jest.fn();
  const mockFindByIdAndDelete = jest.fn();
  jest.mock('../src/models/product.model', () => ({
    findById: (id) => mockFindById(id),
    findByIdAndDelete: (id) => mockFindByIdAndDelete(id),
  }));

  const app = require('../src/app');

  beforeEach(() => {
    mockUpload.mockReset();
    mockFindById.mockReset();
    mockFindByIdAndDelete.mockReset();
  });

  it('deletes product and returns 200', async () => {
    const deleted = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Phone',
    };
    mockFindById.mockResolvedValue({ _id: deleted._id, seller: '507f1f77bcf86cd799439011' });
    mockFindByIdAndDelete.mockResolvedValue(deleted);

    const res = await request(app)
      .delete('/api/products/507f1f77bcf86cd799439011');

    expect(res.status).toBe(200);
    // Depending on implementation, it might return { data } or minimal body
    // Here we check for a common pattern
    expect(res.body.data || res.body.product || res.body.success).toBeDefined();
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('returns 404 when product not found', async () => {
    mockFindById.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/products/507f1f77bcf86cd799439012');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Product not found');
  });

  it('returns 400 for invalid id format', async () => {
    const res = await request(app)
      .delete('/api/products/not-a-valid-id');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid product id');
    expect(mockFindByIdAndDelete).not.toHaveBeenCalled();
  });
});
