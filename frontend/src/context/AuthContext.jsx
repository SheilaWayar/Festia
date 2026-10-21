import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

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

  // datos = respuesta del backend: { access_token, rol, nombre }
  function iniciarSesion(datos) {
    localStorage.setItem("token", datos.access_token);
    localStorage.setItem("rol", datos.rol);
    localStorage.setItem("nombre", datos.nombre);
    setSesion({ token: datos.access_token, rol: datos.rol, nombre: datos.nombre });
  }

  function cerrarSesion() {
    ["token", "rol", "nombre"].forEach((k) => localStorage.removeItem(k));
    setSesion(null);
  }

  return (
    <AuthContext.Provider
      value={{ sesion, esAdmin: sesion?.rol === "admin", iniciarSesion, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
