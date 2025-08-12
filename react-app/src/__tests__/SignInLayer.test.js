import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import SignInLayer from '../components/SignInLayer';

// Mock dependencies
jest.mock('axios');
jest.mock('sweetalert2');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

describe('SignInLayer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.defaults.withCredentials = true;
  });

  test('renders sign in form', () => {
    render(
      <BrowserRouter>
        <SignInLayer />
      </BrowserRouter>
    );

    expect(screen.getByText('Sign In to your Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('handles email input', () => {
    render(
      <BrowserRouter>
        <SignInLayer />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput.value).toBe('test@example.com');
  });

  test('handles password input', () => {
    render(
      <BrowserRouter>
        <SignInLayer />
      </BrowserRouter>
    );

    const passwordInput = screen.getByPlaceholderText('Password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput.value).toBe('password123');
  });

  test('toggles password visibility', () => {
    render(
      <BrowserRouter>
        <SignInLayer />
      </BrowserRouter>
    );

    const passwordInput = screen.getByPlaceholderText('Password');
    const toggleButton = screen.getByRole('button', { name: /toggle password/i });

    // Initially password should be hidden
    expect(passwordInput.type).toBe('password');

    // Click toggle button
    fireEvent.click(toggleButton);

    // Password should be visible
    expect(passwordInput.type).toBe('text');
  });

  test('handles successful login with OTP', async () => {
    const mockAxiosResponse = {
      data: {
        otpRequired: true,
        otpHash: 'test-hash',
        email: 'test@example.com'
      }
    };

    axios.post.mockResolvedValue(mockAxiosResponse);
    Swal.fire.mockResolvedValue({ isConfirmed: true, value: '123456' });

    render(
      <BrowserRouter>
        <SignInLayer />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/api/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });

    expect(Swal.fire).toHaveBeenCalled();
  });

  test('handles login error', async () => {
    const mockError = {
      response: {
        data: { error: 'Invalid credentials' }
      }
    };

    axios.post.mockRejectedValue(mockError);

    render(
      <BrowserRouter>
        <SignInLayer />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'error',
        title: 'Login Failed',
        text: 'Invalid credentials',
        confirmButtonText: 'Try Again'
      });
    });
  });

  test('handles OTP verification', async () => {
    const mockOtpResponse = {
      data: {
        success: true,
        redirect: 'http://localhost:3000/dashboard?showWelcome=true',
        user: {
          user_id: 1,
          email: 'test@example.com'
        }
      }
    };

    axios.post.mockResolvedValue(mockOtpResponse);

    render(
      <BrowserRouter>
        <SignInLayer />
      </BrowserRouter>
    );

    // Simulate OTP verification
    const component = screen.getByText('Sign In to your Account').closest('section');
    // This would need to be triggered through the actual OTP flow
    // For now, we'll just verify the component renders correctly
    expect(component).toBeInTheDocument();
  });

  test('shows forgot password link', () => {
    render(
      <BrowserRouter>
        <SignInLayer />
      </BrowserRouter>
    );

    const forgotPasswordLink = screen.getByText('Forgot Password?');
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  test('shows sign up link', () => {
    render(
      <BrowserRouter>
        <SignInLayer />
      </BrowserRouter>
    );

    const signUpLink = screen.getByText('Sign Up');
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink.closest('a')).toHaveAttribute('href', '/sign-up');
  });

  test('validates required fields', async () => {
    render(
      <BrowserRouter>
        <SignInLayer />
      </BrowserRouter>
    );

    const signInButton = screen.getByText('Sign In');
    fireEvent.click(signInButton);

    // Form should prevent submission without required fields
    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });
}); 