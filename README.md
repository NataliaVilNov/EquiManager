# EquiLog — cuaderno de cuadra

> **Revisión de octubre de 2026.** Esta versión corrige fallos de pérdida de datos, errores
> de cálculo de importes y fechas, y varios agujeros de seguridad; e incorpora modo oscuro y
> una revisión de accesibilidad. El detalle está en [`CAMBIOS.md`](CAMBIOS.md), y el sistema
> de diseño en [`docs/sistema-diseno.html`](docs/sistema-diseno.html) (ábrelo en el navegador).
>
> Antes de publicar, lee el apartado **Seguridad: reglas de Firebase** más abajo: las reglas
> nuevas no se despliegan solas.

## Puesta en marcha

```bash
npm ci          # instala exactamente lo del fichero de bloqueo
npm run dev     # servidor de desarrollo
npm test        # 68 pruebas
npm run build   # compilación de producción
```

Copia `.env.example` a `.env` y rellena las claves del proyecto de Firebase.

Esta versión incorpora:

- Pizarra principal semanal por caballo y día.
- Actividades ordenadas cronológicamente mediante abreviaturas configurables.
- Columnas periódicas personalizables (herraje, desparasitación, dientes, etc.).
- Pizarra diaria de caminadores con número de huecos y horarios configurables.
- Pizarra diaria de paddocks con nombres y franjas configurables.
- Asignación mediante arrastrar y soltar en ordenador, y selección + toque como alternativa en móvil.
- Colores consistentes: verde correcto, amarillo pendiente, rojo conflicto y azul información.

## Publicación

Sube todo el contenido de esta carpeta al repositorio de GitHub y pulsa `Commit changes`. GitHub Actions publicará automáticamente la versión.

## Seguridad: reglas de Firebase

Las reglas de seguridad viven en el repositorio, pero **el pipeline todavía no las despliega**:

- `firestore.rules` — permisos de Firestore (pertenencia a cuadra, matriz de permisos por
  integrante, restricción por caballo `allowedUids`).
- `storage.rules` — permisos de Firebase Storage (documentos sanitarios, fotos). Tope de
  25 MB y lista blanca de tipos de contenido.
- `firestore.indexes.json` — índices compuestos que necesitan las consultas de la app
  (actualmente el de `occurrences` por `stableId` + `date`).

Los tres están declarados en `firebase.json`, así que se despliegan juntos con:

```
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project <PROJECT_ID>
```

Hasta que se ejecute ese comando (o se active el job `deploy-rules`, comentado en
`.github/workflows/deploy.yml`), **el proyecto sigue sirviendo las reglas que haya en la
consola de Firebase**, no las de este repositorio.

Pendientes conocidos, anotados en los propios ficheros de reglas:

- Las reglas de Storage no pueden leer Firestore: el aislamiento por cuadra necesita una
  Cloud Function que mantenga la pertenencia como *custom claim* del token. La variante
  activa hoy es la provisional (usuario autenticado + tope de tamaño + tipos permitidos).
- La entrada por código de invitación no se puede validar desde las reglas; la solución
  duradera es una Cloud Function que compruebe el código con el Admin SDK.
- El token de Notion debería dejar de llegar al navegador (proxy vía Cloud Function); de
  momento se guarda en `sessionStorage` y se borra al cerrar sesión.
