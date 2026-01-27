import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!localStorage.getItem("access");
  const userRole = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  
  // Hide navbar on login and register pages
 const isAuthPage =
  location.pathname === "/login" ||
  location.pathname === "/register" ||
  location.pathname.startsWith("/dashboard");

  
  if (isAuthPage) return null;

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* Logo Section */}
      <div className="navbar-logo" onClick={() => navigate("/")}>
        <div className="logo-icon">🎁</div>
        <span className="logo-text">CATALYST</span>
      </div>

      {/* Right Navigation */}
      <div className="navbar-right">
        {isAuthenticated ? (
          <div className="auth-section">
            <div 
              className="user-info"
              onClick={() => navigate("/profile")}
              title="View Profile"
              style={{ cursor: "pointer" }}
            >
              <span className="user-badge" title={`Role: ${userRole}`}>
                {userRole === "admin" ? "👨‍💼" : userRole === "donor" ? "🎁" : userRole === "receiver" ? "🙏" : "👤"}
              </span>
              <span className="username">{username || "User"}</span>
            </div>
            
            <button 
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              🚪 Logout
            </button>
          </div>
        ) : (
          <div className="auth-section">
            <button 
              className="nav-link login-link"
              onClick={() => navigate("/login")}
            >
              🔐 Login
            </button>
            <button 
              className="nav-link register-link"
              onClick={() => navigate("/register")}
            >
              ✍️ Register
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
