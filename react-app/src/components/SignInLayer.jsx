import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2"; // Import SweetAlert2

axios.defaults.withCredentials = true;

const SignInLayer = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email,
        password
      });
  
      await Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: response.data.message,
        confirmButtonText: "OK",
        allowOutsideClick: false
      });
  
      // Add a small delay before checking session
      setTimeout(async () => {
        const sessionCheck = await axios.get("http://localhost:5000/api/session-check");
        if (sessionCheck.data.authenticated) {
          navigate("/dashboard", { replace: true });
        }
      }, 100);
  
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.error || "An error occurred",
        confirmButtonText: "Try Again"
      });
    }
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
            <h4 className="mb-12">Sign In to your Account</h4>
            <p className="mb-32 text-secondary-light text-lg">
              Welcome back! Please enter your details.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
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
                onChange={(e) => setEmail(e.target.value)} // Update email state
                required
              />
            </div>

            {/* Password Input */}
            <div className="position-relative mb-20">
              <div className="icon-field">
                <span className="icon top-50 translate-middle-y">
                  <Icon icon="solar:lock-password-outline" />
                </span>
                <input
                  type={showPassword ? "text" : "password"} // Toggle between text and password types
                  className="form-control h-56-px bg-neutral-50 radius-12"
                  id="your-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // Update password state
                  required
                />
              </div>
              {/* Show/Hide Password Button */}
              <span
                onClick={() => setShowPassword(!showPassword)} // Toggle showPassword state
                className={`toggle-password cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 ${
                  showPassword ? "ri-eye-off-line" : "ri-eye-line"
                }`}
                style={{ fontSize: "1.5rem", color: "#6c757d" }}
              />
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="">
              <div className="d-flex justify-content-between gap-2">
                <div className="form-check style-check d-flex align-items-center">
                  <input
                    className="form-check-input border border-neutral-300"
                    type="checkbox"
                    id="remember"
                  />
                  <label className="form-check-label" htmlFor="remember">
                    Remember me{" "}
                  </label>
                </div>
                <Link to="#" className="text-primary-600 fw-medium">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32"
            >
              Sign In
            </button>

            {/* Social Media Sign-In */}
            <div className="mt-32 center-border-horizontal text-center">
              <span className="bg-base z-1 px-4">Or sign in with</span>
            </div>
            <div className="mt-32 d-flex align-items-center gap-3">
              {/* Facebook Button */}
              <button
                type="button"
                className="fw-semibold text-primary-light py-16 px-24 w-50 border radius-12 text-md d-flex align-items-center justify-content-center gap-12 line-height-1 bg-hover-primary-50"
              >
                <Icon
                  icon="ic:baseline-facebook"
                  className="text-primary-600 text-xl line-height-1"
                />
                Facebook
              </button>

              {/* Google Button */}
              <button
                type="button"
                className="fw-semibold text-primary-light py-16 px-24 w-50 border radius-12 text-md d-flex align-items-center justify-content-center gap-12 line-height-1 bg-hover-primary-50"
              >
                <Icon
                  icon="logos:google-icon"
                  className="text-primary-600 text-xl line-height-1"
                />
                Google
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="mt-32 text-center text-sm">
              <p className="mb-0">
                Don’t have an account?{" "}
                <Link to="/sign-up" className="text-primary-600 fw-semibold">
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignInLayer;
