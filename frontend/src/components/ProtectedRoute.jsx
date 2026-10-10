
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken, getUser } from "../api";

export default function ProtectedRoute({ role }) {
  const location = useLocation();
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/books"} replace />;
  }

  return <Outlet />;
}
