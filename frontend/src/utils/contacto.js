// Arma el enlace de WhatsApp (acepta 10 dígitos: código de área + número, sin 0 ni 15)
export function enlaceWhatsapp(numero, texto = "") {
  const d = String(numero ?? "").replace(/\D/g, "");
  let completo = null;
  if (d.length === 10) completo = `549${d}`;
  else if (d.length === 13 && d.startsWith("549")) completo = d;
  if (!completo) return null;
  return `https://wa.me/${completo}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

// Acepta "@usuario", "usuario", "instagram.com/usuario" o el enlace completo
export function enlaceInstagram(valor) {
  const v = String(valor ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(www\.)?instagram\.com\//i.test(v)) return `https://${v}`;
  const usuario = v.replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(usuario) ? `https://instagram.com/${usuario}` : null;
}
// Acepta "usuario", "@usuario" o un enlace completo de Facebook
export function enlaceFacebook(valor) {
  const v = (valor || "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://facebook.com/${v.replace(/^@/, "").replace(/^facebook\.com\//i, "")}`;
}
