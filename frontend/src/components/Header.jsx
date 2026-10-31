import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePerfil, esStaff } from '../lib/usePerfil'
import Campana from './Campana'

const etiqueta = { usuario: 'Usuario', salon: 'Salón', admin: 'Admin', superadmin: 'Superadmin' }

export default function Header() {
  const nav = useNavigate()
  const { user, perfil } = usePerfil()
  const salir = async () => { await supabase.auth.signOut(); nav('/') }

  return (
    <header className='sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm'>
      <Link to='/' className='font-semibold text-indigo-600'>Salones</Link>
      <nav className='flex items-center gap-3 text-sm sm:gap-4'>
        {user && <Link to='/mis-turnos'>Mis turnos</Link>}
        {perfil?.rol === 'usuario' && <Link to='/quiero-ser-salon' className='hidden sm:inline'>Publicar mi salón</Link>}
        {esStaff(perfil) && <Link to='/admin' className='rounded bg-indigo-50 px-2 py-1 text-indigo-700'>Panel</Link>}
        {user && <Campana userId={user.id} />}
        {user && perfil && <span className='hidden text-xs text-gray-400 sm:inline'>{etiqueta[perfil.rol]}</span>}
        {user ? <button onClick={salir}>Salir</button> : <Link to='/login'>Entrar</Link>}
      </nav>
    </header>
  )
}