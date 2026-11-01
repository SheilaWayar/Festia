import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const f = (n) => '$' + Number(n || 0).toLocaleString('es-AR')
const nombreMes = (m) => {
  const [a, mes] = m.split('-')
  return new Date(Number(a), Number(mes) - 1, 1).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
}
const METODOS = [
  ['efectivo', 'Efectivo'],
  ['transferencia', 'Transferencia'],
  ['mercadopago', 'Mercado Pago'],
]

// Resumen: reservas, cobrado, pagos por método, salón más solicitado e ingresos por mes
export default function Panel() {
  const [salones, setSalones] = useState([])
  const [ingresos, setIngresos] = useState([])
  const [est, setEst] = useState({ por_metodo: [], salones_top: [] })
  const [salon, setSalon] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.rpc('resumen_salones').then(({ data, error }) => {
      if (error) setError(error.message)
      setSalones(data || [])
    })
    supabase.rpc('estadisticas_resumen').then(({ data, error }) => {
      if (error) setError(error.message)
      else if (data) setEst(data)
    })
  }, [])

  useEffect(() => {
    supabase.rpc('ingresos_mensuales', { p_salon: salon ? Number(salon) : null })
      .then(({ data }) => setIngresos((data || []).slice().reverse()))
  }, [salon])

  const visibles = salon ? salones.filter((s) => String(s.salon_id) === salon) : salones
  const suma = (k) => visibles.reduce((a, s) => a + Number(s[k] || 0), 0)
  const max = Math.max(1, ...ingresos.map((i) => Number(i.cobrado)))

  const porMetodo = METODOS.map(([k, nombre]) => {
    const x = (est.por_metodo || []).find((m) => m.metodo === k)
    return { k, nombre, total: Number(x?.total || 0), cant: Number(x?.cantidad || 0) }
  })
  const totalPagos = porMetodo.reduce((a, m) => a + m.total, 0)

  const top = est.salones_top || []
  const topMax = Math.max(1, ...top.map((s) => Number(s.reservas)))

  const tarjetas = [
    ['Reservas', suma('reservas_total')],
    ['Pendientes', suma('pendientes')],
    ['Confirmadas', suma('confirmadas')],
    ['Facturado', f(suma('facturado'))],
    ['Cobrado', f(suma('cobrado'))],
    ['Por cobrar', f(suma('por_cobrar'))],
  ]

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h1 className='text-xl font-semibold'>Estadísticas</h1>
        {salones.length > 1 && (
          <select value={salon} onChange={(e) => setSalon(e.target.value)}
            className='rounded border border-gray-300 bg-white px-3 py-2 text-sm'>
            <option value=''>Todos los salones</option>
            {salones.map((s) => <option key={s.salon_id} value={s.salon_id}>{s.nombre}</option>)}
          </select>
        )}
      </div>

      {error && <p className='rounded bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

      <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
        {tarjetas.map(([t, v]) => (
          <div key={t} className='rounded-lg border border-gray-200 bg-white p-3'>
            <p className='text-xs text-gray-500'>{t}</p>
            <p className='text-xl font-semibold'>{v}</p>
          </div>
        ))}
      </div>

      <section className='rounded-lg border border-gray-200 bg-white p-4'>
        <h2 className='mb-3 font-medium'>Cuánto se pagó, por método</h2>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          {porMetodo.map((m) => (
            <div key={m.k} className='rounded-lg bg-gray-50 p-3'>
              <p className='text-xs text-gray-500'>{m.nombre}</p>
              <p className='text-xl font-semibold'>{f(m.total)}</p>
              <p className='text-xs text-gray-500'>
                {m.cant} {m.cant === 1 ? 'pago' : 'pagos'}
                {totalPagos > 0 && ` · ${Math.round((m.total / totalPagos) * 100)} %`}
              </p>
            </div>
          ))}
        </div>
        <p className='mt-2 text-xs text-gray-400'>Solo pagos aprobados, de todos tus salones.</p>
      </section>

      <section className='rounded-lg border border-gray-200 bg-white p-4'>
        <h2 className='mb-3 font-medium'>Salones más solicitados</h2>
        {top.length === 0 ? (
          <p className='text-sm text-gray-400'>Todavía no hay reservas.</p>
        ) : (
          <div className='space-y-2'>
            {top.map((s, i) => (
              <div key={s.salon_id}>
                <div className='flex justify-between text-sm'>
                  <span>{i === 0 ? '🏆 ' : ''}{s.nombre}</span>
                  <span className='text-gray-500'>{s.reservas} {Number(s.reservas) === 1 ? 'reserva' : 'reservas'}</span>
                </div>
                <div className='h-2 rounded bg-gray-100'>
                  <div className='h-2 rounded bg-indigo-500' style={{ width: (Number(s.reservas) / topMax) * 100 + '%' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className='rounded-lg border border-gray-200 bg-white p-4'>
        <h2 className='mb-3 font-medium'>Ingresos por mes</h2>
        {ingresos.length === 0 ? (
          <p className='text-sm text-gray-400'>Todavía no hay pagos aprobados.</p>
        ) : (
          <div className='flex h-48 items-end gap-2 overflow-x-auto'>
            {ingresos.map((i) => (
              <div key={i.mes} className='flex min-w-[48px] flex-1 flex-col items-center justify-end gap-1'>
                <span className='text-[11px] text-gray-500'>{f(i.cobrado)}</span>
                <div
                  className='w-full rounded-t bg-indigo-500'
                  style={{ height: Math.max(4, (Number(i.cobrado) / max) * 140) + 'px' }}
                  title={i.cant_pagos + ' pagos'}
                />
                <span className='text-xs text-gray-500'>{nombreMes(i.mes)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className='overflow-x-auto rounded-lg border border-gray-200 bg-white'>
        <table className='w-full text-left text-sm'>
          <thead className='bg-gray-50 text-xs uppercase text-gray-500'>
            <tr>
              <th className='p-2'>Salón</th><th className='p-2'>Reservas</th><th className='p-2'>Pendientes</th>
              <th className='p-2'>Canceladas</th><th className='p-2'>Facturado</th><th className='p-2'>Cobrado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((s) => (
              <tr key={s.salon_id} className='border-t border-gray-200'>
                <td className='p-2'>{s.nombre}</td>
                <td className='p-2'>{s.reservas_total}</td>
                <td className='p-2'>{s.pendientes}</td>
                <td className='p-2'>{s.canceladas}</td>
                <td className='p-2'>{f(s.facturado)}</td>
                <td className='p-2'>{f(s.cobrado)}</td>
              </tr>
            ))}
            {!visibles.length && (
              <tr><td className='p-4 text-center text-gray-400' colSpan={6}>No hay datos para mostrar.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}