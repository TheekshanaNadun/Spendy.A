import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
axios.defaults.withCredentials = true;

const SignInLayer = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpHash, setOtpHash] = useState("");
  const navigate = useNavigate();
  const otpHashRef = useRef("");

  useEffect(() => {
    if (otpHash) {
      otpHashRef.current = otpHash;
    }
  }, [otpHash]);

  const handleOTPVerification = async (otp) => {
    try {
      const response = await axios.post("http://localhost:5000/api/verify-otp", {
        email,
        otp,
        otpHash: otpHashRef.current
      });
  
      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Login Successful!",
          timer: 1500,
          showConfirmButton: false
        });
        window.location.href = "http://localhost:3000/dashboard?showWelcome=true";      } else {
        // Handle backend validation failure
        Swal.fire({
          icon: "error",
          title: "Invalid OTP",
          text: "The code you entered is incorrect",
          confirmButtonText: "Try Again"
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Verification failed. Please try again.";
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: errorMessage,
        confirmButtonText: "Try Again"
      });
    }
  };
  
  const showOTPModal = () => {
    Swal.fire({
      title: "Verify Your Email",
      html: `
        <div class="text-center">
          <p>We sent a 6-digit code to<br/><strong>${email}</strong></p>
          <input 
            type="text" 
            id="otp" 
            class="swal2-input  'swal2-inputerror' : ''}" 
            placeholder="Enter OTP"
            maxLength="6"
            pattern="\\d*"
            inputMode="numeric"
            style="width: 80%; letter-spacing: 10px; text-align: center; font-size: 24px;"
          >
          <p class="text-muted mt-3">Didn't receive code? <a href="#!" id="resend-link">Resend</a></p>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: false,
      confirmButtonText: "Verify",
      preConfirm: async () => {
        const otp = Swal.getPopup().querySelector('#otp').value;
        if (!/^\d{6}$/.test(otp)) {
          Swal.showValidationMessage("Please enter a valid 6-digit code");
          return false;
        }
        return otp;
      },
      didOpen: () => {
        const input = document.getElementById('otp');
        input.addEventListener('input', (e) => {
          e.target.value = e.target.value.replace(/\D/g, '');
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        handleOTPVerification(result.value);
      }
    });
  };
  
  // Updated handleSubmit with loading state
  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingSwal = Swal.fire({
      title: 'Authenticating...',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; padding: 20px;">
          <div style="display: flex; gap: 6px;">
            <div style="width: 15px; height: 15px; border-radius: 50%; background:rgb(59, 203, 172);
                        animation: pulse 1s ease-in-out infinite;
                        opacity: 0.6;">
            </div>
            <div style="width: 15px; height: 15px; border-radius: 50%; background: #4318FF;
                        animation: pulse 1s ease-in-out infinite;
                        animation-delay: 0.2s;
                        opacity: 0.6;">
            </div>
            <div style="width: 15px; height: 15px; border-radius: 50%; background:rgb(252, 89, 255);
                        animation: pulse 1s ease-in-out infinite;
                        animation-delay: 0.4s;
                        opacity: 0.6;">
            </div>
          </div>
          <p style="margin-top: 20px; color: #718096; font-size: 14px; font-weight: 500;">
            Please wait while we verify your credentials
          </p>
        </div>
    
        <style>
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(0.8); opacity: 0.5; }
          }
        </style>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      width: '700px',
      background: '#ffffff',
      customClass: {
        popup: 'animated fadeInDown',
        title: 'swal2-title-custom'
      },
      backdrop: `
        rgba(67, 24, 255, 0.1)
      `
    });
    
  
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email,
        password
      });
  
      
        if (response.data.otpRequired) {
        setOtpHash(response.data.otpHash);
        otpHashRef.current = response.data.otpHash;
        showOTPModal();
        
        } else if (response.data.success) {
          localStorage.setItem("token", response.data.token); // Add this line
          navigate("/dashboard?showWelcome=true");
        }
        loadingSwal.close();
    } catch (error) {
      loadingSwal.close();
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.error || "Invalid credentials",
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
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text/plain');
                  setEmail(pastedText);
                  e.target.value = pastedText;
                }}
                required
              />
            </div>

            <div className="position-relative mb-20">
              <div className="icon-field">
                <span className="icon top-50 translate-middle-y">
                  <Icon icon="solar:lock-password-outline" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control h-56-px bg-neutral-50 radius-12"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text/plain');
                    setPassword(pastedText);
                    e.target.value = pastedText;
                  }}
                  required
                />
              </div>
              <span
                onClick={() => setShowPassword(!showPassword)}
                className={`toggle-password cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 ${
                  showPassword ? "ri-eye-off-line" : "ri-eye-line"
                }`}
                style={{ fontSize: "1.5rem", color: "#6c757d" }}
              />
            </div>

            <div className="d-flex justify-content-between gap-2">
              <div className="form-check style-check d-flex align-items-center">
                <input
                  className="form-check-input border border-neutral-300"
                  type="checkbox"
                  id="remember"
                />
                <label className="form-check-label" htmlFor="remember">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-primary-600 fw-medium">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32"
            >
              Sign In
            </button>

            <div className="mt-32 text-center text-sm">
              <p className="mb-0">
                Don't have an account?{" "}
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
