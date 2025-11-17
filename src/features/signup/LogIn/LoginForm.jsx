"use client";

import React, { useState } from "react";
import styles from "./LoginForm.module.scss";
import { auth } from "@/firebase/config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import OTPModal from "../OTPModal/OTPModal";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const LoginForm = ({ onContinue,setIsLoginModalVisible }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const router = useRouter()

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!phoneNumber) return alert("Enter phone number");

    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        `+91${phoneNumber}`,
        appVerifier
      );
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      setError("");
      console.log("OTP sent successfully!");
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError(err.message);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (otpValue) => {
    if (!otpValue) return alert("Enter OTP");

    try {
      // Confirm OTP with Firebase
      const result = await window.confirmationResult.confirm(otpValue);
      const user = result.user;

      console.log("User signed in:", user);
      console.log(user,"djdjdyytt")
      // Get ID token and refresh token
      const idToken = await user.getIdToken();
      console.log(idToken,"kdkdjdjdhyttr")
      const refreshToken = user.refreshToken;

      // Store tokens in cookies
      Cookies.set("idToken", idToken);
      Cookies.set("refreshToken", refreshToken);

      // Optional: store user info
      Cookies.set("phoneNumber", user.phoneNumber);

      // Continue to next step in your app
      onContinue?.();
    } catch (err) {
      console.error("OTP verification failed:", err);
      setError("Invalid OTP. Please try again.");
    }
  };

  const handleNavigate = (slug) => {
    router.push(`/info/${slug}`);
    setIsLoginModalVisible(false) // dynamic route example -> /info/about-us
  };

  return (
    <div className={styles.loginForm}>
      {!otpSent ? (
        <>
          <h2 className={styles.title}>
            Glad to have you at Print Easy. Stay tuned for exclusive offers & updates!
          </h2>
          
          <div className={styles.divider}>
            <span className={styles.dividerText}>Login or Signup</span>
          </div>

          <p className={styles.subtitle}>
            Use your email or another service to continue, signing up is free!
          </p>

          <input
            type="text"
            placeholder="Enter Mobile Number"
            className={styles.input}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          
          <div id="recaptcha-container"></div>
          
          <button className={styles.continueBtn} onClick={handleSendOtp}>
            Continue
          </button>

          <p className={styles.terms}>
            By signing in you agree to our{" "}
            <span  onClick={() => handleNavigate("terms-and-conditions")}>Terms of Service</span> and{" "}
            <span  onClick={() => handleNavigate("privacy-policy")}>Privacy Policy</span>
          </p>
        </>
      ) : (
        <>
          <OTPModal
            phoneNumber={phoneNumber}
            otp={otp} 
            setOtp={setOtp}
            handleVerifyOtp={handleVerifyOtp}
          />
        </>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default LoginForm;