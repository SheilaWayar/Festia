import { supabase } from "../lib/supabase";

function traducir(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("already registered")) return "Ese correo ya está registrado. Ingresá con tu contraseña.";
  if (m.includes("password should be")) return "La contraseña es muy débil. Usá al menos 8 caracteres.";
  if (m.includes("rate limit") || m.includes("security purposes"))
    return "Demasiados intentos. Probá de nuevo en unos minutos.";
  if (m.includes("same password")) return "La contraseña nueva tiene que ser distinta de la anterior.";
  return msg || "No se pudo completar la operación.";
}

export const registroApi = {
  // Crea la cuenta guardando los datos personales junto al usuario
  async crearCuenta(d) {
    const { data, error } = await supabase.auth.signUp({
      email: d.email,
      password: d.password,
      options: {
        data: {
          nombre: d.nombre,
          apellido: d.apellido,
          dni: d.dni,
          fecha_nacimiento: d.fecha_nacimiento,
          direccion: d.direccion,
        },
      },
    });
    if (error) throw new Error(traducir(error.message));

    // Con confirmación de correo activa, un correo repetido no da error: viene sin identidades
    if (data.user && data.user.identities?.length === 0) {
      throw new Error("Ese correo ya está registrado. Ingresá con tu contraseña.");
    }
    return { requiereConfirmacion: !data.session };
  },

  // Copia los datos del registro a la tabla perfiles
  async sincronizarDatos() {
    const { error } = await supabase.rpc("sincronizar_datos_registro");
    if (error) throw new Error(error.message);
  },

  // Envía el mail con el enlace para elegir una contraseña nueva
  async enviarRecuperacion(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    if (error) throw new Error(traducir(error.message));
  },

  // Guarda la contraseña nueva (la persona ya llegó desde el enlace del mail)
  async cambiarPassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(traducir(error.message));
  },
};