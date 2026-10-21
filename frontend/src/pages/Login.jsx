import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

const RE_EMAIL = /^\S+@\S+\.\S+$/;
const MIN_PASS = 8;

// Mismas validaciones del login original
function validarLogin(d) {
  const e = {};
  if (!RE_EMAIL.test(d.email.trim())) e.email = "Ingresá un correo válido.";
  if (d.password.length < MIN_PASS) e.password = `La contraseña debe tener al menos ${MIN_PASS} caracteres.`;
  return e;
}

function validarRegistro(d) {
  const e = validarLogin(d);
  if (d.nombre.trim().length < 3) e.nombre = "Ingresá tu nombre completo.";
  if (d.confirmar !== d.password) e.confirmar = "Las contraseñas no coinciden.";
  return e;
}

function Campo({ etiqueta, nombre, tipo = "text", error, ...resto }) {
  return (
    <label>
      {etiqueta}
      <input name={nombre} type={tipo} aria-invalid={Boolean(error)} {...resto} />
      <span className="field-error">{error}</span>
    </label>
  );
}

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.from?.pathname || "/salones";

  const [tab, setTab] = useState("login"); // "login" | "registro"
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  function cambiarTab(nombre) {
    setTab(nombre);
    setErrores({});
    setMensaje("");
  }

  async function enviar(e) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.currentTarget));
    const errs = tab === "login" ? validarLogin(datos) : validarRegistro(datos);
    setErrores(errs);
    setMensaje("");
    if (Object.keys(errs).length) return;

    setEnviando(true);
    try {
      const respuesta =
        tab === "login"
          ? await authApi.login(datos.email.trim(), datos.password)
          : await authApi.registro(datos.nombre.trim(), datos.email.trim(), datos.password);
      iniciarSesion(respuesta);
      navigate(destino, { replace: true });
    } catch (err) {
      setMensaje(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const esLogin = tab === "login";

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={esLogin}
            className={esLogin ? "is-active" : ""} onClick={() => cambiarTab("login")}>
            Ingresar
          </button>
          <button type="button" role="tab" aria-selected={!esLogin}
            className={!esLogin ? "is-active" : ""} onClick={() => cambiarTab("registro")}>
            Crear cuenta
          </button>
        </div>

        <form key={tab} onSubmit={enviar} noValidate>
          {!esLogin && (
            <Campo etiqueta="Nombre completo" nombre="nombre" autoComplete="name"
              placeholder="Tu nombre" error={errores.nombre} />
          )}
          <Campo etiqueta="Correo electrónico" nombre="email" tipo="email"
            autoComplete="email" placeholder="tu@email.com" error={errores.email} />
          <Campo etiqueta={esLogin ? "Contraseña" : `Contraseña (mínimo ${MIN_PASS} caracteres)`}
            nombre="password" tipo="password"
            autoComplete={esLogin ? "current-password" : "new-password"} error={errores.password} />
          {!esLogin && (
            <Campo etiqueta="Repetir contraseña" nombre="confirmar" tipo="password"
              autoComplete="new-password" error={errores.confirmar} />
          )}

          <p className="form-msg" role="alert">{mensaje}</p>
          <button className="primary-button" type="submit" disabled={enviando}>
            {enviando ? "Enviando..." : esLogin ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
