import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Center minH="50vh">
        <Spinner />
      </Center>
    );
  }

  if (!user?.token) {
    // guarda a dónde iba
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = (user.role || "").toString().toUpperCase();

  if (allowedRoles.length > 0) {
    const ok = allowedRoles.map((r) => r.toUpperCase()).includes(role);
    if (!ok) {
      // si no tiene permiso, lo mando a su “home” por rol
      const dest =
        role === "ADMIN" ? "/admin" :
        role === "CONTRATISTA" ? "/empresa" :
        "/cliente";
      return <Navigate to={dest} replace />;
    }
  }

  return <Outlet />;
}
