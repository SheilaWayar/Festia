import { useEffect, useState } from "react";

export default function Carrusel({ imagenes = [], alt = "" }) {
  const [i, setI] = useState(0);
  const total = imagenes.length;
  // Si cambia la cantidad de imágenes, el resto siempre deja un índice válido
  const actual = total ? i % total : 0;

  // Avanza solo cada 5 segundos
  useEffect(() => {
    if (total < 2) return;
    const t = setInterval(() => setI((p) => p + 1), 5000);
    return () => clearInterval(t);
  }, [total]);

  if (!total) return null;
  const ir = (n) => setI(((n % total) + total) % total);

  return (
    <div className="hero-carrusel">
      {imagenes.map((src, n) => (
        <img
          key={src + n}
          src={src}
          alt={n === actual ? alt : ""}
          className={n === actual ? "activa" : ""}
        />
      ))}

      {total > 1 && (
        <>
          <button type="button" className="carrusel-flecha izq" onClick={() => ir(actual - 1)} aria-label="Imagen anterior">‹</button>
          <button type="button" className="carrusel-flecha der" onClick={() => ir(actual + 1)} aria-label="Imagen siguiente">›</button>
          <div className="carrusel-puntos">
            {imagenes.map((_, n) => (
              <button
                key={n}
                type="button"
                className={n === actual ? "activo" : ""}
                onClick={() => ir(n)}
                aria-label={`Ir a la imagen ${n + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}