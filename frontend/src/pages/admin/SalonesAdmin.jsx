import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icono from "../../components/Icono";
import { salonesApi } from "../../services/salonesApi";

export default function SalonesAdmin() {
  const [salones, setSalones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  function cargar() {
    setCargando(true);
    salonesApi
      .listar()
      .then(setSalones)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function borrar(s) {
    if (!window.confirm(`¿Eliminar "${s.nombre}"? También se borran sus turnos.`)) return;
    setError(null);
    try {
      await salonesApi.eliminar(s.id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><span></span> Administración</span>
        <h2>Gestionar <em>salones</em></h2>
      </header>

      <div className="admin-barra">
        <Link className="primary-button" to="/admin/salones/nuevo">
          Agregar salón <Icono nombre="arrow" size={16} />
        </Link>
      </div>

      {error && <p className="form-msg turnos-msg" role="alert">{error}</p>}

      <section className="turnos-list" aria-live="polite">
        {cargando && <div className="state-box"><p>Cargando salones...</p></div>}
        {!cargando && salones.length === 0 && (
          <div className="state-box"><p>Todavía no hay salones. Agregá el primero.</p></div>
        )}

        {salones.map((s) => (
          <article key={s.id} className="turno-card">
            <div>
              <h3>{s.nombre}</h3>
              <p className="turno-meta">
                {s.direccion} · Hasta {s.capacidad} · ${s.precio_por_hora?.toLocaleString("es-AR")} por hora
              </p>
            </div>
            <span></span>
            <div className="turno-acciones">
              <Link className="btn-outline" to={`/admin/salones/${s.id}`}>Editar</Link>
              <button className="btn-danger" type="button" onClick={() => borrar(s)}>Eliminar</button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
