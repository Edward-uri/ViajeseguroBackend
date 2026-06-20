import { pool, withTransaction } from '../../core/db.js';
import { User, UserBuilder, type EstadoCuenta, type RolUsuario } from '../domain/User.js';
import type { Persona } from '../domain/Persona.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';

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
      'SELECT * FROM usuarios WHERE id_usuario = $1 LIMIT 1',
      [idUsuario],
    );
    return mapUserRow(rows[0]);
  }

  async createUserWithPersona({ user, persona }: { user: User; persona: Persona }): Promise<User> {
    return withTransaction(async (client) => {
      const { rows: uRows } = await client.query<UsuarioRow>(
        `INSERT INTO usuarios
           (telefono, correo_electronico, rol, estado_cuenta, telefono_verificado, correo_verificado, id_municipio)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          user.telefono, user.correoElectronico, user.rol, user.estadoCuenta,
          user.telefonoVerificado, user.correoVerificado, user.idMunicipio,
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
}
