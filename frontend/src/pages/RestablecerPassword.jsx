import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { registroApi } from "../services/registroApi";

const MIN_PASS = 8;

export default function RestablecerPassword() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState("verificando"); // verificando | listo | invalido | terminado
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Al llegar desde el enlace del mail, Supabase abre una sesión temporal de recuperación
  useEffect(() => {
    let vivo = true;

    const { data: sub } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (!vivo) return;
      if (evento === "PASSWORD_RECOVERY" || (evento === "SIGNED_IN" && sesion)) setEstado("listo");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (vivo && data.session) setEstado("listo");
    });

    // Si en unos segundos no hay sesión, el enlace no sirve (vencido o ya usado)
    const espera = setTimeout(() => {
      if (vivo) setEstado((e) => (e === "verificando" ? "invalido" : e));
    }, 4000);

    return () => {
      vivo = false;
      clearTimeout(espera);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (password.length < MIN_PASS) return setError(`La contraseña debe tener al menos ${MIN_PASS} caracteres.`);
    if (password !== confirmar) return setError("Las contraseñas no coinciden.");

    setEnviando(true);
    try {
      await registroApi.cambiarPassword(password);
      // Se cierra la sesión temporal para que ingrese con la contraseña nueva
      await supabase.auth.signOut();
      ["token", "rol", "nombre"].forEach((k) => localStorage.removeItem(k));
      setEstado("terminado");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <h3 style={{ marginBottom: 20 }}>Nueva contraseña</h3>

        {estado === "verificando" && <p className="ayuda">Verificando el enlace…</p>}

        {estado === "invalido" && (
          <>
            <p className="form-msg">El enlace venció o ya fue usado. Pedí uno nuevo desde el ingreso.</p>
            <Link className="primary-button" to="/login">Volver a ingresar</Link>
          </>
        )}

        {estado === "terminado" && (
          <p className="form-msg is-ok">Contraseña actualizada. Te llevamos al ingreso…</p>
        )}

        {estado === "listo" && (
          <form onSubmit={enviar} noValidate>
            <label>
              Contraseña nueva (mínimo {MIN_PASS} caracteres)
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label>
              Repetir contraseña
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <p className="form-msg" role="alert">{error}</p>
            <button className="primary-button" type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}