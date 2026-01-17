// Define mocks before importing the app
const request = require('supertest');

// Mock ImageKit to avoid env-based initialization
const mockUpload = jest.fn();
jest.mock('imagekit', () => {
	return jest.fn().mockImplementation(() => ({ upload: mockUpload }));
}, { virtual: true });

// Mock multer to ensure consistent behavior when app is cached across tests
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

// Mock Product model findById
const mockFindById = jest.fn();
jest.mock('../src/models/product.model', () => ({
	findById: (id) => mockFindById(id),
}));

const app = require('../src/app');

describe('GET /api/products/:id', () => {
	beforeEach(() => {
		mockFindById.mockReset();
		mockUpload.mockReset();
	});

	it('returns 200 and product when found', async () => {
		const product = { _id: '507f1f77bcf86cd799439011', title: 'Phone', price: { amount: 500, currency: 'INR' } };
		mockFindById.mockResolvedValue(product);

		const res = await request(app).get('/api/products/507f1f77bcf86cd799439011');

		expect(res.status).toBe(200);
		expect(res.body.data).toBeDefined();
		expect(res.body.data._id).toBe(product._id);
		expect(mockFindById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
	});

	it('returns 404 when product not found', async () => {
		mockFindById.mockResolvedValue(null);

		const res = await request(app).get('/api/products/507f1f77bcf86cd799439012');

		expect(res.status).toBe(404);
		expect(res.body.error).toBe('Product not found');
	});

	it('returns 400 for invalid id format', async () => {
		const res = await request(app).get('/api/products/not-a-valid-id');

		expect(res.status).toBe(400);
		expect(res.body.error).toBe('Invalid product id');
		expect(mockFindById).not.toHaveBeenCalled();
	});
});
