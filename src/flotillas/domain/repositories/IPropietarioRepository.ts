import type { Propietario } from '../Propietario.js';

export interface IPropietarioRepository {
  asegurarExiste(idPropietario: number): Promise<void>;
  findById(idPropietario: number): Promise<Propietario | null>;
  upsertPerfil(args: { idPropietario: number; rfc: string | null; razonSocial: string | null }): Promise<Propietario>;
}
