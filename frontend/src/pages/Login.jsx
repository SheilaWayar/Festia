import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../services/authApi";
import { registroApi } from "../services/registroApi";
import { useAuth } from "../context/AuthContext";

const RE_EMAIL = /^\S+@\S+\.\S+$/;
const MIN_PASS = 8;

// Fecha de hoy en hora local (YYYY-MM-DD)
const hoyISO = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function validarLogin(d) {
  const e = {};
  if (!RE_EMAIL.test(d.email.trim())) e.email = "Ingresá un correo válido.";
  if (d.password.length < MIN_PASS) e.password = `La contraseña debe tener al menos ${MIN_PASS} caracteres.`;
  return e;
}

function validarRegistro(d) {
  const e = validarLogin(d);
  if (d.nombre.trim().length < 2) e.nombre = "Ingresá tu nombre.";
  if (d.apellido.trim().length < 2) e.apellido = "Ingresá tu apellido.";
  if (!/^\d{7,9}$/.test(d.dni.replace(/\D/g, ""))) e.dni = "El DNI son 7 a 9 números.";
  if (!d.fecha_nacimiento || d.fecha_nacimiento > hoyISO() || d.fecha_nacimiento < "1900-01-01")
    e.fecha_nacimiento = "Ingresá una fecha válida.";
  if (d.direccion.trim().length < 5) e.direccion = "Ingresá tu dirección.";
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

  const [tab, setTab] = useState("login"); // "login" | "registro" | "recuperar"
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState({ texto: "", ok: false });
  const [enviando, setEnviando] = useState(false);

  function cambiarTab(nombre) {
    setTab(nombre);
    setErrores({});
    setMensaje({ texto: "", ok: false });
  }

  async function enviar(e) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.currentTarget));

    // ----- Recuperar contraseña -----
    if (tab === "recuperar") {
      const email = datos.email.trim();
      if (!RE_EMAIL.test(email)) return setErrores({ email: "Ingresá un correo válido." });
      setErrores({});
      setEnviando(true);
      try {
        await registroApi.enviarRecuperacion(email);
        // Mensaje igual exista o no la cuenta, para no revelar qué correos están registrados
        setMensaje({
          texto: "Si ese correo tiene una cuenta, te enviamos un enlace para elegir una contraseña nueva. Revisá también el spam.",
          ok: true,
        });
      } catch (err) {
        setMensaje({ texto: err.message, ok: false });
      } finally {
        setEnviando(false);
      }
      return;
    }

    // ----- Ingresar / Crear cuenta -----
    const errs = tab === "login" ? validarLogin(datos) : validarRegistro(datos);
    setErrores(errs);
    setMensaje({ texto: "", ok: false });
    if (Object.keys(errs).length) return;

    const email = datos.email.trim();
    setEnviando(true);
    try {
      if (tab === "registro") {
        const { requiereConfirmacion } = await registroApi.crearCuenta({
          nombre: datos.nombre.trim(),
          apellido: datos.apellido.trim(),
          dni: datos.dni.replace(/\D/g, ""),
          fecha_nacimiento: datos.fecha_nacimiento,
          direccion: datos.direccion.trim(),
          email,
          password: datos.password,
        });
        if (requiereConfirmacion) {
          setTab("login");
          setMensaje({
            texto: "Cuenta creada. Te enviamos un correo para confirmarla; después ingresá acá.",
            ok: true,
          });
          return;
        }
      }

      const respuesta = await authApi.login(email, datos.password);
      // Si falla, no bloquea el ingreso: el guard le pedirá completar sus datos
      await registroApi.sincronizarDatos().catch(() => {});
      iniciarSesion(respuesta);
      navigate(destino, { replace: true });
    } catch (err) {
      setMensaje({ texto: err.message, ok: false });
    } finally {
      setEnviando(false);
    }
  }

  const esLogin = tab === "login";
  const esRegistro = tab === "registro";
  const esRecuperar = tab === "recuperar";

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!esRegistro}
            className={!esRegistro ? "is-active" : ""} onClick={() => cambiarTab("login")}>
            Ingresar
          </button>
          <button type="button" role="tab" aria-selected={esRegistro}
            className={esRegistro ? "is-active" : ""} onClick={() => cambiarTab("registro")}>
            Crear cuenta
          </button>
        </div>

        <form key={tab} onSubmit={enviar} noValidate>
          {esRecuperar && (
            <>
              <p className="ayuda">
                Escribí el correo de tu cuenta y te enviamos un enlace para elegir una contraseña nueva.
              </p>
              <Campo etiqueta="Correo electrónico" nombre="email" tipo="email"
                autoComplete="email" placeholder="tu@email.com" error={errores.email} />
            </>
          )}

          {esRegistro && (
            <>
              <div className="fila-2">
                <Campo etiqueta="Nombre" nombre="nombre" autoComplete="given-name"
                  placeholder="Tu nombre" error={errores.nombre} />
                <Campo etiqueta="Apellido" nombre="apellido" autoComplete="family-name"
                  placeholder="Tu apellido" error={errores.apellido} />
              </div>
              <div className="fila-2">
                <Campo etiqueta="DNI" nombre="dni" inputMode="numeric"
                  placeholder="Sin puntos" error={errores.dni} />
                <Campo etiqueta="Fecha de nacimiento" nombre="fecha_nacimiento" tipo="date"
                  max={hoyISO()} autoComplete="bday" error={errores.fecha_nacimiento} />
              </div>
              <Campo etiqueta="Dirección" nombre="direccion" autoComplete="street-address"
                placeholder="Calle, número y ciudad" error={errores.direccion} />
            </>
          )}

          {!esRecuperar && (
            <>
              <Campo etiqueta="Correo electrónico" nombre="email" tipo="email"
                autoComplete="email" placeholder="tu@email.com" error={errores.email} />
              <Campo etiqueta={esLogin ? "Contraseña" : `Contraseña (mínimo ${MIN_PASS} caracteres)`}
                nombre="password" tipo="password"
                autoComplete={esLogin ? "current-password" : "new-password"} error={errores.password} />
              {esRegistro && (
                <Campo etiqueta="Repetir contraseña" nombre="confirmar" tipo="password"
                  autoComplete="new-password" error={errores.confirmar} />
              )}
            </>
          )}

          <p className={`form-msg${mensaje.ok ? " is-ok" : ""}`} role="alert">{mensaje.texto}</p>

          <button className="primary-button" type="submit" disabled={enviando}>
            {enviando
              ? "Enviando..."
              : esRecuperar ? "Enviar enlace" : esLogin ? "Ingresar" : "Crear cuenta"}
          </button>

          {esLogin && (
            <button type="button" className="link-olvide" onClick={() => cambiarTab("recuperar")}>
              ¿Olvidaste tu contraseña?
            </button>
          )}
          {esRecuperar && (
            <button type="button" className="link-olvide" onClick={() => cambiarTab("login")}>
              Volver a ingresar
            </button>
          )}
        </form>
      </div>
    </div>
  );
}