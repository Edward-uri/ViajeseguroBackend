import { pool, withTransaction } from '../../core/db.js';
import type { PoolClient } from 'pg';
import type { Rol } from '../../core/jwt.js';
import { User, UserBuilder, type EstadoCuenta } from '../domain/User.js';
import type { Persona } from '../domain/Persona.js';
import type { IUserRepository, PersonaPerfil } from '../domain/repositories/IUserRepository.js';
import { TelefonoDuplicadoError } from '../domain/errors.js';
import { CorreoYaRegistradoError } from '../../auth/domain/errors.js';
import { cipherCodec } from '../../infrastructure/crypto/cipher.js';

interface UsuarioRow {
  id_usuario: string | number;
  telefono: string | null;
  correo_electronico: string | null;
  telefono_verificado: boolean;
  correo_verificado: boolean;
  estado_cuenta: EstadoCuenta;
  id_municipio: string | number | null;
  foto_perfil_url: string | null;
  foto_perfil_s3_key: string | null;
  fecha_registro: Date;
  password_hash: string | null;
  es_propietario?: boolean;
}

function mapUserRow(row: UsuarioRow | undefined): User | null {
  if (!row) return null;
  // Descifra correo/telefono desde *_enc; durante la transición cae a la columna plana.
  const dec = cipherCodec.decodeDeRow('usuarios', row as unknown as Record<string, unknown>);
  const correo = (dec.correo_electronico as string | null) ?? row.correo_electronico;
  const telefono = (dec.telefono as string | null) ?? row.telefono;
  return new UserBuilder()
    .idUsuario(typeof row.id_usuario === 'string' ? Number(row.id_usuario) : row.id_usuario)
    .telefono(telefono)
    .correoElectronico(correo as string)
    .estadoCuenta(row.estado_cuenta)
    .telefonoVerificado(row.telefono_verificado)
    .correoVerificado(row.correo_verificado)
    .idMunicipio(row.id_municipio == null ? null : Number(row.id_municipio))
    .fotoPerfilUrl(row.foto_perfil_url)
    .fotoPerfilS3Key(row.foto_perfil_s3_key)
    .fechaRegistro(row.fecha_registro)
    .tienePassword(row.password_hash != null)
    .esPropietario(row.es_propietario === true)
    .build();
}

export class UserPostgresRepository implements IUserRepository {
  async findByTelefono(telefono: string): Promise<User | null> {
    const bidx = cipherCodec.bidx('usuarios', 'telefono', telefono);
    let { rows } = await pool.query<UsuarioRow>(
      'SELECT * FROM usuarios WHERE telefono_bidx = $1 LIMIT 1',
      [bidx],
    );
    if (!rows[0]) {
      // Fallback transición: filas aún no cifradas por el backfill.
      ({ rows } = await pool.query<UsuarioRow>('SELECT * FROM usuarios WHERE telefono = $1 LIMIT 1', [telefono]));
    }
    return mapUserRow(rows[0]);
  }

  async findByCorreo(correo: string): Promise<User | null> {
    const bidx = cipherCodec.bidx('usuarios', 'correo_electronico', correo);
    let { rows } = await pool.query<UsuarioRow>(
      'SELECT * FROM usuarios WHERE correo_electronico_bidx = $1 LIMIT 1',
      [bidx],
    );
    if (!rows[0]) {
      ({ rows } = await pool.query<UsuarioRow>('SELECT * FROM usuarios WHERE correo_electronico = $1 LIMIT 1', [correo]));
    }
    return mapUserRow(rows[0]);
  }

  async findById(idUsuario: number): Promise<User | null> {
    const { rows } = await pool.query<UsuarioRow>(
      `SELECT u.*,
              EXISTS (SELECT 1 FROM vehiculos v WHERE v.id_propietario = u.id_usuario) AS es_propietario
         FROM usuarios u
        WHERE u.id_usuario = $1
        LIMIT 1`,
      [idUsuario],
    );
    return mapUserRow(rows[0]);
  }

  async personaPorId(idUsuario: number): Promise<PersonaPerfil | null> {
    // id_sexo no se cifra (FK a catalogo_sexo); se une para devolver también la etiqueta.
    const { rows } = await pool.query(
      `SELECT p.nombre, p.nombre_enc, p.apellido_paterno, p.apellido_paterno_enc,
              p.apellido_materno, p.apellido_materno_enc, p.fecha_nacimiento, p.fecha_nacimiento_enc,
              p.id_sexo, cs.sexo
         FROM personas p
         LEFT JOIN catalogo_sexo cs ON cs.id_sexo = p.id_sexo
        WHERE p.id_persona = $1`,
      [idUsuario],
    );
    const row = rows[0];
    if (!row) return null;
    const d = cipherCodec.decodeDeRow('personas', row) as Record<string, unknown>;
    const val = (dec: unknown, plano: unknown) =>
      (dec ?? plano) == null ? null : String(dec ?? plano);
    return {
      nombre: val(d.nombre, row.nombre),
      apellidoPaterno: val(d.apellido_paterno, row.apellido_paterno),
      apellidoMaterno: val(d.apellido_materno, row.apellido_materno),
      fechaNacimiento: val(d.fecha_nacimiento, row.fecha_nacimiento),
      idSexo: row.id_sexo == null ? null : Number(row.id_sexo),
      sexo: row.sexo ?? null,
    };
  }

