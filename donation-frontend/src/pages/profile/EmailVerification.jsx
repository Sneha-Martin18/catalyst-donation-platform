import { useState } from "react";
import api from "../../api/api";

function EmailVerification({ profile, onVerified }) {
  const [email, setEmail] = useState(profile?.email || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtpNotification, setShowOtpNotification] = useState(false);

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/users/email/generate-otp/", {
        email: email,
      });

      if (response.data) {
        setShowOtpNotification(true);
        setTimeout(() => setShowOtpNotification(false), 8000);
      }

      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/users/email/verify-otp/", {
        otp: otp,
      });
      onVerified?.();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Invalid or expired OTP. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.is_verified) {
    return null;
  }

  return (
    <div className="verification-section">
      <h3 className="section-title">Email Verification</h3>
      <p className="section-description">
        Verify your email address to secure your account and access all features.
      </p>

      {/* Status Notification */}
      {showOtpNotification && (
        <div className="otp-notification-toast">
          <div className="toast-content">
            <span className="toast-icon">📧</span>
            <div className="toast-text">
              <strong>Email Sent!</strong>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Check your inbox for the 6-digit verification code.</p>
            </div>
            <button
              className="toast-close"
              onClick={() => setShowOtpNotification(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {error && <div className="verification-error">{error}</div>}

      {!otpSent ? (
        <div className="verification-form">
          <div className="form-input-group">
            <label>Enter Registered Email:</label>
            <div className="input-with-button">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="example@email.com"
                className="verification-input"
                disabled={loading}
              />
              <button
                onClick={handleSendOtp}
                disabled={loading || !email}
                className="btn-verify-action"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="verification-form">
          <div className="form-input-group">
            <label>Enter 6-Digit OTP:</label>
            <p className="helper-text">
              We've sent a verification code to <strong>{email}</strong>
            </p>
            <div className="input-with-button">
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="000000"
                className="verification-input otp-style"
                disabled={loading}
              />
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="btn-verify-action"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
            <button
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setError("");
              }}
              className="btn-link-action"
              disabled={loading}
            >
              Change Email / Resend
            </button>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .verification-section {
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
        }
        .section-title {
          font-size: 1.1rem;
          color: #1e293b;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .section-description {
          font-size: 0.9rem;
          color: #64748b;
          margin-bottom: 20px;
        }
        .verified-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          border-radius: 8px;
          font-weight: 500;
        }
        .badge-icon {
          font-size: 1.2rem;
        }
        .verified-email {
          margin-left: auto;
          font-size: 0.85rem;
          color: #166534;
          opacity: 0.8;
        }
        .form-input-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: #475569;
          margin-bottom: 8px;
        }
        .input-with-button {
          display: flex;
          gap: 10px;
        }
        .verification-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        .verification-input:focus {
          outline: none;
          border-color: #0d9488;
          box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.1);
        }
        .otp-style {
          letter-spacing: 4px;
          font-weight: 600;
          text-align: center;
        }
        .btn-verify-action {
          padding: 10px 20px;
          background: #0d9488;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-verify-action:hover:not(:disabled) {
          background: #0f766e;
        }
        .btn-verify-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .helper-text {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 12px;
        }
        .btn-link-action {
          background: none;
          border: none;
          color: #0d9488;
          font-size: 0.85rem;
          font-weight: 500;
          margin-top: 12px;
          cursor: pointer;
          padding: 0;
        }
        .btn-link-action:hover {
          text-decoration: underline;
        }
        .verification-error {
          padding: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 16px;
        }
        .otp-notification-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          background: #1e293b;
          color: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out;
          border-left: 4px solid #0d9488;
        }
        .toast-content {
          display: flex;
          gap: 15px;
          align-items: flex-start;
          min-width: 250px;
        }
        .toast-icon {
          font-size: 1.5rem;
        }
        .toast-text strong {
          display: block;
          font-size: 0.9rem;
          margin-bottom: 4px;
        }
        .otp-display-code {
          font-size: 1.4rem;
          font-family: monospace;
          color: #2dd4bf;
          font-weight: 700;
          letter-spacing: 2px;
        }
        .toast-close {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default EmailVerification;
