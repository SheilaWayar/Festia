import { alFallarImagen, fotoDe } from "../utils/imagenes";

// Galería del diseño original: una foto grande, una mediana y una última con el contador de fotos extra.
export default function GaleriaSalon({ salon }) {
  const extra = (salon.imagenes?.length ?? 0) - 3;

  return (
    <div className="detail-gallery">
      <img className="gallery-main" src={fotoDe(salon, 0)} alt={salon.nombre ?? "Salón"} onError={alFallarImagen} />
      <img src={fotoDe(salon, 1)} alt="" onError={alFallarImagen} />
      <div className="gallery-last">
        <img src={fotoDe(salon, 2)} alt="" onError={alFallarImagen} />
        {extra > 0 && <span>+{extra} fotos</span>}
      </div>
    </div>
  );
}