  async createAdmin(
    { correo, passwordHash }: { correo: string; passwordHash: string },
    client?: PoolClient,
  ): Promise<User> {
    const exec = client ?? pool;
    const enc = cipherCodec.encodeParaInsert('usuarios', { correo_electronico: correo, telefono: null });
    try {
      const { rows } = await exec.query<UsuarioRow>(
        `INSERT INTO usuarios
           (correo_electronico_enc, correo_electronico_bidx, telefono_enc, telefono_bidx,
            estado_cuenta, telefono_verificado, correo_verificado, id_municipio, password_hash)
         VALUES ($1, $2, $3, $4, 'activo', false, true, NULL, $5)
         RETURNING *`,
        [enc.correo_electronico_enc, enc.correo_electronico_bidx, enc.telefono_enc, enc.telefono_bidx, passwordHash],
      );
      const created = mapUserRow(rows[0]);
      if (!created) throw new Error('No se pudo crear el admin');
      await exec.query(
        `INSERT INTO usuario_roles (id_usuario, rol) VALUES ($1, 'admin') ON CONFLICT DO NOTHING`,
        [created.idUsuario],
      );
      return created;
    } catch (err) {
      if ((err as { code?: string }).code === '23505') throw new CorreoYaRegistradoError();
      throw err;
    }
  }

