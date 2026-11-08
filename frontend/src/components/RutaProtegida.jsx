import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const faltan = (p) =>
  !p ||
  !p.nombre?.trim() ||
  !p.apellido?.trim() ||
  !p.dni?.trim() ||
  !p.fecha_nacimiento ||
  !p.direccion?.trim();

// requiereDatos = false solo para la pantalla donde se completan los datos
export default function RutaProtegida({ children, requiereDatos = true }) {
  const { sesion } = useAuth();
  const location = useLocation();

  // En la pantalla de Mis datos nunca se pide completar (evita el bucle de redirección)
  const enMisDatos = location.pathname === "/mi-perfil";
  const hayQueVerificar = requiereDatos && !enMisDatos;

  const [datos, setDatos] = useState("cargando"); // cargando | ok | incompleto

  useEffect(() => {
    if (!sesion || !hayQueVerificar) return;
    let vivo = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return vivo && setDatos("ok"); // sin sesión de Supabase no se puede verificar: no se bloquea
      const { data, error } = await supabase
        .from("perfiles")
        .select("nombre, apellido, dni, fecha_nacimiento, direccion")
        .eq("id", user.id)
        .single();
      if (!vivo) return;
      setDatos(error ? "ok" : faltan(data) ? "incompleto" : "ok");
    })();
    return () => { vivo = false; };
  }, [sesion, hayQueVerificar, location.pathname]);

  if (!sesion) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!hayQueVerificar) return children;
  if (datos === "cargando") return null;
  if (datos === "incompleto")
    return <Navigate to="/mi-perfil" state={{ desde: location.pathname, completar: true }} replace />;
  return children;
}