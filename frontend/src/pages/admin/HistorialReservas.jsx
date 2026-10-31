import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './adminExtra.css'

const f = (n) => '$' + Number(n || 0).toLocaleString('es-AR')
const dia = (d) => new Date(d + 'T00:00').toLocaleDateString('es-AR')
const NL = String.fromCharCode(10)
const colores = { pendiente: 'rb-yellow', confirmada: 'rb-green', cancelada: 'rb-red' }

function descargarCsv(filas) {
  const cab = ['Fecha', 'Salón', 'Cliente', 'Email', 'Estado', 'Pago', 'Total', 'Pagado']
  const cuerpo = filas.map((r) =>
    [r.fecha, r.salon, r.usuario, r.email, r.estado, r.estado_pago, r.monto_total, r.monto_pagado]
      .map((v) => String(v ?? '').replace(/,/g, ' ')).join(','))
  const texto = String.fromCharCode(65279) + [cab.join(','), ...cuerpo].join(NL)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }))
  a.download = 'historial-reservas.csv'
  a.click()
}

export default function HistorialReservas() {
  const [salones, setSalones] = useState([])
  const [salon, setSalon] = useState('')
  const [estado, setEstado] = useState('')
  const [q, setQ] = useState('')
  const [filas, setFilas] = useState([])

  useEffect(() => { supabase.rpc('resumen_salones').then(({ data }) => setSalones(data || [])) }, [])
  useEffect(() => {
    supabase.rpc('historial_reservas', { p_salon: salon || null, p_user: null })
      .then(({ data }) => setFilas(data || []))
  }, [salon])

  const visibles = filas.filter((r) =>
    (!estado || r.estado === estado) &&
    (!q || ((r.usuario || '') + ' ' + (r.email || '')).toLowerCase().includes(q.toLowerCase())))

  return (
    <div className='rb rb-stack'>
      <h2>Historial por salón</h2>
      <div className='rb-row'>
        <select className='rb-input' value={salon} onChange={(e) => setSalon(e.target.value)}>
          <option value=''>Todos los salones</option>
          {salones.map((s) => <option key={s.salon_id} value={s.salon_id}>{s.nombre}</option>)}
        </select>
        <select className='rb-input' value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value=''>Todos los estados</option>
          <option>pendiente</option><option>confirmada</option><option>cancelada</option>
        </select>
        <input className='rb-input rb-grow' value={q} onChange={(e) => setQ(e.target.value)} placeholder='Buscar cliente o email' />
        <button className='rb-btn' onClick={() => descargarCsv(visibles)}>Descargar CSV</button>
      </div>

      <div className='rb-wrap'>
        <table className='rb-table'>
          <thead><tr><th>Fecha</th><th>Salón</th><th>Cliente</th><th>Estado</th><th>Pago</th><th>Total</th><th>Pagado</th></tr></thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.reserva_id}>
                <td>{dia(r.fecha)}</td>
                <td>{r.salon}</td>
                <td>{r.usuario}<div className='rb-muted rb-small'>{r.email}</div></td>
                <td className={colores[r.estado]}>{r.estado}</td>
                <td>{r.estado_pago}</td>
                <td>{f(r.monto_total)}</td>
                <td>{f(r.monto_pagado)}</td>
              </tr>
            ))}
            {!visibles.length && <tr><td colSpan={7} className='rb-muted'>No hay reservas para mostrar.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
