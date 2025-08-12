import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../App';
import App from '../App';

// Mock the components to avoid complex dependencies
jest.mock('../pages/SignInPage', () => () => <div data-testid="signin-page">Sign In Page</div>);
jest.mock('../pages/SignUpPage', () => () => <div data-testid="signup-page">Sign Up Page</div>);
jest.mock('../pages/ForgotPasswordPage', () => () => <div data-testid="forgot-password-page">Forgot Password Page</div>);
jest.mock('../pages/HomePageEleven', () => () => <div data-testid="dashboard">Dashboard</div>);

const mockAuthContext = {
  isAuthenticated: false,
  setIsAuthenticated: jest.fn(),
  loading: false,
  user: null,
  setUser: jest.fn(),
  checkAuthStatus: jest.fn()
};

const renderWithRouter = (component, authContext = mockAuthContext) => {
  return render(
    <AuthContext.Provider value={authContext}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders homepage when not authenticated', () => {
    renderWithRouter(<App />);
    
    // Should show homepage iframe
    const iframe = screen.getByTitle('Spendy.AI Homepage');
    expect(iframe).toBeInTheDocument();
  });

  test('renders sign-in page', () => {
    renderWithRouter(<App />);
    
    // Navigate to sign-in
    const signInLink = screen.getByText('Sign In');
    fireEvent.click(signInLink);
    
    expect(screen.getByTestId('signin-page')).toBeInTheDocument();
  });

  test('renders sign-up page', () => {
    renderWithRouter(<App />);
    
    // Navigate to sign-up
    const signUpLink = screen.getByText('Sign Up');
    fireEvent.click(signUpLink);
    
    expect(screen.getByTestId('signup-page')).toBeInTheDocument();
  });

  test('renders forgot password page', () => {
    renderWithRouter(<App />);
    
    // Navigate to forgot password
    const forgotPasswordLink = screen.getByText('Forgot Password');
    fireEvent.click(forgotPasswordLink);
    
    expect(screen.getByTestId('forgot-password-page')).toBeInTheDocument();
  });

  test('redirects to dashboard when authenticated', () => {
    const authenticatedContext = {
      ...mockAuthContext,
      isAuthenticated: true,
      user: { user_id: 1, email: 'test@example.com' }
    };
    
    renderWithRouter(<App />, authenticatedContext);
    
    // Should redirect to dashboard
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    const loadingContext = {
      ...mockAuthContext,
      loading: true
    };
    
    renderWithRouter(<App />, loadingContext);
    
    // Should show loading indicator
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
}); 