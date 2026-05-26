import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const userRole = localStorage.getItem("userRole");

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    if (userRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (userRole === "cashier") {
      return <Navigate to="/cashier/dashboard" replace />;
    }

    if (userRole === "logistics") {
      return <Navigate to="/logistics/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}