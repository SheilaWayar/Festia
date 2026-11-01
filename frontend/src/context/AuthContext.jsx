import { supabase } from "../services/api";
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Roles que pueden entrar al panel: salón, admin y superadmin
const ROLES_PANEL = ["salon", "admin", "superadmin"];

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => {
    const token = localStorage.getItem("token");
    return token
      ? {
          token,
          rol: localStorage.getItem("rol"),
          nombre: localStorage.getItem("nombre"),
        }
      : null;
  });

  // datos = respuesta del login: { access_token, rol, nombre }
  function iniciarSesion(datos) {
    localStorage.setItem("token", datos.access_token);
    localStorage.setItem("rol", datos.rol);
    localStorage.setItem("nombre", datos.nombre);
    setSesion({ token: datos.access_token, rol: datos.rol, nombre: datos.nombre });
  }

  function cerrarSesion() {
    // cierra también la sesión de Supabase, si no queda abierta
    supabase.auth.signOut();
    ["token", "rol", "nombre"].forEach((k) => localStorage.removeItem(k));
    setSesion(null);
  }

  const esAdmin = ROLES_PANEL.includes(sesion?.rol);
  const esSuperadmin = sesion?.rol === "superadmin";

  return (
    <AuthContext.Provider
      value={{ sesion, esAdmin, esSuperadmin, iniciarSesion, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);