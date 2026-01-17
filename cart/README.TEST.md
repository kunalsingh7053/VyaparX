# Cart Service - Jest Testing Guide

## Overview
This project uses Jest and Supertest for API testing of the Cart Service.

## Installation
Dependencies are already installed. If needed, run:
```bash
npm install
```

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run tests with coverage:
```bash
npm test
```

## Test Structure

### Test File Location
- `__tests__/cart.test.js` - Main cart API tests

### API Endpoints Tested

#### 1. GET /cart
- Fetches current cart with items and totals
- Validates price recomputation from Product Service
- Tests empty cart scenarios

#### 2. POST /cart/items
- Adds items with productId and qty
- Validates product availability
- Tests soft stock reservation
- Validates required fields (productId, qty)
- Rejects invalid quantities (negative/zero)

#### 3. PATCH /cart/items/:productId
- Updates item quantity
- Removes item when qty ≤ 0
- Returns recalculated totals
- Handles non-existent products

#### 4. DELETE /cart/items/:productId
- Removes specific cart item
- Updates cart totals
- Handles non-existent products

#### 5. DELETE /cart
- Clears entire cart
- Resets totals to zero
- Verifies empty cart state

## Test Coverage

The tests include:
- ✅ Happy path scenarios
- ✅ Error handling
- ✅ Input validation
- ✅ Edge cases
- ✅ Integration workflows

## Coverage Reports

After running tests, view coverage reports:
- Terminal: Summary displayed automatically
- HTML Report: `coverage/lcov-report/index.html`

## Notes

- Tests use Supertest for HTTP assertions
- Each test is independent and isolated
- Mock data can be added as needed
- Tests assume the API will be implemented following REST conventions
