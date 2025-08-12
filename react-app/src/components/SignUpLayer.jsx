import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

axios.defaults.withCredentials = true;

const SignUpLayer = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  // Check if passwords match whenever either password field changes
  React.useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordMatch(false);
    } else {
      setPasswordMatch(true);
    }
  }, [password, confirmPassword]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password length
    if (password.length < 8) {
      Swal.fire({
        icon: "error",
        title: "Invalid Password",
        text: "Password must be at least 8 characters long",
        confirmButtonText: "OK",
      });
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Passwords Don't Match",
        text: "Please make sure your passwords match",
        confirmButtonText: "OK",
      });
      return;
    }

    // Validate terms agreement
    if (!agreedToTerms) {
      Swal.fire({
        icon: "error",
        title: "Terms Agreement Required",
        text: "You must agree to the Terms & Conditions and Privacy Policy to continue",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/signup", {
        username,
        email,
        password,
      });

      // Show success message using SweetAlert2
      await Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: response.data.message,
        confirmButtonText: "Continue to Login",
      });

      navigate("/sign-in"); // Redirect to sign-in page
    } catch (error) {
      // Handle signup errors with SweetAlert2
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.response?.data?.error || "An error occurred. Please try again.",
        confirmButtonText: "Try Again",
      });
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <section className="auth bg-base d-flex flex-wrap">
      <div className="auth-left d-lg-block d-none">
        <div className="d-flex align-items-center flex-column h-100 justify-content-center">
          <img src="assets/images/auth/auth-img.png" alt="" />
        </div>
      </div>
      <div className="auth-right py-32 px-24 d-flex flex-column justify-content-center">
        <div className="max-w-464-px mx-auto w-100">
          <div>
            <Link to="/" className="mb-40 max-w-290-px">
              <img src="assets/images/logo.png" alt="" />
            </Link>
            <h4 className="mb-12">Sign Up to your Account</h4>
            <p className="mb-32 text-secondary-light text-lg">
              Welcome! Please enter your details.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="icon-field mb-16">
              <span className="icon top-50 translate-middle-y">
                <Icon icon="f7:person" />
              </span>
              <input
                type="text"
                className="form-control h-56-px bg-neutral-50 radius-12"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Email Input */}
            <div className="icon-field mb-16">
              <span className="icon top-50 translate-middle-y">
                <Icon icon="mage:email" />
              </span>
              <input
                type="email"
                className="form-control h-56-px bg-neutral-50 radius-12"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Input */}
            <div className="mb-20">
              <div className="position-relative">
                <div className="icon-field">
                  <span className="icon top-50 translate-middle-y">
                    <Icon icon="solar:lock-password-outline" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control h-56-px bg-neutral-50 radius-12"
                    id="your-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <span
                  onClick={togglePasswordVisibility}
                  className={`toggle-password cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 ${
                    showPassword ? "ri-eye-off-line" : "ri-eye-line"
                  }`}
                  style={{ fontSize: "1.5rem", color: "#6c757d" }}
                />
              </div>
              <span className="mt-12 text-sm text-secondary-light d-block">
                Your password must have at least 8 characters.
              </span>
            </div>

            {/* Confirm Password Input */}
            <div className="mb-20">
              <div className="position-relative">
                <div className="icon-field">
                  <span className="icon top-50 translate-middle-y">
                    <Icon icon="solar:lock-password-outline" />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`form-control h-56-px bg-neutral-50 radius-12 ${
                      confirmPassword && !passwordMatch ? "border-danger" : ""
                    }`}
                    id="confirm-password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <span
                  onClick={toggleConfirmPasswordVisibility}
                  className={`toggle-password cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 ${
                    showConfirmPassword ? "ri-eye-off-line" : "ri-eye-line"
                  }`}
                  style={{ fontSize: "1.5rem", color: "#6c757d" }}
                />
              </div>
              {confirmPassword && !passwordMatch && (
                <span className="mt-12 text-sm text-danger d-block">
                  Passwords do not match
                </span>
              )}
              {confirmPassword && passwordMatch && password && (
                <span className="mt-12 text-sm text-success d-block">
                  ✓ Passwords match
                </span>
              )}
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="form-check style-check d-flex align-items-start">
              <input
                className="form-check-input border border-neutral-300 mt-4"
                type="checkbox"
                id="condition"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                required
              />
              <label className="form-check-label text-sm" htmlFor="condition">
                By creating an account, you agree to the{" "}
                <Link to="/terms-condition" className="text-primary-600 fw-semibold">
                  Terms & Conditions
                </Link>{" "}
                and our{" "}
                <Link to="/privacy-policy" className="text-primary-600 fw-semibold">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32"
            >
              Sign Up
            </button>

            {/* Sign In Link */}
            <div className="mt-32 text-center text-sm">
              <p className="mb-0">
                Already have an account?{" "}
                <Link to="/sign-in" className="text-primary-600 fw-semibold">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignUpLayer;
