# Estructura de JONY y dónde buscar cada error

Regla: **una carpeta = una responsabilidad**. Si algo falla, el panel **Diagnóstico**
(botón arriba a la derecha o decir "estado del sistema") te dice el archivo exacto.

## Backend (`backend/`)
| Archivo | Qué hace | Si falla… |
|---|---|---|
| `server.js` | Arma el servidor y sirve la página | No abre `http://localhost:3000` |
| `config.js` | Puerto, hosts permitidos | Puerto ocupado → `set PORT=3100` |
| `middleware/security.js` | Cabeceras de seguridad, límite de peticiones, host/método | Error 421/405/429 |
| `routes/health.js` | `/api/health` (¿está vivo el servidor?) | "Servidor: sin conexión" |
| `routes/portfolio.js` | `/api/portfolio` (lee `data/portfolio.json`) | Portafolio no carga |
| `data/portfolio.json` | **Tus datos del portafolio** (edítalo aquí) | Error de formato: revisa comas y comillas |

## Frontend (`frontend/`)
| Carpeta / archivo | Qué hace |
|---|---|
| `index.html` | Estructura de la página (sin scripts ni estilos en línea, por seguridad) |
| `css/core/base.css` | Colores, tipografías, reinicio |
| `css/core/hud.css` | Núcleo de JONY, reloj, botones rápidos, campo de órdenes |
| `css/core/boot.css` | Animación de arranque y pantalla de error |
| `css/core/panels.css` | Paneles de portafolio y diagnóstico |
| `css/core/responsive.css` | Celular y pantallas pequeñas |
| `js/main.js` | Arranque: inicia cada pieza y la registra |
| `js/core/boot.js` | Animación de arranque (muestra la carga real) |
| `js/core/assistant.js` | Lo que JONY escribe y dice; saludo según la hora |
| `js/core/speech.js` | Voz de JONY |
| `js/core/sound.js` | Sonidos |
| `js/core/particles.js` | Fondo de partículas |
| `js/core/hud.js` | Reloj, estado del sistema, botón de sonido |
| `js/core/panels.js` | Abrir/cerrar paneles |
| `js/core/moduleLoader.js` | **Lista de módulos**; uno roto no tumba a los demás |
| `js/core/registry.js` | Registro de estados y errores (lo lee el diagnóstico) |
| `js/modules/quick-actions.js` | Botones "¿Qué quieres hacer hoy?" |
| `js/modules/commands.js` | Órdenes escritas (en la Fase 2 serán por voz) |
| `js/modules/diagnostics.js` | Panel de diagnóstico |
| `js/portfolio/portfolio.js` | Sección de portafolio |

## Cómo agregar un módulo en las próximas fases
1. Crear `frontend/js/modules/<nombre>.js` que exporte `init()`.
2. Añadir una línea en `MANIFEST` de `js/core/moduleLoader.js`.
3. Aparecerá solo en el diagnóstico, con su archivo y su estado.

## Revisar todo antes de usar
- `npm run check` → sintaxis, imports, ids del HTML, JSON y reglas de seguridad.
- `npm run smoke` → prueba el servidor y sus defensas.
- `npm test` → ambos.
