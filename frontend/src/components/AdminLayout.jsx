import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLayout() {
  const [abierto, setAbierto] = useState(false)
  const { sesion, esSuperadmin, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  function salir() {
    cerrarSesion()
    navigate('/salones')
  }

  const cerrar = () => setAbierto(false)

  const grupos = [
    {
      titulo: 'Gestión',
      items: [
        ['/admin', 'Resumen'],
        ['/admin/turnos', 'Turnos'],
        ['/admin/historial', 'Historial'],
        ['/admin/clientes', 'Clientes'],
        ['/admin/mi-salon', 'Mi salón'],
        ...(sesion?.rol !== 'salon' ? [['/admin/salones', 'Salones']] : []),
      ],
    },
    ...(esSuperadmin
      ? [{ titulo: 'Sistema', items: [['/admin/solicitudes', 'Solicitudes']] }]
      : []),
  ]

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-left">
          <button
            className="admin-menu-button"
            type="button"
            aria-label="Menú"
            onClick={() => setAbierto(!abierto)}
          >
            ☰
          </button>
          <strong>Festia · Admin</strong>
        </div>

        <nav className="admin-header-nav">
          <Link to="/salones">Ver sitio</Link>
        </nav>

        <div className="admin-header-user">
          <span className="admin-user-name">{sesion?.nombre}</span>
          <button className="admin-logout" type="button" onClick={salir}>Salir</button>
        </div>
      </header>

      <div className="admin-body">
        <aside className={'admin-sidebar' + (abierto ? ' open' : '')}>
          {grupos.map((g) => (
            <div key={g.titulo} style={{ marginBottom: 20 }}>
              <p className="admin-sidebar-title">{g.titulo}</p>
              <nav className="admin-sidebar-nav">
                {g.items.map(([to, label]) => (
                  <NavLink key={to} to={to} end={to === '/admin'} onClick={cerrar}>
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}

          <div className="admin-sidebar-extra">
            <nav className="admin-sidebar-nav">
              <Link to="/salones" onClick={cerrar}>Ver sitio</Link>
            </nav>
          </div>
        </aside>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>

      {abierto && <div className="admin-overlay" onClick={cerrar} />}
    </div>
  )
}