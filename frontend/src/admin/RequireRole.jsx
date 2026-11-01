import { Navigate } from 'react-router-dom'
import { usePerfil, esStaff } from '../lib/usePerfil'

// Protege rutas del panel: salón, admin y superadmin (o solo superadmin)
export default function RequireRole({ children, soloSuperadmin = false }) {
  const { cargando, perfil } = usePerfil()
  if (cargando) return null
  const ok = soloSuperadmin ? perfil?.rol === 'superadmin' && perfil.activo : esStaff(perfil)
  if (!ok) return <Navigate to='/' />
  return (
    <div className='admin-light m-4 rounded-xl bg-gray-50 p-4 text-gray-900'>
      {children}
    </div>
  )
}