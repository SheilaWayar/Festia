import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const pesos = (n) => `$${Number(n || 0).toLocaleString("es-AR")}`;

const fechaLarga = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const ESTADOS = {
  pendiente: "Pendiente de confirmación",
  confirmado: "Confirmado",
  finalizado: "Finalizado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};
const ESTADOS_PAGO = { sin_pago: "Sin pago", parcial: "Anticipo pagado", pagado: "Pagado" };

const numeroDe = (t) => String(t.id).slice(0, 8).toUpperCase();
const nombreDe = (p) => [p?.nombre, p?.apellido].filter(Boolean).join(" ") || "-";

// Devuelve el logo como data URL, o null si no existe (en Vercel un archivo
// inexistente devuelve index.html, por eso se chequea el tipo)
async function cargarLogo() {
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function crearBase(titulo, numero) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();

  const logo = await cargarLogo();
  if (logo) {
    const formato = logo.startsWith("data:image/png") ? "PNG" : "JPEG";
    const props = doc.getImageProperties(logo);
    const h = 20;
    const w = (props.width / props.height) * h;
    doc.addImage(logo, formato, 14, 12, Math.min(w, 60), h);
  } else {
    doc.setFont("helvetica", "bold").setFontSize(22).text("Festia", 14, 24);
  }

  doc.setFont("helvetica", "bold").setFontSize(18).text(titulo, ancho - 14, 20, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`N° ${numero}`, ancho - 14, 27, { align: "right" });
  doc.text(`Emitido: ${new Date().toLocaleDateString("es-AR")}`, ancho - 14, 33, { align: "right" });

  doc.setDrawColor(200).line(14, 40, ancho - 14, 40);

  doc.setFontSize(8).setTextColor(120);
  doc.text("Comprobante generado por Festia - Salones para tus eventos", ancho / 2, alto - 10, {
    align: "center",
  });
  doc.setTextColor(0);

  return doc;
}

function tabla(doc, filas) {
  autoTable(doc, {
    startY: 48,
    head: [["Concepto", "Detalle"]],
    body: filas,
    theme: "grid",
    headStyles: { fillColor: [40, 40, 40] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    styles: { fontSize: 11, cellPadding: 3 },
  });
}

export async function comprobanteReserva(t, perfil) {
  const doc = await crearBase("Comprobante de reserva", numeroDe(t));
  const filas = [
    ["Salón", t.salon_nombre],
    ["Cliente", nombreDe(perfil)],
    ["DNI", perfil?.dni || "-"],
    ["Fecha", fechaLarga(t.fecha)],
    ["Horario", `${t.hora_inicio.slice(0, 5)} a ${t.hora_fin.slice(0, 5)} h`],
    ["Estado", ESTADOS[t.estado] ?? t.estado],
  ];
  if (t.monto_total > 0) filas.push(["Total del turno", pesos(t.monto_total)]);
  tabla(doc, filas);
  doc.save(`reserva-${numeroDe(t)}.pdf`);
}

export async function comprobantePago(t, perfil) {
  const doc = await crearBase("Comprobante de pago", numeroDe(t));
  const saldo = Math.max(Number(t.monto_total || 0) - Number(t.monto_pagado || 0), 0);
  tabla(doc, [
    ["Salón", t.salon_nombre],
    ["Cliente", nombreDe(perfil)],
    ["DNI", perfil?.dni || "-"],
    ["Reserva N°", numeroDe(t)],
    ["Fecha del turno", fechaLarga(t.fecha)],
    ["Medio de pago", "Mercado Pago"],
    ["Total del turno", pesos(t.monto_total)],
    ["Monto pagado", pesos(t.monto_pagado)],
    ["Saldo pendiente", pesos(saldo)],
    ["Estado del pago", ESTADOS_PAGO[t.estado_pago] ?? t.estado_pago],
  ]);
  doc.save(`pago-${numeroDe(t)}.pdf`);
}