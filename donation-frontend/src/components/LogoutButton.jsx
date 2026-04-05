import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function LogoutButton() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleLogout = () => {
    // Clear everything related to login
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setUser(null);

    // Go back to login page
    navigate("/login");
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}

export default LogoutButton;
