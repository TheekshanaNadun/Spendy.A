import { Icon } from '@iconify/react/dist/iconify.js'
import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'

axios.defaults.withCredentials = true

const ForgotPasswordLayer = () => {
    const [email, setEmail] = useState("")
    const [otpHash, setOtpHash] = useState("")
    const [currentStep, setCurrentStep] = useState("email") // email, otp, newPassword
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const navigate = useNavigate()
    const otpHashRef = useRef("")

    const handleForgotPassword = async (e) => {
        e.preventDefault()
        
        if (!email) {
            Swal.fire({
                icon: "error",
                title: "Email Required",
                text: "Please enter your email address",
                confirmButtonText: "OK"
            })
            return
        }

        const loadingSwal = Swal.fire({
            title: "Sending OTP...",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        try {
            const response = await axios.post("http://localhost:5000/api/forgot-password", {
                email
            })

            if (response.data.message) {
                setOtpHash(response.data.otpHash)
                otpHashRef.current = response.data.otpHash
                setCurrentStep("otp")
                loadingSwal.close()
                showOTPModal()
            }
        } catch (error) {
            loadingSwal.close()
            Swal.fire({
                icon: "error",
                title: "Failed to Send OTP",
                text: error.response?.data?.error || "An error occurred. Please try again.",
                confirmButtonText: "Try Again"
            })
        }
    }

    const handleOTPVerification = async (otp) => {
        try {
            // Store OTP for later use in password reset
            setCurrentStep("newPassword")
            showNewPasswordModal(otp)
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Verification Failed",
                text: "An error occurred during verification. Please try again.",
                confirmButtonText: "Try Again"
            })
        }
    }

    const handlePasswordReset = async (otp) => {
        if (!newPassword || !confirmPassword) {
            Swal.fire({
                icon: "error",
                title: "All Fields Required",
                text: "Please fill in all password fields",
                confirmButtonText: "OK"
            })
            return
        }

        if (newPassword !== confirmPassword) {
            Swal.fire({
                icon: "error",
                title: "Passwords Don't Match",
                text: "New password and confirm password must be the same",
                confirmButtonText: "OK"
            })
            return
        }

        if (newPassword.length < 8) {
            Swal.fire({
                icon: "error",
                title: "Password Too Short",
                text: "Password must be at least 8 characters long",
                confirmButtonText: "OK"
            })
            return
        }

        const loadingSwal = Swal.fire({
            title: "Resetting Password...",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        try {
            const response = await axios.post("http://localhost:5000/api/reset-password", {
                email,
                otp: otp,
                otpHash: otpHashRef.current,
                new_password: newPassword
            })

            if (response.data.success) {
                loadingSwal.close()
                await Swal.fire({
                    icon: "success",
                    title: "Password Reset Successful!",
                    text: "Your password has been reset successfully. You can now login with your new password.",
                    confirmButtonText: "Go to Login"
                })
                navigate("/sign-in")
            }
        } catch (error) {
            loadingSwal.close()
            Swal.fire({
                icon: "error",
                title: "Password Reset Failed",
                text: error.response?.data?.error || "An error occurred. Please try again.",
                confirmButtonText: "Try Again"
            })
        }
    }

    const showOTPModal = () => {
        Swal.fire({
            title: "Verify Your Email",
            html: `
                <div class="text-center">
                    <p>We sent a 6-digit code to<br/><strong>${email}</strong></p>
                    <input 
                        type="text" 
                        id="otp" 
                        class="swal2-input" 
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
                const otp = Swal.getPopup().querySelector('#otp').value
                if (!/^\d{6}$/.test(otp)) {
                    Swal.showValidationMessage("Please enter a valid 6-digit code")
                    return false
                }
                return otp
            },
            didOpen: () => {
                const input = document.getElementById('otp')
                input.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/\D/g, '')
                })

                // Add resend functionality
                const resendLink = document.getElementById('resend-link')
                resendLink.addEventListener('click', async (e) => {
                    e.preventDefault()
                    try {
                        const response = await axios.post("http://localhost:5000/api/forgot-password", {
                            email
                        })
                        if (response.data.message) {
                            setOtpHash(response.data.otpHash)
                            otpHashRef.current = response.data.otpHash
                            Swal.fire({
                                icon: "success",
                                title: "OTP Resent",
                                text: "A new OTP has been sent to your email",
                                timer: 2000,
                                showConfirmButton: false
                            })
                        }
                    } catch (error) {
                        Swal.fire({
                            icon: "error",
                            title: "Failed to Resend OTP",
                            text: error.response?.data?.error || "An error occurred. Please try again.",
                            confirmButtonText: "OK"
                        })
                    }
                })
            }
        }).then((result) => {
            if (result.isConfirmed) {
                handleOTPVerification(result.value)
            }
        })
    }

    const showNewPasswordModal = (otp) => {
        Swal.fire({
            title: "Set New Password",
            html: `
                <div class="text-center">
                    <p>Please enter your new password</p>
                    <input 
                        type="password" 
                        id="newPassword" 
                        class="swal2-input" 
                        placeholder="New Password"
                        style="width: 80%; margin-bottom: 10px;"
                    >
                    <input 
                        type="password" 
                        id="confirmPassword" 
                        class="swal2-input" 
                        placeholder="Confirm Password"
                        style="width: 80%;"
                    >
                </div>
            `,
            focusConfirm: false,
            showCancelButton: false,
            confirmButtonText: "Reset Password",
            preConfirm: () => {
                const newPass = Swal.getPopup().querySelector('#newPassword').value
                const confirmPass = Swal.getPopup().querySelector('#confirmPassword').value
                
                if (!newPass || !confirmPass) {
                    Swal.showValidationMessage("Please fill in all fields")
                    return false
                }
                
                if (newPass !== confirmPass) {
                    Swal.showValidationMessage("Passwords don't match")
                    return false
                }
                
                if (newPass.length < 8) {
                    Swal.showValidationMessage("Password must be at least 8 characters")
                    return false
                }
                
                return { newPassword: newPass, confirmPassword: confirmPass }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                setNewPassword(result.value.newPassword)
                setConfirmPassword(result.value.confirmPassword)
                handlePasswordReset(otp)
            }
        })
    }

    return (
        <>
            <section className="auth forgot-password-page bg-base d-flex flex-wrap">
                <div className="auth-left d-lg-block d-none">
                    <div className="d-flex align-items-center flex-column h-100 justify-content-center">
                        <img src="assets/images/auth/auth-img.png" alt="" />
                    </div>
                </div>
                <div className="auth-right py-32 px-24 d-flex flex-column justify-content-center">
                    <div className="max-w-464-px mx-auto w-100">
                        <div>
                            <h4 className="mb-12">Forgot Password</h4>
                            <p className="mb-32 text-secondary-light text-lg">
                                Enter the email address associated with your account and we will
                                send you a verification code to reset your password.
                            </p>
                        </div>
                        <form onSubmit={handleForgotPassword}>
                            <div className="icon-field">
                                <span className="icon top-50 translate-middle-y">
                                    <Icon icon="mage:email" />
                                </span>
                                <input
                                    type="email"
                                    className="form-control h-56-px bg-neutral-50 radius-12"
                                    placeholder="Enter Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32"
                            >
                                Send Verification Code
                            </button>
                            <div className="text-center">
                                <Link to="/sign-in" className="text-primary-600 fw-bold mt-24">
                                    Back to Sign In
                                </Link>
                            </div>
                            <div className="mt-120 text-center text-sm">
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
        </>
    )
}

export default ForgotPasswordLayer