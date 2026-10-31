import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import Icono from "./Icono";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { sesion, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  const cerrarMenu = () => setMenuAbierto(false);

  function salir() {
    cerrarSesion();
    cerrarMenu();
    navigate("/salones");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-left">
          <button
            className="admin-menu-button"
            type="button"
            aria-label="Abrir menú de administración"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <Icono nombre="menu" />
          </button>
          <Link className="brand" to="/admin" aria-label="Festia, panel de administración" onClick={cerrarMenu}>
            <span className="brand-mark"><Icono nombre="sparkle" size={17} /></span>
            <span>Festia</span>
          </Link>
        </div>

        <nav className="admin-header-nav" aria-label="Navegación principal">
          <NavLink to="/admin" end>Admin</NavLink>
          <Link to="/salones">Salones</Link>
          <Link to="/salones#contacto">Contacto</Link>
        </nav>

        <div className="admin-header-user">
          <span className="admin-user-name">{sesion?.nombre}</span>
          <button className="admin-logout" type="button" onClick={salir}>
            Salir
          </button>
        </div>
      </header>

      <div className="admin-body">
        {menuAbierto && <div className="admin-overlay" onClick={cerrarMenu} />}

        <aside className={`admin-sidebar${menuAbierto ? " open" : ""}`}>
          <p className="admin-sidebar-title">Administración</p>
          <nav className="admin-sidebar-nav" aria-label="Menú de administración">
            <NavLink to="/admin" end onClick={cerrarMenu}>Panel</NavLink>
            <NavLink to="/admin/salones" onClick={cerrarMenu}>Salones</NavLink>
            <NavLink to="/admin/turnos" onClick={cerrarMenu}>Turnos</NavLink>
            <NavLink to="/admin/turnos" onClick={cerrarMenu}>Turnos</NavLink>
            <NavLink to="/admin/estadisticas" onClick={cerrarMenu}>Estadísticas</NavLink>
            <NavLink to="/admin/historial-reservas" onClick={cerrarMenu}>Historial por salón</NavLink>
            <NavLink to="/admin/clientes" onClick={cerrarMenu}>Historial por cliente</NavLink>
            <NavLink to="/admin/mi-salon" onClick={cerrarMenu}>Mi salón</NavLink>
            <NavLink to="/admin/solicitudes" onClick={cerrarMenu}>Solicitudes</NavLink>
          </nav>

          <div className="admin-sidebar-extra">
            <p className="admin-sidebar-title">Sitio</p>
            <nav className="admin-sidebar-nav" aria-label="Sitio público">
              <Link to="/salones" onClick={cerrarMenu}>Ver salones</Link>
              <Link to="/salones#contacto" onClick={cerrarMenu}>Contacto</Link>
            </nav>
          </div>
        </aside>

        <div className="admin-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}