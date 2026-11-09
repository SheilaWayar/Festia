import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Icono from "./Icono";
import Campana from "./Campana";
import { useAuth } from "../context/AuthContext";
import { usePerfil } from "../lib/usePerfil";

function IconoUsuario({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

function MenuUsuario({ onSalir, onNavegar }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  // Cierra al tocar fuera o con Esc
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => {
      if (!ref.current?.contains(e.target)) setAbierto(false);
    };
    const esc = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  const ir = () => {
    setAbierto(false);
    onNavegar();
  };

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu__btn"
        aria-label="Menú de usuario"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
      >
        <IconoUsuario />
      </button>

      {abierto && (
        <div className="user-menu__panel" role="menu">
          <Link role="menuitem" to="/mi-perfil" onClick={ir}>Mis datos</Link>
          <Link role="menuitem" to="/mis-turnos" onClick={ir}>Mis turnos</Link>
          <button
            role="menuitem"
            type="button"
            className="user-menu__salir"
            onClick={() => {
              setAbierto(false);
              onSalir();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { sesion, esAdmin, cerrarSesion } = useAuth();
  const { user, perfil } = usePerfil();
  const [abierto, setAbierto] = useState(false);
  const [logoOk, setLogoOk] = useState(true); // si /logo.png no carga, se muestra el ícono de siempre
  const navigate = useNavigate();

  const cerrarMenu = () => setAbierto(false);

  function salir() {
    cerrarSesion();
    cerrarMenu();
    navigate("/salones");
  }

  return (
    <header className="site-header">
      <Link className="brand" to="/salones" aria-label="Festia, inicio" onClick={cerrarMenu}>
        {logoOk ? (
          <img
            className="brand-logo"
            src="/logo.png"
            alt=""
            onError={() => setLogoOk(false)}
          />
        ) : (
          <span className="brand-mark"><Icono nombre="sparkle" size={17} /></span>
        )}
        <span>Festia</span>
      </Link>

      <button
        className="menu-button"
        type="button"
        aria-label="Abrir menú"
        aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
      >
        <Icono nombre="menu" />
      </button>

      <nav className={`nav${abierto ? " open" : ""}`}>
        <NavLink to="/salones" onClick={cerrarMenu}>Salones</NavLink>
        <NavLink to="/servicios" onClick={cerrarMenu}>Servicios</NavLink>
        {perfil?.rol === "usuario" && (
          <NavLink to="/quiero-ser-salon" onClick={cerrarMenu}>Publicar mi salón</NavLink>
        )}
        {esAdmin && <NavLink to="/admin" onClick={cerrarMenu}>Admin</NavLink>}
        <Link to="/salones#contacto" onClick={cerrarMenu}>Contacto</Link>

        {user && <Campana userId={user.id} />}

        {sesion ? (
          <MenuUsuario onSalir={salir} onNavegar={cerrarMenu} />
        ) : (
          <Link className="nav-cta" to="/login" onClick={cerrarMenu}>
            Ingresar <Icono nombre="arrow" size={16} />
          </Link>
        )}
      </nav>
    </header>
  );
}