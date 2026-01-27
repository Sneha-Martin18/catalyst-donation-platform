import { useState } from "react";
import api from "../../api/api";

function AadhaarVerification({ profile, onVerified }) {
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [displayOtp, setDisplayOtp] = useState("");
  const [showOtpNotification, setShowOtpNotification] = useState(false);

  const handleSendOtp = async () => {
    if (aadhaarLast4.length !== 4 || !/^\d+$/.test(aadhaarLast4)) {
      setError("Please enter valid 4-digit Aadhaar number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/users/aadhaar/generate-otp/", {
        aadhaar_last4: aadhaarLast4,
      });
      
      // Extract OTP from response if backend returns it
      const otpValue = response.data?.otp || response.data?.code;
      if (otpValue) {
        setDisplayOtp(otpValue);
        setShowOtpNotification(true);
        // Auto-hide notification after 10 seconds
        setTimeout(() => setShowOtpNotification(false), 10000);
      }
      
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
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
      await api.post("/users/aadhaar/verify-otp/", {
        otp: otp,
      });
      onVerified?.();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (profile?.aadhaar_verified) {
    return (
      <div className="aadhaar-section">
        <h3>Aadhaar Verification</h3>
        <div className="aadhaar-verified-badge">
          <span className="verified-icon">✓</span>
          <span className="verified-text">Aadhaar Verified</span>
          {profile?.aadhaar_last4 && (
            <span className="aadhaar-display">•••• {profile.aadhaar_last4}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="aadhaar-section">
      <h3>Aadhaar Verification</h3>
      <p className="aadhaar-description">
        Verify your Aadhaar to enhance your profile credibility
      </p>

      {/* OTP Notification */}
      {showOtpNotification && displayOtp && (
        <div className="otp-notification">
          <div className="otp-notification-content">
            <span className="otp-notification-icon">📱</span>
            <div className="otp-notification-text">
              <strong>Your OTP:</strong>
              <div className="otp-code">{displayOtp}</div>
              <small>This notification will close in 10 seconds</small>
            </div>
            <button 
              className="otp-notification-close"
              onClick={() => setShowOtpNotification(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-message error-inline">{error}</div>}

      {!otpSent ? (
        <div className="aadhaar-form">
          <div className="form-group">
            <label htmlFor="aadhaar-input">Enter Aadhaar Last 4 Digits:</label>
            <div className="input-wrapper">
              <input
                id="aadhaar-input"
                type="text"
                maxLength="4"
                value={aadhaarLast4}
                onChange={(e) => {
                  setAadhaarLast4(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="XXXX"
                className="form-input"
                disabled={loading}
              />
              <button
                onClick={handleSendOtp}
                disabled={loading || aadhaarLast4.length !== 4}
                className="btn-primary"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="aadhaar-form">
          <div className="form-group">
            <label htmlFor="otp-input">Enter OTP:</label>
            <p className="otp-hint">
              A 6-digit OTP has been sent to your registered email/phone
            </p>
            <div className="input-wrapper">
              <input
                id="otp-input"
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="Enter 6-digit OTP"
                className="form-input"
                disabled={loading}
              />
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="btn-primary"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
            <button
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setAadhaarLast4("");
                setError("");
              }}
              className="btn-secondary-small"
              disabled={loading}
            >
              Back to Aadhaar Input
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AadhaarVerification;
