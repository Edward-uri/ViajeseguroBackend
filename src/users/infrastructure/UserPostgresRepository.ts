import { pool, withTransaction } from '../../core/db.js';
import { User, type EstadoCuenta, type RolUsuario } from '../domain/User.js';
import type { Persona } from '../domain/Persona.js';
import type { IUserRepository } from '../domain/IUserRepository.js';

interface UsuarioRow {
  id_usuario: string | number;
  nombre_usuario: string;
  password_hash: string;
  rol: RolUsuario;
  estado_cuenta: EstadoCuenta;
  fecha_registro: Date;
  foto_perfil_url: string | null;
  foto_perfil_s3_key: string | null;
}

function mapUserRow(row: UsuarioRow | undefined): User | null {
  if (!row) return null;
  return new User({
    idUsuario: typeof row.id_usuario === 'string' ? Number(row.id_usuario) : row.id_usuario,
    nombreUsuario: row.nombre_usuario,
    passwordHash: row.password_hash,
    rol: row.rol,
    estadoCuenta: row.estado_cuenta,
    fechaRegistro: row.fecha_registro,
    fotoPerfilUrl: row.foto_perfil_url,
    fotoPerfilS3Key: row.foto_perfil_s3_key,
  });
}

export class UserPostgresRepository implements IUserRepository {
  async findByUsername(nombreUsuario: string): Promise<User | null> {
    const { rows } = await pool.query<UsuarioRow>(
      'SELECT * FROM usuarios WHERE nombre_usuario = $1 LIMIT 1',
      [nombreUsuario],
    );
    return mapUserRow(rows[0]);
  }

  async findByCorreo(correo: string): Promise<User | null> {
    const { rows } = await pool.query<UsuarioRow>(
      `SELECT u.*
         FROM usuarios u
         JOIN personas p ON p.id_persona = u.id_usuario
        WHERE p.correo_electronico = $1
        LIMIT 1`,
      [correo],
    );
    return mapUserRow(rows[0]);
  }

  async findByUsernameOrCorreo(identifier: string): Promise<User | null> {
    // Si parece email, busca por correo; si no, por nombre de usuario.
    // Hacemos una sola query con OR para mantenerlo en un solo round-trip.
    const { rows } = await pool.query<UsuarioRow>(
      `SELECT u.*
         FROM usuarios u
         LEFT JOIN personas p ON p.id_persona = u.id_usuario
        WHERE u.nombre_usuario = $1
           OR p.correo_electronico = $1
        LIMIT 1`,
      [identifier],
    );
    return mapUserRow(rows[0]);
  }

  async findById(idUsuario: number): Promise<User | null> {
    const { rows } = await pool.query<UsuarioRow>(
      'SELECT * FROM usuarios WHERE id_usuario = $1 LIMIT 1',
      [idUsuario],
    );
    return mapUserRow(rows[0]);
  }

  async createUserWithPersona({ user, persona }: { user: User; persona: Persona }): Promise<User> {
    return withTransaction(async (client) => {
      const { rows: uRows } = await client.query<UsuarioRow>(
        `INSERT INTO usuarios (nombre_usuario, password_hash, rol, estado_cuenta)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [user.nombreUsuario, user.passwordHash, user.rol, user.estadoCuenta],
      );
      const created = mapUserRow(uRows[0]);
      if (!created || created.idUsuario === null) {
        throw new Error('No se pudo crear el usuario');
      }

      await client.query(
        `INSERT INTO personas (
            id_persona, nombre, apellido_paterno, apellido_materno,
            id_sexo, correo_electronico, telefono, fecha_nacimiento
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          created.idUsuario,
          persona.nombre,
          persona.apellidoPaterno,
          persona.apellidoMaterno,
          persona.idSexo,
          persona.correoElectronico,
          persona.telefono,
          persona.fechaNacimiento,
        ],
      );

      return created;
    });
  }

  async updateProfilePhoto({
    idUsuario,
    fotoPerfilUrl,
    fotoPerfilS3Key,
  }: {
    idUsuario: number;
    fotoPerfilUrl: string;
    fotoPerfilS3Key: string;
  }): Promise<{ user: User; previousS3Key: string | null }> {
    return withTransaction(async (client) => {
      const { rows: prevRows } = await client.query<{ foto_perfil_s3_key: string | null }>(
        'SELECT foto_perfil_s3_key FROM usuarios WHERE id_usuario = $1 FOR UPDATE',
        [idUsuario],
      );
      if (prevRows.length === 0) {
        throw new Error('Usuario no encontrado');
      }
      const previousS3Key = prevRows[0]!.foto_perfil_s3_key;

      const { rows } = await client.query<UsuarioRow>(
        `UPDATE usuarios
            SET foto_perfil_url = $2,
                foto_perfil_s3_key = $3
          WHERE id_usuario = $1
          RETURNING *`,
        [idUsuario, fotoPerfilUrl, fotoPerfilS3Key],
      );
      const updated = mapUserRow(rows[0]);
      if (!updated) {
        throw new Error('No se pudo actualizar la foto de perfil');
      }
      return { user: updated, previousS3Key };
    });
  }

  async softDeleteAndClearPhoto(
    idUsuario: number,
  ): Promise<{ previousS3Key: string | null }> {
    return withTransaction(async (client) => {
      const { rows: prevRows } = await client.query<{ foto_perfil_s3_key: string | null }>(
        'SELECT foto_perfil_s3_key FROM usuarios WHERE id_usuario = $1 FOR UPDATE',
        [idUsuario],
      );
      if (prevRows.length === 0) {
        throw new Error('Usuario no encontrado');
      }
      const previousS3Key = prevRows[0]!.foto_perfil_s3_key;

      await client.query(
        `UPDATE usuarios
            SET estado_cuenta = 'eliminado',
                foto_perfil_url = NULL,
                foto_perfil_s3_key = NULL
          WHERE id_usuario = $1`,
        [idUsuario],
      );

      return { previousS3Key };
    });
  }
}
