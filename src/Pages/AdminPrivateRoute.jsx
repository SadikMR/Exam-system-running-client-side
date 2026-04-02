import { jwtDecode } from "jwt-decode";
import { Navigate } from "react-router-dom";

const isAuthenticated = () => {
  const adminToken = localStorage.getItem("adminToken");
  if (!adminToken) return false;

  try {
    const decoded = jwtDecode(adminToken);
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      localStorage.removeItem("adminToken");
      return false;
    }
    if (decoded.role !== "admin" && decoded.role != "editor") return false;
    return true;
  } catch (error) {
    console.error("Error decoding token:", error);
    localStorage.removeItem("adminToken");
    return false;
  }
};

const AdminPrivateRoute = ({ children }) => {
  const auth = isAuthenticated();
  if (!auth) return <Navigate to="/admin/login" replace />;
  return children;
};

export default AdminPrivateRoute;
