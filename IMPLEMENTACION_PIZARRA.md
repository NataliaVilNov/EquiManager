# Implementación de la pizarra v16 en EquiLog

## Archivos modificados

- `public/legacy-app.js`: pizarra principal, VET, copia, notas, estado hecho, gestión rápida de caballos, registro rápido, navegación semanal y estado de guardado.
- `src/styles.css`: diseño responsive de la pizarra, modales, herramientas y registro rápido.
- `index.html`: navegación principal simplificada.
- `README.md`: documentación de esta versión.

## Archivo eliminado

- `src/legacy-app.js`: era una copia que no se ejecutaba. `index.html` carga `./legacy-app.js`, que Vite sirve desde `public/legacy-app.js`.

## Migración de datos

No se cambia de base de datos ni se mueve información a otra colección. La primera vez que la pizarra se usa se amplía de forma no destructiva `boardConfig` y `weeklyPlans` con los nuevos campos necesarios (`completed`, `note`, `vetDetails`, `healthId`). Los registros existentes se conservan.

Los caballos antiguos que no tengan el campo `active` se consideran activos por defecto. Al editar un caballo desde la pizarra se guardan `active`, `status` y `location` sin eliminar el resto de su ficha.

## Funciones antiguas conservadas pero menos visibles

- Entrenamientos y agenda diaria.
- Salud completa y documentación sanitaria.
- Gastos, reparto y liquidaciones.
- Equipo y permisos.
- Alertas.
- Estadísticas.
- Informes.
- Gestión general de cuadra.

Se accede a ellas desde la ficha del caballo o desde `Más`.

## Pruebas ejecutadas en esta entrega

- `node --check public/legacy-app.js`: superado.
- Arranque del script completo con DOM simulado: superado.
- Renderizado de la pizarra con dos caballos y siete días: superado.
- Añadir y retirar un botón de una casilla: superado.
- VET primer toque `?`, segundo toque editor y creación de Salud/Gasto vinculado: superado.
- Copia de casilla: superado; no arrastra estado Hecho.
- Repetir semana anterior: superado; conserva casillas existentes y no copia Hecho.
- Registro rápido de Salud para varios caballos con gasto y revisión: superado.
- Alta rápida de caballo e inactivación para ocultarlo de la pizarra: superado.
- Inicio de la app con los cuatro botones de navegación: superado.

## Pruebas no ejecutadas contra servicios externos

No se ha iniciado sesión contra el proyecto Firebase real ni se han escrito datos reales de la cuadra durante estas pruebas. La compilación con Vite tampoco pudo completarse en el entorno de trabajo porque la instalación de dependencias NPM agotó el tiempo disponible; el JavaScript sí ha pasado la comprobación sintáctica de Node y las pruebas de lógica/arranque descritas arriba.

La comprobación visual automatizada en Chromium a 390×844, 430×932, tablet y escritorio no pudo ejecutarse porque el entorno bloquea la navegación local del navegador headless. El CSS está diseñado sin `overflow-x:auto` para la cuadrícula principal y con `table-layout: fixed`, pero esas cuatro resoluciones deben verificarse también al publicar la aplicación.
