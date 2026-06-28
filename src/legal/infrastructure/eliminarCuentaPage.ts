export function renderPaginaEliminarCuenta(supportEmail: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Eliminar tu cuenta — ViajeSeguro</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1f2933;
      background: #f4f6f8;
    }
    .wrap { max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; }
    header { text-align: center; margin-bottom: 32px; }
    header h1 { font-size: 1.6rem; margin: 0 0 8px; color: #102a43; }
    header p { margin: 0; color: #627d98; }
    .card {
      background: #fff;
      border: 1px solid #e4e7eb;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(16,42,67,.06);
    }
    h2 { font-size: 1.15rem; margin: 0 0 12px; color: #243b53; }
    ol, ul { margin: 0; padding-left: 22px; }
    li { margin-bottom: 6px; }
    a { color: #2563eb; }
    .aviso {
      border-left: 4px solid #d64545;
      background: #fff5f5;
      padding: 14px 16px;
      border-radius: 8px;
      margin-top: 8px;
    }
    .aviso strong { color: #a61b1b; }
    footer { text-align: center; color: #829ab1; font-size: .85rem; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Eliminar tu cuenta</h1>
      <p>ViajeSeguro</p>
    </header>

    <section class="card">
      <h2>Cómo eliminar tu cuenta desde la app</h2>
      <ol>
        <li>Abre la app de <strong>ViajeSeguro</strong>.</li>
        <li>Entra a <strong>Perfil</strong> (o Ajustes).</li>
        <li>Toca <strong>Eliminar cuenta</strong>.</li>
        <li>Confirma la acción.</li>
      </ol>
    </section>

    <section class="card">
      <h2>Si ya no tienes acceso a la app</h2>
      <p>
        Escríbenos a <a href="mailto:${supportEmail}">${supportEmail}</a> desde el
        correo con el que te registraste y solicita la eliminación de tu cuenta.
        Procesamos las solicitudes en un máximo de <strong>30 días</strong>.
      </p>
    </section>

    <section class="card">
      <h2>Qué datos se eliminan</h2>
      <ul>
        <li>Tu cuenta queda marcada como eliminada y no podrás volver a iniciar sesión.</li>
        <li>Tus datos de perfil (nombre, correo, teléfono y foto) se borran o se anonimizan.</li>
      </ul>
    </section>

    <section class="card">
      <h2>Qué datos se conservan y por qué</h2>
      <p>
        El historial de viajes se <strong>desliga de tu identidad y se conserva de
        forma anonimizada</strong> por obligaciones legales y operativas (por ejemplo,
        registros de seguridad y requisitos fiscales).
      </p>
      <div class="aviso">
        <strong>Importante:</strong> la eliminación de la cuenta es <strong>irreversible</strong>.
        Una vez completada no es posible recuperar la cuenta ni sus datos de perfil.
      </div>
    </section>

    <footer>
      ViajeSeguro · Contacto: <a href="mailto:${supportEmail}">${supportEmail}</a>
    </footer>
  </div>
</body>
</html>`;
}
