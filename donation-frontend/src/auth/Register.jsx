import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api.js";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");

    if (token && role) {
      navigate(`/dashboard/${role}`);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setErrors({
      ...errors,
      [e.target.name]: null,
      non_field_errors: null,
    });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = ["Username is required"];
    } else if (formData.username.trim().length < 3) {
      newErrors.username = ["Username must be at least 3 characters"];
    }

    if (!formData.email.trim()) {
      newErrors.email = ["Email is required"];
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = ["Please enter a valid email address"];
    }

    if (!formData.password) {
      newErrors.password = ["Password is required"];
    } else if (formData.password.length < 7) {
      newErrors.password = ["Password must be at least 7 characters"];
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = ["Password must contain at least one number"];
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = ["Password must contain at least one special character"];
    }

    if (!formData.password2) {
      newErrors.password2 = ["Please confirm your password"];
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = ["Passwords do not match"];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.post("users/register/", formData);

      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      navigate("/login", { replace: true, state: { message: "Registration successful! Please login." } });
    } catch (error) {
      console.log("REGISTER ERROR:", error.response?.data);
      setErrors(error.response?.data || { non_field_errors: ["Registration failed. Please try again."] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* LEFT SIDE – Features */}
      <div className="register-left">
        <div className="register-left-content">
          <div className="register-branding">
            <h1 className="register-title">CATALYST</h1>
          </div>

          <div className="register-features">
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

      {/* RIGHT SIDE – Registration Form */}
      <div className="register-right">
        <div className="register-form-wrapper">
          <div className="register-form-header">
            <h2>Create Account</h2>
            <p>Join CATALYST and make a difference</p>
          </div>

          {errors.non_field_errors && (
            <div className="alert alert-error">
              {errors.non_field_errors[0]}
            </div>
          )}

          <form onSubmit={handleRegister} className="register-form">
            {/* Username */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                className="form-input"
                disabled={loading}
              />
              {errors.username && (
                <p className="error-text">❌ {errors.username[0]}</p>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="form-input"
                disabled={loading}
              />
              {errors.email && (
                <p className="error-text">❌ {errors.email[0]}</p>
              )}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 7 chars, 1 number, 1 special char"
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
              {errors.password && (
                <p className="error-text">❌ {errors.password[0]}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="password2" className="form-label">
                Confirm Password
              </label>
              <div className="password-wrapper">
                <input
                  id="password2"
                  type={showPassword2 ? "text" : "password"}
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="form-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword2(!showPassword2)}
                  disabled={loading}
                >
                  {showPassword2 ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.password2 && (
                <p className="error-text">❌ {errors.password2[0]}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-register"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="register-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="signin-link">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="terms-text">
            By creating an account, you agree to our{" "}
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

export default Register;
