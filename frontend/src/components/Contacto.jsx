import { useState } from "react";
import Icono from "./Icono";

export default function Contacto() {
  const [enviado, setEnviado] = useState(false);

  function enviar(e) {
    e.preventDefault();
    // Todavía no hay un endpoint de contacto en el backend: por ahora solo se confirma en pantalla.
    e.currentTarget.reset();
    setEnviado(true);
  }

  return (
    <section className="contact-section" id="contacto">
      <div className="contact-intro">
        <span className="eyebrow">Hablemos</span>
        <h2>Tu celebración empieza <em>aquí</em></h2>
        <p>Cuéntanos qué imaginas. Nuestro equipo te ayudará a encontrar el espacio perfecto.</p>
        <div className="contact-details">
          <span>
            <Icono nombre="phone" size={16} />
            <small>Llámanos<strong>3872174060</strong></small>
          </span>
          <span>
            <Icono nombre="mail" size={16} />
            <small>Escríbenos<strong>festiasalones@gmail.com</strong></small>
          </span>
        </div>
      </div>

      <form className="contact-form" onSubmit={enviar}>
        <div className="form-row">
          <label>Nombre completo<input required placeholder="Tu nombre" /></label>
          <label>Correo electrónico<input required type="email" placeholder="tu@email.com" /></label>
        </div>
        <label>Cuéntanos sobre tu evento<textarea required rows="4" /></label>
        <button className="primary-button" type="submit">
          Enviar consulta <Icono nombre="arrow" size={16} />
        </button>
        {enviado && <p className="form-msg is-ok" role="status">Consulta enviada. Te respondemos pronto.</p>}
      </form>
    </section>
  );
}
