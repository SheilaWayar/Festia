import { useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import { useDisponibilidad } from "../hooks/useDisponibilidad";
import { aMes, diaCompleto } from "../utils/disponibilidad";

registerLocale("es", es);

const aDate = (iso) => new Date(`${iso}T00:00:00`);

// Calendario del salón: deshabilita los días completos y resalta los que ya tienen alguna reserva.
// Al cambiar de mes vuelve a pedir la disponibilidad. El backend igual valida al reservar.
export default function CalendarioSalon({ salonId, fecha, onFecha, onOcupados }) {
  const [mesVisible, setMesVisible] = useState(new Date());
  const { ocupados } = useDisponibilidad(salonId, aMes(mesVisible));

  // Le avisamos al padre cuando cambian los ocupados (para calcular las horas libres)
  useEffect(() => {
    onOcupados?.(ocupados);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocupados]);

  const diasConReservas = [...new Set(ocupados.map((o) => o.fecha))];
  const diasLlenos = diasConReservas.filter((f) => diaCompleto(ocupados, f)).map(aDate);

  return (
    <DatePicker
      selected={fecha}
      onChange={(d) => onFecha(d)}
      onMonthChange={setMesVisible}
      minDate={new Date()}
      excludeDates={diasLlenos}
      highlightDates={[{ "dia-parcial": diasConReservas.map(aDate) }]}
      locale="es"
      dateFormat="dd/MM/yyyy"
      placeholderText="Elegí una fecha"
      autoComplete="off"
    />
  );
}
