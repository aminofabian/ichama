# Test Suite for Individual Savings Feature

This directory contains tests for the Individual Savings Amounts feature.

## Test Structure

```
tests/
├── setup.ts                    # Test configuration and setup
├── unit/                       # Unit tests (isolated functions)
│   ├── validation.test.ts      # Validation utility tests
│   └── contribution-service.test.ts  # Contribution service logic tests
├── integration/                # Integration tests (with database)
│   └── cycle-members.test.ts   # Cycle members database queries
└── api/                        # API endpoint tests
    └── savings-endpoint.test.ts # Savings endpoint tests
```

## Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

## Test Coverage

### Unit Tests
- ✅ `validateCustomSavingsAmount` - All validation scenarios
- ✅ Contribution service - Custom savings logic

### Integration Tests
- ✅ Cycle members queries - Custom savings handling
- ✅ Database operations - CRUD with new fields

### API Tests
- ✅ Savings endpoint - Request validation
- ✅ Savings endpoint - Authorization
- ✅ Savings endpoint - Business rules

## Test Scenarios Covered

### Validation
- ✅ Chama type restrictions (merry-go-round vs savings/hybrid)
- ✅ NULL/undefined handling (use default)
- ✅ Negative amount rejection
- ✅ Amount exceeding contribution rejection
- ✅ Zero amount acceptance
- ✅ Edge cases (small/large amounts)

### Business Logic
- ✅ Using custom savings amount when set
- ✅ Falling back to cycle default when NULL
- ✅ Capping savings at contribution amount
- ✅ Privacy setting (hide_savings)

### API Endpoints
- ✅ Request body validation
- ✅ Authorization (own member or admin)
- ✅ Cycle status restrictions
- ✅ Chama type validation
- ✅ Privacy setting updates

## Notes

- Tests use Vitest for fast execution
- Database tests may require a test database connection
- Mock functions are used to isolate unit tests
- Integration tests verify database operations

## Adding New Tests

When adding new features related to individual savings:

1. Add unit tests for new validation functions
2. Add integration tests for new database queries
3. Add API tests for new endpoints
4. Update this README with new test scenarios

