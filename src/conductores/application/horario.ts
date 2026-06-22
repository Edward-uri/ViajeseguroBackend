export const TZ = 'America/Mexico_City';

/** 'YYYY-MM-DD' del instante dado (o ahora) en TZ. en-CA => formato ISO de fecha. */
export function hoyLocal(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

/** Offset (ej '-06:00') de TZ para una fecha local 'YYYY-MM-DD' a medianoche. */
function offsetTZ(fechaLocal: string): string {
  // Construye un Date en UTC para la medianoche nominal y mide la diferencia que TZ le aplica.
  const utcMidnight = new Date(`${fechaLocal}T00:00:00Z`);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    timeZoneName: 'longOffset',
  });
  const part = fmt.formatToParts(utcMidnight).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-06:00';
  // 'GMT-06:00' -> '-06:00'
  const m = part.match(/GMT([+-]\d{2}:\d{2})/);
  return m ? m[1]! : '-06:00';
}

/** Frontera [desdeTs, hastaTs) en ISO con offset de TZ. hasta es EXCLUSIVO (día siguiente). */
export function limitesDelRango(desde: string, hasta: string): { desdeTs: string; hastaTs: string } {
  const desdeTs = `${desde}T00:00:00${offsetTZ(desde)}`;
  const finDia = new Date(`${hasta}T00:00:00Z`);
  finDia.setUTCDate(finDia.getUTCDate() + 1);
  const hastaLocal = finDia.toISOString().slice(0, 10); // día siguiente al 'hasta'
  const hastaTs = `${hastaLocal}T00:00:00${offsetTZ(hastaLocal)}`;
  return { desdeTs, hastaTs };
}
