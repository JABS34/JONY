# JONY — asistente estilo JARVIS (Fase 1)

## Cómo abrirlo en Windows
1. Instala **Node.js LTS** desde https://nodejs.org (una sola vez).
2. Descomprime esta carpeta.
3. Doble clic en **`INICIAR.bat`**. Se abre el navegador en `http://localhost:3000`.

También sirve: abrir una terminal en la carpeta y ejecutar `npm install` y luego `npm start`.
**No abras `index.html` con doble clic**: el navegador bloquea los módulos y JONY no arranca.

Usa **Chrome o Edge** para la mejor voz.

## Qué incluye la Fase 1
- Animación de arranque que muestra la carga real de cada módulo (se puede saltar con el botón o Esc).
- Saludo de JONY según la hora, con texto y voz.
- Núcleo animado que reacciona cuando JONY habla.
- Botones "¿Qué quieres hacer hoy?" y campo de órdenes escritas.
- Portafolio (edita `backend/data/portfolio.json`).
- Panel de diagnóstico: qué módulo falló y en qué archivo.
- Sonidos sintetizados y botón para silenciar.

## Órdenes que entiende ahora
`ayuda`, `ver portafolio`, `estado del sistema`, `qué hora es`, `qué día es`, `silencio`, `activar voz`, `cerrar`.

## Seguridad
Servidor solo local (127.0.0.1), política de contenido estricta (sin scripts ni estilos en línea),
solo métodos GET/HEAD, lista de hosts permitidos, límite de peticiones, sin `innerHTML`.

Más detalle de carpetas en `docs/ESTRUCTURA.md`.
