"use client";

import React, { useState } from "react";
import styles from "./LoginForm.module.scss";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import axios from "axios";

const LoginForm = ({ onContinue }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const { executeRecaptcha } = useGoogleReCaptcha();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleContinue = async () => {
    if (!executeRecaptcha) {
      console.error("Recaptcha not ready");
      return;
    }

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha("login");

      console.log(recaptchaToken, "sjjususuu");
      // Send both phone number + recaptcha token to Node backend
      const res = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=AIzaSyC-mvRzLqUwy4vddFlEXFvLEdiR1QvFFMk`,
        {
          phoneNumber: `+91${phoneNumber}`,
          recaptchaToken,
          captchaResponse: "NO_RECAPTCHA",
          clientType: "CLIENT_TYPE_WEB",
          recaptchaVersion: "RECAPTCHA_ENTERPRISE",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();
      console.log("Backend response:", data);

      if (res.ok) {
        onContinue();
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  };

  return (
    <div className={styles.loginForm}>
      <h2 className={styles.title}>
        Glad to have you at <span>Print Easy</span>.
        <br /> Stay tuned for exclusive offers & updates!
      </h2>

      <p className={styles.subtitle}>Login or Signup</p>
      <p className={styles.helper}>
        Use your email or another service to continue, signing up is free!
      </p>

      <input
        type="text"
        placeholder="Enter Mobile Number"
        className={styles.input}
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />

      <button className={styles.continueBtn} onClick={handleContinue}>
        Continue
      </button>

      <p className={styles.terms}>
        By signing in you agree to our <a href="#">Terms of Service</a> and{" "}
        <a href="#">Privacy Policy</a>.
      </p>
    </div>
  );
};

export default LoginForm;
