import { Link } from "react-router-dom";

export default function PanelAdmin() {
  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><span></span> Administración</span>
        <h2>Panel de <em>control</em></h2>
      </header>

      <section className="turnos-list">
        <article className="turno-card">
          <div>
            <h3>Salones</h3>
            <p className="turno-meta">Agregar, editar o eliminar salones, fotos y descripciones.</p>
          </div>
          <span></span>
          <Link className="btn-outline" to="/admin/salones">Gestionar</Link>
        </article>

        <article className="turno-card">
          <div>
            <h3>Turnos</h3>
            <p className="turno-meta">Ver todas las reservas, confirmarlas o cancelarlas.</p>
          </div>
          <span></span>
          <Link className="btn-outline" to="/admin/turnos">Gestionar</Link>
        </article>
      </section>
    </>
  );
}