  async createUserWithPersona(
    { user, persona, passwordHash, roles }: { user: User; persona: Persona; passwordHash?: string | null; roles: Rol[] },
  ): Promise<User> {
    return withTransaction(async (client) => {
      const enc = cipherCodec.encodeParaInsert('usuarios', {
        correo_electronico: user.correoElectronico,
        telefono: user.telefono,
      });
      const { rows: uRows } = await client.query<UsuarioRow>(
        `INSERT INTO usuarios
           (correo_electronico_enc, correo_electronico_bidx, telefono_enc, telefono_bidx,
            estado_cuenta, telefono_verificado, correo_verificado, id_municipio, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          enc.correo_electronico_enc, enc.correo_electronico_bidx, enc.telefono_enc, enc.telefono_bidx,
          user.estadoCuenta, user.telefonoVerificado, user.correoVerificado, user.idMunicipio, passwordHash ?? null,
        ],
      );
      const created = mapUserRow(uRows[0]);
      if (!created || created.idUsuario === null) throw new Error('No se pudo crear el usuario');

      const encP = cipherCodec.encodeParaInsert('personas', {
        nombre: persona.nombre,
        apellido_paterno: persona.apellidoPaterno,
        apellido_materno: persona.apellidoMaterno,
        fecha_nacimiento: persona.fechaNacimiento,
      });
      await client.query(
        `INSERT INTO personas
           (id_persona, nombre_enc, apellido_paterno_enc, apellido_materno_enc, id_sexo, fecha_nacimiento_enc)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          created.idUsuario, encP.nombre_enc, encP.apellido_paterno_enc,
          encP.apellido_materno_enc, persona.idSexo, encP.fecha_nacimiento_enc,
        ],
      );

      for (const rol of roles) {
        await client.query(
          'INSERT INTO usuario_roles (id_usuario, rol) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [created.idUsuario, rol],
        );
      }

      return created;
    });
  }

  // foto_perfil_s3_key ahora guarda la key del volumen local (legado el nombre de la columna).
  async updateProfilePhoto({ idUsuario, key }: { idUsuario: number; key: string }):
    Promise<{ user: User; previousKey: string | null }> {
    return withTransaction(async (client) => {
      const { rows: prev } = await client.query<{ foto_perfil_s3_key: string | null }>(
        'SELECT foto_perfil_s3_key FROM usuarios WHERE id_usuario = $1 FOR UPDATE',
        [idUsuario],
      );
      if (prev.length === 0) throw new Error('Usuario no encontrado');
      const previousKey = prev[0]!.foto_perfil_s3_key;

      const { rows } = await client.query<UsuarioRow>(
        `UPDATE usuarios SET foto_perfil_url = NULL, foto_perfil_s3_key = $2
          WHERE id_usuario = $1 RETURNING *`,
        [idUsuario, key],
      );
      const updated = mapUserRow(rows[0]);
      if (!updated) throw new Error('No se pudo actualizar la foto de perfil');
      return { user: updated, previousKey };
    });
  }

  async setPasswordHash(idUsuario: number, passwordHash: string): Promise<void> {
    await pool.query('UPDATE usuarios SET password_hash = $2 WHERE id_usuario = $1', [idUsuario, passwordHash]);
  }

  async passwordHashPorId(idUsuario: number): Promise<string | null> {
    const { rows } = await pool.query<{ password_hash: string | null }>(
      'SELECT password_hash FROM usuarios WHERE id_usuario = $1',
      [idUsuario],
    );
    return rows[0]?.password_hash ?? null;
  }

  async softDeleteAndClearPhoto(idUsuario: number): Promise<{ previousKey: string | null }> {
    return withTransaction(async (client) => {
      const { rows: prev } = await client.query<{ foto_perfil_s3_key: string | null }>(
        'SELECT foto_perfil_s3_key FROM usuarios WHERE id_usuario = $1 FOR UPDATE',
        [idUsuario],
      );
      if (prev.length === 0) throw new Error('Usuario no encontrado');
      const previousKey = prev[0]!.foto_perfil_s3_key;

      // Anonimización: correo/teléfono pasan a tombstone cifrado y dejan de ser buscables (bidx null).
      const anon = cipherCodec.anonimizar('usuarios', { correo_electronico: '', telefono: '' });
      await client.query(
        `UPDATE usuarios SET
            estado_cuenta = 'eliminado',
            foto_perfil_url = NULL, foto_perfil_s3_key = NULL,
            correo_electronico = NULL, telefono = NULL,
            correo_electronico_enc = $2, correo_electronico_bidx = $3,
            telefono_enc = $4, telefono_bidx = $5,
            password_hash = NULL
          WHERE id_usuario = $1`,
        [idUsuario, anon.correo_electronico_enc, anon.correo_electronico_bidx, anon.telefono_enc, anon.telefono_bidx],
      );
      return { previousKey };
    });
  }

  async actualizarPerfil(
    idUsuario: number,
    campos: {
      nombre?: string;
      apellidoPaterno?: string;
      apellidoMaterno?: string | null;
      idSexo?: number | null;
      fechaNacimiento?: string | null;
      telefono?: string;
    },
  ): Promise<User> {
    try {
      return await withTransaction(async (client) => {
        const encP = cipherCodec.encodeParaInsert('personas', {
          nombre: campos.nombre ?? null,
          apellido_paterno: campos.apellidoPaterno ?? null,
          apellido_materno: campos.apellidoMaterno ?? null,
          fecha_nacimiento: campos.fechaNacimiento ?? null,
        });
        // COALESCE($, <campo>_enc): si el campo no viene, conserva el cifrado actual.
        await client.query(
          `UPDATE personas SET
             nombre = NULL, apellido_paterno = NULL, apellido_materno = NULL, fecha_nacimiento = NULL,
             nombre_enc           = COALESCE($2, nombre_enc),
             apellido_paterno_enc = COALESCE($3, apellido_paterno_enc),
             apellido_materno_enc = COALESCE($4, apellido_materno_enc),
             id_sexo              = COALESCE($5, id_sexo),
             fecha_nacimiento_enc = COALESCE($6, fecha_nacimiento_enc)
           WHERE id_persona = $1`,
          [
            idUsuario,
            encP.nombre_enc,
            encP.apellido_paterno_enc,
            encP.apellido_materno_enc,
            campos.idSexo ?? null,
            encP.fecha_nacimiento_enc,
          ],
        );
        if (campos.telefono !== undefined) {
          const enc = cipherCodec.encodeParaInsert('usuarios', { telefono: campos.telefono });
          await client.query(
            'UPDATE usuarios SET telefono = NULL, telefono_enc = $2, telefono_bidx = $3 WHERE id_usuario = $1',
            [idUsuario, enc.telefono_enc, enc.telefono_bidx],
          );
        }
        return idUsuario;
      }).then((id) => this.findById(id)).then((u) => {
        if (!u) throw new Error('Usuario no encontrado tras actualizar');
        return u;
      });
    } catch (err) {
      if ((err as { code?: string }).code === '23505') throw new TelefonoDuplicadoError();
      throw err;
    }
  }

  async getRoles(idUsuario: number): Promise<Rol[]> {
    const { rows } = await pool.query<{ rol: Rol }>(
      'SELECT rol FROM usuario_roles WHERE id_usuario = $1 ORDER BY rol',
      [idUsuario],
    );
    return rows.map((r) => r.rol);
  }

  async addRol(idUsuario: number, rol: Rol): Promise<void> {
    await pool.query(
      'INSERT INTO usuario_roles (id_usuario, rol) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [idUsuario, rol],
    );
  }

  async suspenderCuenta(idUsuario: number): Promise<void> {
    await pool.query(
      `UPDATE usuarios SET estado_cuenta = 'suspendido'
        WHERE id_usuario = $1 AND estado_cuenta <> 'eliminado'`,
      [idUsuario],
    );
  }

  async reactivarCuenta(idUsuario: number): Promise<void> {
    await pool.query(
      `UPDATE usuarios SET estado_cuenta = 'activo'
        WHERE id_usuario = $1 AND estado_cuenta = 'suspendido'`,
      [idUsuario],
    );
  }
}
