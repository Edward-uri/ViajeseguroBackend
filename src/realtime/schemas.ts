import { z } from 'zod';

export const ConductorOnlineSchema = z.object({
  idMunicipio: z.number().int().positive(),
});

export const ConductorUbicacionSchema = z.object({
  idViaje: z.number().int().positive(),
  lat: z.number().finite(),
  lng: z.number().finite(),
});
