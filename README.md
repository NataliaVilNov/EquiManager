# EquiLog — la pizarra semanal como pantalla principal

Al entrar en una cuadra, EquiLog abre directamente la **pizarra semanal**: caballos en
la columna izquierda, lunes a domingo en las siete columnas, y desde ahí se organiza
la semana, se editan y añaden caballos, se registran salud/gastos/recordatorios y se
resuelven las actuaciones veterinarias.

## Estructura del código

| Archivo | Qué es |
| --- | --- |
| `index.html` | Cascarón: pantallas de acceso, cabecera, paneles y navegación. |
| `public/legacy-app.js` | **Única** fuente real de la aplicación clásica (fichas, salud, gastos, equipo, estadísticas…). Se sirve tal cual, sin empaquetar. |
| `public/pizarra.js` | Motor de la pizarra semanal. Se carga después de `legacy-app.js` y comparte su ámbito global (`D`, `V`, `save()`, `render()`…). |
| `src/main.js` | Punto de entrada de Vite: estilos + arranque de Firebase. |
| `src/firebase.js` | Configuración de Firebase y expositor de `window._FB`. |
| `src/styles.css` | Estilos de la aplicación clásica. |
| `src/pizarra.css` | Estilos de la pizarra (clases con prefijo `pz-`). |

> Antes existían dos copias de `legacy-app.js` (`src/` y `public/`). Vite solo ejecutaba
> la de `public/`; la de `src/` estaba obsoleta y se ha eliminado. **Edita siempre
> `public/legacy-app.js`.**

## Datos

Todo vive en Firebase, en el documento `stables/{cuadraId}/data/main`, igual que antes.
La pizarra añade a ese mismo documento:

- `boardTools` — botones de personas y actividades de la cuadra.
- `weeklyPlans` — `{hid, date, activities[], done[], note, vet}`.
- En cada caballo: `active`, `status`, `location`. El **orden** de la pizarra es el orden
  del array `horses`, compartido por todos los usuarios de la cuadra.

Los planes antiguos (que guardaban ids de actividad) se convierten a códigos
automáticamente la primera vez que se abre la cuadra.

## Funciones clásicas

No se ha eliminado ninguna. Las que no son de uso diario salen de la navegación
principal y se abren desde el botón `•••` (Más) de la pizarra o desde la ficha del
caballo: resumen de inicio, tareas del día, alertas, equipo y calendario, cuadra,
estadísticas, informes, liquidaciones, pizarras de caminador y paddocks, pedigrí.

## Publicación

Sube el contenido de esta carpeta al repositorio y pulsa `Commit changes`.
GitHub Actions publica la versión automáticamente.
