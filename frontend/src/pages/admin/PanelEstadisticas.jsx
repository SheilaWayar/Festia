import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './adminExtra.css'

const f = (n) => '$' + Number(n || 0).toLocaleString('es-AR')

export default function PanelEstadisticas() {
  const [res, setRes] = useState([])
  const [meses, setMeses] = useState([])
  const [salon, setSalon] = useState('')

  useEffect(() => { supabase.rpc('resumen_salones').then(({ data }) => setRes(data || [])) }, [])
  useEffect(() => {
    supabase.rpc('ingresos_mensuales', { p_salon: salon || null })
      .then(({ data }) => setMeses((data || []).slice().reverse()))
  }, [salon])

  const suma = (k) => res.reduce((a, s) => a + Number(s[k] || 0), 0)
  const max = Math.max(1, ...meses.map((m) => Number(m.cobrado)))

  const tarjeta = (titulo, valor, color = '') => (
    <div className='rb-card'>
      <p className='rb-label'>{titulo}</p>
      <p className={'rb-num ' + color}>{valor}</p>
    </div>
  )

  return (
    <div className='rb rb-stack'>
      <h2>Estadísticas</h2>
      <div className='rb-grid'>
        {tarjeta('Reservas', suma('reservas_total'))}
        {tarjeta('Pendientes de confirmar', suma('pendientes'), 'rb-yellow')}
        {tarjeta('Cobrado', f(suma('cobrado')), 'rb-green')}
        {tarjeta('Por cobrar', f(suma('por_cobrar')), 'rb-red')}
      </div>

      <div className='rb-wrap'>
        <table className='rb-table'>
          <thead>
            <tr><th>Salón</th><th>Reservas</th><th>Confirmadas</th><th>Pendientes</th><th>Canceladas</th><th>Cobrado</th><th>Por cobrar</th></tr>
          </thead>
          <tbody>
            {res.map((s) => (
              <tr key={s.salon_id}>
                <td><b>{s.nombre}</b></td>
                <td>{s.reservas_total}</td><td>{s.confirmadas}</td><td>{s.pendientes}</td><td>{s.canceladas}</td>
                <td className='rb-green'>{f(s.cobrado)}</td>
                <td className='rb-red'>{f(s.por_cobrar)}</td>
              </tr>
            ))}
            {!res.length && <tr><td colSpan={7} className='rb-muted'>Todavía no hay salones asignados.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className='rb-card'>
        <div className='rb-row rb-between' style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Ingresos por mes</h2>
          <select className='rb-input' value={salon} onChange={(e) => setSalon(e.target.value)}>
            <option value=''>Todos los salones</option>
            {res.map((s) => <option key={s.salon_id} value={s.salon_id}>{s.nombre}</option>)}
          </select>
        </div>
        {meses.length ? (
          <div className='rb-bars'>
            {meses.map((m) => (
              <div key={m.mes} className='rb-bar'>
                <span>{f(m.cobrado)}</span>
                <div style={{ height: Math.max(4, (Number(m.cobrado) / max) * 120) + 'px' }} />
                <span>{m.mes}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className='rb-muted'>Todavía no hay pagos aprobados.</p>
        )}
      </div>
    </div>
  )
}
