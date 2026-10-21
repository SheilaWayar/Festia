import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AdminLayout() {
  const [abierto, setAbierto] = useState(false)
  const [rol, setRol] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
      setRol(data?.rol)
    })
  }, [])

  // Si tus rutas de admin se llaman distinto, cambialas acá
  const grupos = [
    {
      titulo: 'Gestión',
      items: [
        ['/admin', 'Resumen'],
        ['/admin/turnos', 'Turnos'],
      ],
    },
    ...(rol === 'superadmin'
      ? [{ titulo: 'Sistema', items: [['/admin/administradores', 'Administradores']] }]
      : []),
  ]

  return (
    <div className='min-h-dvh bg-gray-50'>
      <header className='sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm'>
        <div className='flex items-center gap-3'>
          <button className='md:hidden' onClick={() => setAbierto(!abierto)} aria-label='Menú'>☰</button>
          <span className='font-semibold text-indigo-600'>Salones · Admin</span>
        </div>
        <div className='flex gap-4 text-sm text-gray-600'>
          <Link to='/'>Ver sitio</Link>
          <Link to='/contacto'>Contacto</Link>
          <button onClick={() => supabase.auth.signOut()}>Salir</button>
        </div>
      </header>

      <div className='flex'>
        <aside
          className={
            (abierto ? 'block' : 'hidden') +
            ' fixed inset-x-0 top-14 z-30 bg-white p-3 shadow md:sticky md:top-14 md:block md:h-[calc(100dvh-3.5rem)] md:w-56 md:shrink-0 md:overflow-y-auto md:border-r md:shadow-none'
          }
        >
          {grupos.map(g => (
            <div key={g.titulo} className='mb-4'>
              <p className='mb-1 px-2 text-xs font-semibold uppercase text-gray-400'>{g.titulo}</p>
              {g.items.map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin'}
                  onClick={() => setAbierto(false)}
                  className={({ isActive }) =>
                    'block rounded-lg px-3 py-2 text-sm ' +
                    (isActive ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-gray-600 hover:bg-gray-100')
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </aside>

        <main className='min-w-0 flex-1 p-4'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}