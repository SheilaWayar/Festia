import { useEffect, useState } from "react";
import { salonesApi } from "../services/salonesApi";

export function useDisponibilidad(salonId, mes) {
  const [ocupados, setOcupados] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargando(true);

    salonesApi
      .disponibilidad(salonId, mes)
      .then((d) => activo && setOcupados(d.ocupados))
      .catch(() => activo && setOcupados([]))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, [salonId, mes]);

  return { ocupados, cargando };
}
