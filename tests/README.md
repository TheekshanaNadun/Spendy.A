# Spendy.AI Test Suite

This directory contains comprehensive tests for the Spendy.AI application, covering backend, frontend, integration, and security testing.

## Test Structure

```
tests/
├── __init__.py                 # Makes tests a Python package
├── test_backend.py            # Backend unit tests
├── test_integration.py        # Integration and security tests
└── README.md                  # This file

react-app/src/__tests__/
├── App.test.js               # Main App component tests
├── SignInLayer.test.js       # Sign-in component tests
└── ForgotPasswordLayer.test.js # Forgot password component tests
```

## Test Categories

### 1. Backend Tests (`test_backend.py`)
- **Authentication Tests**: User registration, login, OTP verification, forgot password
- **Transaction Tests**: CRUD operations for transactions, filtering by type
- **Analytics Tests**: Financial statistics, expense summaries, dashboard data
- **User Settings Tests**: Profile management, password changes
- **AI Tests**: AI model functions, message processing
- **Security Tests**: Session management, authentication protection

### 2. Integration Tests (`test_integration.py`)
- **API Integration**: End-to-end API testing
- **Service Connectivity**: Database, frontend, and API connectivity
- **Performance Tests**: Response times, concurrent request handling
- **Security Tests**: SQL injection, XSS protection, rate limiting

### 3. Frontend Tests (React)
- **Component Tests**: Individual React component testing
- **User Interaction**: Form handling, navigation, state management
- **API Integration**: Frontend-backend communication

## Running Tests

### Docker Environment (Recommended)

#### Option 1: Run tests in existing containers
```bash
# Run all tests in your current running containers
./test_in_docker.sh

# Run only backend tests
./test_in_docker.sh --backend-only

# Run only frontend tests
./test_in_docker.sh --frontend-only
```

#### Option 2: Run tests in isolated test environment
```bash
# Run all tests in isolated containers
./run_docker_tests.sh

# Run only backend tests
./run_docker_tests.sh --backend-only

# Run only frontend tests
./run_docker_tests.sh --frontend-only

# Run only integration tests
./run_docker_tests.sh --integration-only
```

### Local Development

#### Quick Start
```bash
# Run all tests
python run_tests.py

# Run specific test categories
python -m pytest tests/test_backend.py -v
python -m pytest tests/test_integration.py -v
```

#### Backend Tests Only
```bash
# Run backend unit tests
python -m unittest tests.test_backend -v

# Run with coverage
python -m pytest tests/test_backend.py --cov=app --cov-report=html
```

#### Frontend Tests Only
```bash
cd react-app
npm test
```

#### Integration Tests Only
```bash
# Make sure services are running first
docker-compose up -d

# Run integration tests
python -m pytest tests/test_integration.py -v
```

## Test Configuration

### Environment Setup
1. **Backend**: Uses SQLite in-memory database for testing
2. **Frontend**: Uses Jest with jsdom environment
3. **Integration**: Requires running services (Docker containers)

### Test Data
- Test users are created and cleaned up automatically
- Sample transactions are created for testing
- Mock AI responses are used for testing

## Test Coverage

### Backend Coverage
- ✅ Authentication endpoints (signup, login, OTP, forgot password)
- ✅ Transaction management (CRUD operations)
- ✅ Analytics and statistics
- ✅ User profile management
- ✅ AI model functions
- ✅ Security and session management

### Frontend Coverage
- ✅ Component rendering
- ✅ User interactions
- ✅ Form validation
- ✅ API integration
- ✅ Navigation and routing

### Integration Coverage
- ✅ End-to-end user flows
- ✅ Service connectivity
- ✅ Performance benchmarks
- ✅ Security vulnerability testing

## Writing New Tests

### Backend Test Example
```python
class NewFeatureTests(SpendyAITestCase):
    def test_new_feature(self):
        """Test description"""
        # Arrange
        data = {'key': 'value'}
        
        # Act
        response = self.app.post('/api/new-endpoint', 
                               data=json.dumps(data),
                               content_type='application/json')
        
        # Assert
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('expected_key', result)
```

### Frontend Test Example
```javascript
describe('NewComponent', () => {
  test('renders correctly', () => {
    render(<NewComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interaction', () => {
    render(<NewComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Services**: Use mocks for AI APIs, email services
3. **Clean Up**: Always clean up test data
4. **Descriptive Names**: Use clear, descriptive test names
5. **Arrange-Act-Assert**: Follow the AAA pattern
6. **Coverage**: Aim for high test coverage

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure Python path includes project root
2. **Database Errors**: Tests use in-memory SQLite, no external DB needed
3. **Service Not Running**: Integration tests require Docker services
4. **Frontend Dependencies**: Run `npm install` in react-app directory

### Debug Mode
```bash
# Run tests with debug output
python -m pytest tests/ -v -s

# Run specific test with debug
python -m pytest tests/test_backend.py::AuthenticationTests::test_login_success -v -s
```

## Continuous Integration

The test suite is designed to work with CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Backend Tests
  run: python run_tests.py

- name: Run Frontend Tests
  run: |
    cd react-app
    npm test -- --watchAll=false
```

## Test Reports

- **Coverage Reports**: Generated in `htmlcov/` directory
- **Jest Reports**: Available in `react-app/coverage/`
- **Console Output**: Detailed test results in terminal

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve test coverage
4. Update this documentation if needed 