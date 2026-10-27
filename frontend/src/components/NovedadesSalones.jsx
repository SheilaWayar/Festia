import { useState } from "react";
import SalonCard from "./SalonCard";

const TREINTA_DIAS = 30 * 24 * 60 * 60 * 1000;

export default function NovedadesSalones({ salones, onAbrir }) {
  const [ahora] = useState(() => Date.now());

  const recientes = salones.filter(
    (s) => s.created_at && ahora - new Date(s.created_at).getTime() < TREINTA_DIAS
  );
  const lista = (recientes.length ? recientes : [...salones].sort((a, b) => b.id - a.id)).slice(0, 6);
  if (!lista.length) return null;

  return (
    <section className="section novedades-section" id="novedades">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Recién llegados</span>
          <h2>Salones <em>nuevos</em></h2>
        </div>
      </div>
      <div className="venue-grid">
        {lista.map((s) => (
          <SalonCard key={s.id} salon={s} onAbrir={onAbrir} />
        ))}
      </div>
    </section>
  );
}