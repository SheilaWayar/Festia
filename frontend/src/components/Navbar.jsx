import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Icono from "./Icono";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { sesion, esAdmin, cerrarSesion } = useAuth();
  const [abierto, setAbierto] = useState(false);
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
        <span className="brand-mark"><Icono nombre="sparkle" size={17} /></span>
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
        {sesion && <NavLink to="/mis-turnos" onClick={cerrarMenu}>Mis turnos</NavLink>}
        {esAdmin && <NavLink to="/admin" onClick={cerrarMenu}>Admin</NavLink>}
        <Link to="/salones#contacto" onClick={cerrarMenu}>Contacto</Link>

        {sesion ? (
          <button className="nav-cta" type="button" onClick={salir}>
            Salir ({sesion.nombre}) <Icono nombre="arrow" size={16} />
          </button>
        ) : (
          <Link className="nav-cta" to="/login" onClick={cerrarMenu}>
            Ingresar <Icono nombre="arrow" size={16} />
          </Link>
        )}
      </nav>
    </header>
  );
}
