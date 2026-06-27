export type FieldPolicy = { encrypt?: boolean; blindIndex?: boolean };
export type FieldRegistry = Record<string, Record<string, FieldPolicy>>;

/** Qué columnas se cifran y cuáles llevan blind index. Ver docs/seguridad/clasificacion-datos-privacidad.md */
export const SENSITIVE_FIELDS: FieldRegistry = {
  usuarios: {
    correo_electronico: { encrypt: true, blindIndex: true },
    telefono: { encrypt: true, blindIndex: true },
  },
  personas: {
    nombre: { encrypt: true },
    apellido_paterno: { encrypt: true },
    apellido_materno: { encrypt: true },
    fecha_nacimiento: { encrypt: true },
  },
  propietarios: {
    rfc: { encrypt: true, blindIndex: true },
    razon_social: { encrypt: true },
  },
  conductores: {
    licencia: { encrypt: true, blindIndex: true },
  },
  vehiculos: {
    placa: { encrypt: true, blindIndex: true },
  },
  codigos_otp: {
    destino: { encrypt: true, blindIndex: true },
  },
  invitaciones_admin: {
    correo: { encrypt: true, blindIndex: true },
  },
  direcciones_usuario: {
    lat: { encrypt: true },
    lng: { encrypt: true },
    texto: { encrypt: true },
  },
};
