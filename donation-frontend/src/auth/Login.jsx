// React hooks for state and lifecycle
import { useState, useEffect } from "react";

// Used to move between pages
import { useNavigate, Link } from "react-router-dom";

// Axios instance for API calls
import api from "../api/api.js";
import { useUser } from "../context/UserContext";

// Styling
import "./Login.css";

function Login() {
  // Used to redirect user after login
  const navigate = useNavigate();
  const { setUser } = useUser();

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // This runs when page loads
  // If user is already logged in, send them to dashboard
  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");

    if (token && role) {
      navigate(`/dashboard/${role}`);
    }
  }, [navigate]);

  // Validate form inputs
  const validateForm = () => {
    if (!username.trim()) {
      setError("Username is required");
      return false;
    }
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }
    return true;
  };

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Step 1: Send username & password to backend
      const response = await api.post("token/", {
        username,
        password,
      });

      // Step 2: Save tokens in browser
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      // Step 3: Ask backend who the user is
      const profileResponse = await api.get("users/profile/");
      const role = profileResponse.data.role;

      // Step 4: Save metadata
      localStorage.setItem("role", role);
      localStorage.setItem("user_id", profileResponse.data.id);
      localStorage.setItem("username", profileResponse.data.username);

      // Step 5: Update Context
      setUser(profileResponse.data);

      // Step 6: Go to correct dashboard
      navigate(`/dashboard/${role}`);
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response:", err.response);
      console.error("Error status:", err.response?.status);
      console.error("Error data:", err.response?.data);

      if (err.response?.status === 401) {
        setError("Invalid username or password");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === "Network Error") {
        setError("Cannot connect to server. Is the backend running?");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* LEFT SIDE – Features */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-branding">
            <h1 className="login-title">CATALYST</h1>
          </div>

          <div className="login-features">
            <div className="feature-card">
              <span className="feature-emoji icon-donate">🎁</span>
              <div className="feature-content">
                <h3>Share & Give</h3>
                <p>Donate items and help those in need</p>
              </div>
            </div>
            <div className="feature-card">
              <span className="feature-emoji icon-request">🙋</span>
              <div className="feature-content">
                <h3>Request & Receive</h3>
                <p>Ask for items and get support</p>
              </div>
            </div>
            <div className="feature-card">
              <span className="feature-emoji icon-volunteer">🤝</span>
              <div className="feature-content">
                <h3>Volunteer & Help</h3>
                <p>Be part of the charitable community</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE – Login Form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>

          {/* Error Alert */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="login-form">
            {/* Username */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="form-input"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="form-footer">
              <label className="remember-label">
                <input
                  type="checkbox"
                  className="remember-checkbox"
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="forgot-link">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="signup-link">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="terms-text">
            By signing in, you agree to our{" "}
            <a href="#terms" className="terms-link">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#privacy" className="terms-link">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
