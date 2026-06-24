import { pool, withTransaction } from '../../core/db.js';
import type { PoolClient } from 'pg';
import { User, UserBuilder, type EstadoCuenta, type RolUsuario } from '../domain/User.js';
import type { Persona } from '../domain/Persona.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { TelefonoDuplicadoError } from '../domain/errors.js';
import { CorreoYaRegistradoError } from '../../auth/domain/errors.js';

interface UsuarioRow {
  id_usuario: string | number;
  telefono: string | null;
  correo_electronico: string;
  telefono_verificado: boolean;
  correo_verificado: boolean;
  rol: RolUsuario;
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
  return new UserBuilder()
    .idUsuario(typeof row.id_usuario === 'string' ? Number(row.id_usuario) : row.id_usuario)
    .telefono(row.telefono)
    .correoElectronico(row.correo_electronico)
    .rol(row.rol)
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
    const { rows } = await pool.query<UsuarioRow>(
      'SELECT * FROM usuarios WHERE telefono = $1 LIMIT 1',
      [telefono],
    );
    return mapUserRow(rows[0]);
  }

  async findByCorreo(correo: string): Promise<User | null> {
    const { rows } = await pool.query<UsuarioRow>(
      'SELECT * FROM usuarios WHERE correo_electronico = $1 LIMIT 1',
      [correo],
    );
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

  async createAdmin(
    { correo, passwordHash }: { correo: string; passwordHash: string },
    client?: PoolClient,
  ): Promise<User> {
    const exec = client ?? pool;
    try {
      const { rows } = await exec.query<UsuarioRow>(
        `INSERT INTO usuarios
           (telefono, correo_electronico, rol, estado_cuenta, telefono_verificado, correo_verificado, id_municipio, password_hash)
         VALUES (NULL, $1, 'admin', 'activo', false, true, NULL, $2)
         RETURNING *`,
        [correo, passwordHash],
      );
      const created = mapUserRow(rows[0]);
      if (!created) throw new Error('No se pudo crear el admin');
      return created;
    } catch (err) {
      if ((err as { code?: string }).code === '23505') throw new CorreoYaRegistradoError();
      throw err;
    }
  }

  async createUserWithPersona(
    { user, persona, passwordHash }: { user: User; persona: Persona; passwordHash?: string | null },
  ): Promise<User> {
    return withTransaction(async (client) => {
      const { rows: uRows } = await client.query<UsuarioRow>(
        `INSERT INTO usuarios
           (telefono, correo_electronico, rol, estado_cuenta, telefono_verificado, correo_verificado, id_municipio, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          user.telefono, user.correoElectronico, user.rol, user.estadoCuenta,
          user.telefonoVerificado, user.correoVerificado, user.idMunicipio, passwordHash ?? null,
        ],
      );
      const created = mapUserRow(uRows[0]);
      if (!created || created.idUsuario === null) throw new Error('No se pudo crear el usuario');

      await client.query(
        `INSERT INTO personas
           (id_persona, nombre, apellido_paterno, apellido_materno, id_sexo, fecha_nacimiento)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          created.idUsuario, persona.nombre, persona.apellidoPaterno,
          persona.apellidoMaterno, persona.idSexo, persona.fechaNacimiento,
        ],
      );
      return created;
    });
  }

  async updateProfilePhoto({
    idUsuario, fotoPerfilUrl, fotoPerfilS3Key,
  }: { idUsuario: number; fotoPerfilUrl: string; fotoPerfilS3Key: string }):
    Promise<{ user: User; previousS3Key: string | null }> {
    return withTransaction(async (client) => {
      const { rows: prev } = await client.query<{ foto_perfil_s3_key: string | null }>(
        'SELECT foto_perfil_s3_key FROM usuarios WHERE id_usuario = $1 FOR UPDATE',
        [idUsuario],
      );
      if (prev.length === 0) throw new Error('Usuario no encontrado');
      const previousS3Key = prev[0]!.foto_perfil_s3_key;

      const { rows } = await client.query<UsuarioRow>(
        `UPDATE usuarios SET foto_perfil_url = $2, foto_perfil_s3_key = $3
          WHERE id_usuario = $1 RETURNING *`,
        [idUsuario, fotoPerfilUrl, fotoPerfilS3Key],
      );
      const updated = mapUserRow(rows[0]);
      if (!updated) throw new Error('No se pudo actualizar la foto de perfil');
      return { user: updated, previousS3Key };
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

  async softDeleteAndClearPhoto(idUsuario: number): Promise<{ previousS3Key: string | null }> {
    return withTransaction(async (client) => {
      const { rows: prev } = await client.query<{ foto_perfil_s3_key: string | null }>(
        'SELECT foto_perfil_s3_key FROM usuarios WHERE id_usuario = $1 FOR UPDATE',
        [idUsuario],
      );
      if (prev.length === 0) throw new Error('Usuario no encontrado');
      const previousS3Key = prev[0]!.foto_perfil_s3_key;

      await client.query(
        `UPDATE usuarios
            SET estado_cuenta = 'eliminado', foto_perfil_url = NULL, foto_perfil_s3_key = NULL
          WHERE id_usuario = $1`,
        [idUsuario],
      );
      return { previousS3Key };
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
        await client.query(
          `UPDATE personas SET
             nombre           = COALESCE($2, nombre),
             apellido_paterno = COALESCE($3, apellido_paterno),
             apellido_materno = COALESCE($4, apellido_materno),
             id_sexo          = COALESCE($5, id_sexo),
             fecha_nacimiento = COALESCE($6, fecha_nacimiento)
           WHERE id_persona = $1`,
          [
            idUsuario,
            campos.nombre ?? null,
            campos.apellidoPaterno ?? null,
            campos.apellidoMaterno ?? null,
            campos.idSexo ?? null,
            campos.fechaNacimiento ?? null,
          ],
        );
        if (campos.telefono !== undefined) {
          await client.query(
            'UPDATE usuarios SET telefono = $2 WHERE id_usuario = $1',
            [idUsuario, campos.telefono],
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
}
