# EquiLog — pizarra semanal como interfaz principal

Esta versión mantiene la arquitectura original Vite + Firebase de EquiLog y adapta la lógica visual y funcional de la pizarra semanal v16 al mismo modelo de datos. No incorpora Next.js ni D1 y no crea una segunda base de datos.

## Uso diario

Al abrir una cuadra se entra directamente en la pizarra semanal. La navegación principal queda reducida a:

- Pizarra
- Registro
- Caballos
- Más

Las funciones antiguas de salud, gastos, equipo, alertas, estadísticas, informes y gestión avanzada se conservan y siguen usando el mismo objeto de datos de Firebase.

## Pizarra

- Caballos activos + lunes a domingo en una única cuadrícula responsive.
- Botones configurables de personas y actividades.
- Añadir/quitar actividades con un toque.
- Nota por casilla.
- Estado Hecho individual por actividad.
- Copiar una casilla a otra, a toda la semana de un caballo o a todos los caballos de un día.
- Borrar casilla con confirmación cuando contiene información relevante.
- Repetir semana anterior sin copiar estados completados ni sobrescribir casillas ya ocupadas.
- Indicador Guardando / Guardado / Sin conexión.
- VET en dos pasos: primer toque deja `VET ?`; segundo toque abre el detalle y lo integra con Salud y, si procede, Gastos y revisión posterior.

## Registro rápido

El registro rápido permite seleccionar uno o varios caballos y crear:

- Salud, con revisión y gasto opcionales.
- Gastos.
- Recordatorios, reutilizando el sistema de tareas/agenda de EquiLog.

## Caballos

Desde la pizarra se pueden añadir, editar, activar/desactivar y reordenar caballos. Pulsar directamente el nombre de un caballo abre su edición rápida. Los datos avanzados siguen disponibles en la ficha completa.

## Arquitectura

`public/legacy-app.js` es ahora la única fuente del script clásico de EquiLog. Se eliminó la copia duplicada de `src/legacy-app.js`, que Vite no estaba ejecutando. Firebase continúa siendo el sistema único de autenticación y persistencia.
