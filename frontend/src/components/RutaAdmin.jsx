import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RutaAdmin({ children }) {
  const { sesion, esAdmin } = useAuth();

  if (!sesion) return <Navigate to="/login" replace />;
  if (!esAdmin) return <Navigate to="/salones" replace />;
  return children;
}
