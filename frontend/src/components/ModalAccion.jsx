import { useEffect } from "react";

export default function ModalAccion({ titulo, onCerrar, children }) {
  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  return (
    <div className="accion-overlay" onClick={onCerrar}>
      <div
        className="accion-modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{titulo}</h3>
        {children}
      </div>
    </div>
  );
} 