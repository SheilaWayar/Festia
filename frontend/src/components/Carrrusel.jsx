import { useEffect, useState } from "react";

export default function Carrusel({ imagenes = [], alt = "" }) {
  const [i, setI] = useState(0);
  const total = imagenes.length;

  // Si cambia la cantidad de imágenes (cuando cargan los salones), vuelve al inicio
  useEffect(() => {
    setI(0);
  }, [total]);

  // Avanza solo cada 5 segundos
  useEffect(() => {
    if (total < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  if (!total) return null;
  const ir = (n) => setI((n + total) % total);

  return (
    <div className="hero-carrusel">
      {imagenes.map((src, n) => (
        <img
          key={src + n}
          src={src}
          alt={n === i ? alt : ""}
          className={n === i ? "activa" : ""}
        />
      ))}

      {total > 1 && (
        <>
          <button type="button" className="carrusel-flecha izq" onClick={() => ir(i - 1)} aria-label="Imagen anterior">‹</button>
          <button type="button" className="carrusel-flecha der" onClick={() => ir(i + 1)} aria-label="Imagen siguiente">›</button>
          <div className="carrusel-puntos">
            {imagenes.map((_, n) => (
              <button
                key={n}
                type="button"
                className={n === i ? "activo" : ""}
                onClick={() => setI(n)}
                aria-label={`Ir a la imagen ${n + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}