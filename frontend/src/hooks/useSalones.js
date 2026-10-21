import { useEffect, useState } from "react";
import { salonesApi } from "../services/salonesApi";

export function useSalones(filtros = {}) {
  const [salones, setSalones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const clave = JSON.stringify(filtros);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    salonesApi
      .listar(filtros)
      .then((d) => activo && setSalones(d))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return { salones, cargando, error };
}
