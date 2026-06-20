import type { EstadoViaje, TipoServicio, CanceladoPor } from './tipos.js';

export interface ViajeData {
  idViaje: number;
  idPasajero: number;
  idConductor: number | null;
  idVehiculo: number | null;
  idMunicipio: number;
  tipoServicio: TipoServicio;
  origenLat: number | null;
  origenLng: number | null;
  origenTexto: string | null;
  destinoLat: number | null;
  destinoLng: number | null;
  destinoTexto: string | null;
  idZonaDestino: number | null;
  distanciaKm: number | null;
  tarifa: number;
  tarifaEstimada: boolean;
  estado: EstadoViaje;
  fechaSolicitud: Date | null;
  fechaAceptacion: Date | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  canceladoPor: CanceladoPor | null;
  motivoCancelacion: string | null;
}

export interface PublicViaje {
  idViaje: number;
  idPasajero: number;
  idConductor: number | null;
  idVehiculo: number | null;
  idMunicipio: number;
  tipoServicio: TipoServicio;
  origen: { lat: number | null; lng: number | null; texto: string | null };
  destino: { lat: number | null; lng: number | null; texto: string | null };
  idZonaDestino: number | null;
  distanciaKm: number | null;
  tarifa: number;
  tarifaEstimada: boolean;
  estado: EstadoViaje;
  fechaSolicitud: Date | null;
  fechaAceptacion: Date | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  canceladoPor: CanceladoPor | null;
  motivoCancelacion: string | null;
}

export class Viaje {
  constructor(public readonly data: ViajeData) {}

  get id(): number { return this.data.idViaje; }
  get idPasajero(): number { return this.data.idPasajero; }
  get idConductor(): number | null { return this.data.idConductor; }
  get estado(): EstadoViaje { return this.data.estado; }

  toJSON(): PublicViaje {
    const d = this.data;
    return {
      idViaje: d.idViaje,
      idPasajero: d.idPasajero,
      idConductor: d.idConductor,
      idVehiculo: d.idVehiculo,
      idMunicipio: d.idMunicipio,
      tipoServicio: d.tipoServicio,
      origen: { lat: d.origenLat, lng: d.origenLng, texto: d.origenTexto },
      destino: { lat: d.destinoLat, lng: d.destinoLng, texto: d.destinoTexto },
      idZonaDestino: d.idZonaDestino,
      distanciaKm: d.distanciaKm,
      tarifa: d.tarifa,
      tarifaEstimada: d.tarifaEstimada,
      estado: d.estado,
      fechaSolicitud: d.fechaSolicitud,
      fechaAceptacion: d.fechaAceptacion,
      fechaInicio: d.fechaInicio,
      fechaFin: d.fechaFin,
      canceladoPor: d.canceladoPor,
      motivoCancelacion: d.motivoCancelacion,
    };
  }
}
