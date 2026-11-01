import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const f = (n) => '$' + Number(n || 0).toLocaleString('es-AR')
const dia = (d) => new Date(d + 'T00:00').toLocaleDateString('es-AR')
const hora = (h) => String(h).slice(0, 5)
const NL = String.fromCharCode(10)
const colores = {
  pendiente: 'text-yellow-600', confirmado: 'text-green-600', finalizado: 'text-blue-600',
  rechazado: 'text-red-600', cancelado: 'text-red-600',
}

function descargarCsv(filas) {
  const cab = ['Fecha', 'Desde', 'Hasta', 'Salón', 'Cliente', 'Email', 'Estado', 'Pago', 'Total', 'Pagado']
  const cuerpo = filas.map((r) =>
    [r.fecha, hora(r.hora_inicio), hora(r.hora_fin), r.salon_nombre, r.usuario_nombre, r.usuario_email,
      r.estado, r.estado_pago, r.monto_total, r.monto_pagado]
      .map((v) => String(v ?? '').replace(/,/g, ' ')).join(','))
  // el primer carácter (BOM) hace que Excel respete los acentos
  const texto = String.fromCharCode(65279) + [cab.join(','), ...cuerpo].join(NL)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }))
  a.download = 'historial-turnos.csv'
  a.click()
}

// Historial de turnos POR SALÓN: quién reservó, cuándo, estado y cuánto pagó
export default function Historial() {
  const [salones, setSalones] = useState([])
  const [salon, setSalon] = useState('')
  const [estado, setEstado] = useState('')
  const [q, setQ] = useState('')
  const [filas, setFilas] = useState([])

  useEffect(() => { supabase.rpc('resumen_salones').then(({ data }) => setSalones(data || [])) }, [])
  useEffect(() => {
    let consulta = supabase.from('turnos_detalle').select('*').order('fecha', { ascending: false })
    if (salon) consulta = consulta.eq('salon_id', Number(salon))
    consulta.then(({ data }) => setFilas(data || []))
  }, [salon])

  const visibles = filas.filter((r) =>
    (!estado || r.estado === estado) &&
    (!q || ((r.usuario_nombre || '') + ' ' + (r.usuario_email || '')).toLowerCase().includes(q.toLowerCase())))

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-2'>
        <select value={salon} onChange={(e) => setSalon(e.target.value)} className='rounded border px-2 py-1 text-sm'>
          <option value=''>Todos los salones</option>
          {salones.map((s) => <option key={s.salon_id} value={s.salon_id}>{s.nombre}</option>)}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className='rounded border px-2 py-1 text-sm'>
          <option value=''>Todos los estados</option>
          <option>pendiente</option><option>confirmado</option><option>finalizado</option>
          <option>rechazado</option><option>cancelado</option>
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Buscar cliente o email'
          className='min-w-0 flex-1 rounded border px-2 py-1 text-sm' />
        <button onClick={() => descargarCsv(visibles)} className='rounded bg-indigo-600 px-3 py-1 text-sm text-white'>Descargar CSV</button>
      </div>

      <div className='overflow-x-auto rounded-xl border bg-white'>
        <table className='w-full min-w-[800px] text-left text-sm'>
          <thead className='bg-gray-50 text-xs uppercase text-gray-500'>
            <tr><th className='p-3'>Fecha</th><th>Horario</th><th>Salón</th><th>Cliente</th><th>Estado</th><th>Pago</th><th>Total</th><th>Pagado</th></tr>
          </thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.id} className='border-t'>
                <td className='p-3'>{dia(r.fecha)}</td>
                <td>{hora(r.hora_inicio)} a {hora(r.hora_fin)}</td>
                <td>{r.salon_nombre}</td>
                <td>{r.usuario_nombre}<span className='block text-xs text-gray-400'>{r.usuario_email}</span></td>
                <td className={colores[r.estado]}>{r.estado}</td>
                <td>{r.estado_pago}</td>
                <td>{f(r.monto_total)}</td>
                <td>{f(r.monto_pagado)}</td>
              </tr>
            ))}
            {!visibles.length && <tr><td className='p-4 text-gray-400' colSpan={8}>No hay turnos para mostrar.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}