import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { salonesApi } from "../../services/salonesApi";

const VACIO = {
  nombre: "",
  descripcion: "",
  direccion: "",
  capacidad: "",
  precio_por_hora: "",
  servicios: "",
  imagenes: "",
  tipos_evento: [],
};

const aLista = (txt) => txt.split(",").map((x) => x.trim()).filter(Boolean);

// Sirve para agregar un salón nuevo y para editar uno existente (/admin/salones/:id)
export default function SalonForm() {
  const { id } = useParams(); // undefined cuando es un salón nuevo
  const navigate = useNavigate();

  const [form, setForm] = useState(VACIO);
  const [tipos, setTipos] = useState([]);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    salonesApi.tiposEvento().then(setTipos).catch(() => setTipos([]));
    if (id) {
      salonesApi
        .obtener(id)
        .then((s) =>
          setForm({
            nombre: s.nombre,
            descripcion: s.descripcion ?? "",
            direccion: s.direccion ?? "",
            capacidad: s.capacidad,
            precio_por_hora: s.precio_por_hora,
            servicios: (s.servicios ?? []).join(", "),
            imagenes: (s.imagenes ?? []).join(", "),
            tipos_evento: s.tipos_evento ?? [],
          })
        )
        .catch((e) => setError(e.message));
    }
  }, [id]);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function alternarTipo(t) {
    setForm({
      ...form,
      tipos_evento: form.tipos_evento.includes(t)
        ? form.tipos_evento.filter((x) => x !== t)
        : [...form.tipos_evento, t],
    });
  }

  function agregarTipo() {
    const t = nuevoTipo.trim().toLowerCase();
    if (!t) return;
    if (!tipos.includes(t)) setTipos([...tipos, t]);
    if (!form.tipos_evento.includes(t)) {
      setForm({ ...form, tipos_evento: [...form.tipos_evento, t] });
    }
    setNuevoTipo("");
  }

  async function guardar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);

    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      direccion: form.direccion.trim(),
      capacidad: Number(form.capacidad),
      precio_por_hora: Number(form.precio_por_hora),
      servicios: aLista(form.servicios),
      imagenes: aLista(form.imagenes),
      tipos_evento: form.tipos_evento,
    };

    try {
      if (id) await salonesApi.actualizar(id, datos);
      else await salonesApi.crear(datos);
      navigate("/admin/salones");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-card auth-card--ancha">
        <Link className="back-link" to="/admin/salones">← Volver a los salones</Link>
        <h2>{id ? "Editar salón" : "Agregar salón"}</h2>

        <form onSubmit={guardar}>
          <label>
            Nombre
            <input name="nombre" value={form.nombre} onChange={cambiar} required />
          </label>

          <label>
            Descripción
            <textarea name="descripcion" rows="4" value={form.descripcion} onChange={cambiar} />
          </label>

          <label>
            Dirección
            <input name="direccion" value={form.direccion} onChange={cambiar} required />
          </label>

          <label>
            Capacidad (personas)
            <input name="capacidad" type="number" min="1" value={form.capacidad} onChange={cambiar} required />
          </label>

          <label>
            Precio por hora
            <input name="precio_por_hora" type="number" min="0" value={form.precio_por_hora} onChange={cambiar} required />
          </label>

          <label>
            Servicios
            <input name="servicios" value={form.servicios} onChange={cambiar} placeholder="catering, sonido, estacionamiento" />
            <span className="ayuda">Separados por coma.</span>
          </label>

          <label>
            Imágenes
            <input name="imagenes" value={form.imagenes} onChange={cambiar} placeholder="https://..., https://..." />
            <span className="ayuda">Links de las fotos, separados por coma. La primera es la principal.</span>
          </label>

          <fieldset>
            <legend>Tipos de evento</legend>
            {tipos.map((t) => (
              <label key={t} className="chk">
                <input type="checkbox" checked={form.tipos_evento.includes(t)} onChange={() => alternarTipo(t)} />
                {t}
              </label>
            ))}
            <div className="nuevo-tipo">
              <input
                placeholder="Otro tipo de evento"
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value)}
              />
              <button className="btn-outline" type="button" onClick={agregarTipo}>Agregar</button>
            </div>
          </fieldset>

          <p className="form-msg" role="alert">{error}</p>
          <button className="primary-button" type="submit" disabled={enviando}>
            {enviando ? "Guardando..." : "Guardar salón"}
          </button>
        </form>
      </div>
    </div>
  );
}
