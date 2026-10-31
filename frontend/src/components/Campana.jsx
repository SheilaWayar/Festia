import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const fecha = (t) =>
  new Date(t).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function Campana({ userId }) {
  const nav = useNavigate()
  const caja = useRef(null)
  const [lista, setLista] = useState([])
  const [abierta, setAbierta] = useState(false)
  const sinLeer = lista.filter((n) => !n.leida).length

  const cargar = () =>
    supabase.from('notificaciones').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setLista(data || []))

  useEffect(() => {
    cargar()
    const canal = supabase.channel('notif-' + userId)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: 'user_id=eq.' + userId },
        () => cargar())
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [userId])

  // cerrar al tocar afuera
  useEffect(() => {
    const cerrar = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierta(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  const abrir = async (n) => {
    if (!n.leida) await supabase.from('notificaciones').update({ leida: true }).eq('id', n.id)
    setAbierta(false)
    cargar()
    if (n.link) nav(n.link)
  }

  const marcarTodas = async () => {
    await supabase.from('notificaciones').update({ leida: true }).eq('user_id', userId).eq('leida', false)
    cargar()
  }

  return (
    <div ref={caja} className='relative'>
      <button onClick={() => setAbierta(!abierta)} className='relative px-1 text-lg' aria-label='Notificaciones'>
        🔔
        {sinLeer > 0 && (
          <span className='absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white'>{sinLeer}</span>
        )}
      </button>

      {abierta && (
        <div className='absolute right-0 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border bg-white shadow-lg'>
          <div className='flex items-center justify-between border-b px-3 py-2 text-sm'>
            <b>Notificaciones</b>
            {sinLeer > 0 && <button onClick={marcarTodas} className='text-xs text-indigo-600'>Marcar todas como leídas</button>}
          </div>
          <div className='max-h-80 overflow-y-auto'>
            {lista.map((n) => (
              <button key={n.id} onClick={() => abrir(n)}
                className={'block w-full border-b px-3 py-2 text-left text-sm hover:bg-gray-50 ' + (n.leida ? '' : 'bg-indigo-50')}>
                <p className='font-medium'>{n.titulo}</p>
                <p className='text-gray-600'>{n.mensaje}</p>
                <p className='text-xs text-gray-400'>{fecha(n.created_at)}</p>
              </button>
            ))}
            {!lista.length && <p className='p-4 text-center text-sm text-gray-400'>No tenés notificaciones.</p>}
          </div>
        </div>
      )}
    </div>
  )
}