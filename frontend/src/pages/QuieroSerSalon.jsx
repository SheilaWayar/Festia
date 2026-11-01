import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePerfil } from '../lib/usePerfil'

const vacio = { nombre: '', descripcion: '', direccion: '', capacidad: '', precio: '', telefono: '' }
const color = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aprobada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
}

export default function QuieroSerSalon() {
  const { user, perfil, cargando } = usePerfil()
  const [f, setF] = useState(vacio)
  const [mias, setMias] = useState([])
  const [msg, setMsg] = useState('')

  const cargar = (uid) =>
    supabase.from('solicitudes_salon').select('*').eq('user_id', uid)
      .order('created_at', { ascending: false }).then(({ data }) => setMias(data || []))
  useEffect(() => { if (user) cargar(user.id) }, [user])

  if (cargando) return null
  if (!user) return <p className='p-6'>Iniciá sesión para publicar tu salón. <Link className='text-indigo-400' to='/login'>Entrar</Link></p>
  if (['admin', 'superadmin'].includes(perfil?.rol)) return <p className='p-6'>Tu cuenta ya administra la plataforma.</p>

  const hayPendiente = mias.some((s) => s.estado === 'pendiente')

  const enviar = async () => {
    setMsg('')
    if (!f.nombre.trim()) return setMsg('Poné el nombre del salón')
    const { error } = await supabase.from('solicitudes_salon').insert({
      user_id: user.id,
      nombre: f.nombre.trim(),
      descripcion: f.descripcion,
      direccion: f.direccion,
      capacidad: f.capacidad ? Number(f.capacidad) : null,
      precio: f.precio ? Number(f.precio) : null,
      telefono: f.telefono,
    })
    if (error) return setMsg(error.message)
    setF(vacio)
    setMsg('¡Solicitud enviada! Te avisamos por la campana y por mail.')
    cargar(user.id)
  }

  const campo = (k, ph, type = 'text') => (
    <input type={type} placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}
      className='w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900' />
  )

  return (
    <main className='admin-light mx-auto my-10 max-w-xl space-y-4 rounded-xl bg-gray-50 p-6 text-gray-900'>
      <h1 className='text-xl font-semibold'>Publicá tu salón</h1>
      <p className='text-sm text-gray-500'>
        Completá los datos y el equipo revisa tu solicitud. Si se aprueba, seguís entrando con tu mismo usuario y
        aparece el Panel para gestionar tus reservas.
      </p>

      {hayPendiente ? (
        <p className='rounded bg-yellow-50 p-3 text-sm text-yellow-700'>Ya tenés una solicitud pendiente de revisión.</p>
      ) : (
        <div className='space-y-2'>
          {campo('nombre', 'Nombre del salón')}
          <textarea placeholder='Descripción' value={f.descripcion}
            onChange={(e) => setF({ ...f, descripcion: e.target.value })}
            className='h-24 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900' />
          {campo('direccion', 'Dirección')}
          <div className='grid grid-cols-2 gap-2'>
            {campo('capacidad', 'Capacidad', 'number')}
            {campo('precio', 'Precio por hora ($)', 'number')}
          </div>
          {campo('telefono', 'Teléfono de contacto')}
          {msg && <p className='text-sm text-indigo-600'>{msg}</p>}
          <button onClick={enviar} className='w-full rounded bg-indigo-600 py-2 text-white'>Enviar solicitud</button>
        </div>
      )}

      {mias.length > 0 && (
        <section className='space-y-2'>
          <h2 className='font-medium'>Mis solicitudes</h2>
          {mias.map((s) => (
            <div key={s.id} className='flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-sm'>
              <span>{s.nombre}</span>
              <span className={'rounded px-2 py-0.5 text-xs ' + color[s.estado]}>{s.estado}</span>
            </div>
          ))}
        </section>
      )}
    </main>
  )
}