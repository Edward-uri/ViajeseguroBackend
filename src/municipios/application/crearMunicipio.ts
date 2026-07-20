import type { IMunicipioRepository } from '../domain/repositories/IMunicipioRepository.js';
import type { IPerimetroProvider } from '../domain/IPerimetroProvider.js';
import type { MunicipioPublico } from '../domain/Municipio.js';

/**
 * Alta de municipio: crea la fila y trata de cargar su límite desde OSM en el
 * mismo paso. Si OSM no responde, el alta NO falla — queda el fallback de radio
 * y el perímetro se puede cargar después con scripts/cargar-perimetro.mjs.
 */
export function crearMunicipio(deps: { municipios: IMunicipioRepository; perimetros: IPerimetroProvider }) {
  return async (input: { nombre: string; estado: string; tarifaDefault?: number }):
    Promise<{ municipio: MunicipioPublico; perimetroCargado: boolean }> => {
    const municipio = await deps.municipios.crear(input);
    let perimetroCargado = false;
    try {
      const perimetro = await deps.perimetros.obtener(input.nombre, input.estado);
      if (perimetro) {
        await deps.municipios.guardarPerimetro(municipio.idMunicipio, perimetro);
        perimetroCargado = true;
      } else {
        console.warn(`[municipios] OSM sin polígono para ${input.nombre}, ${input.estado} — cargar con scripts/cargar-perimetro.mjs`);
      }
    } catch (e) {
      console.warn(`[municipios] no se pudo cargar el perímetro de ${input.nombre}:`, e);
    }
    return { municipio: municipio.toPublicJSON(), perimetroCargado };
  };
}
