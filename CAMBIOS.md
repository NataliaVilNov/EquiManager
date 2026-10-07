# EquiLog — auditoría y revisión

Documento de los fallos encontrados y de lo que se ha corregido. Cada apartado indica el
problema, cómo se manifestaba y qué se ha hecho.

Estado al cerrar: **68 pruebas en verde** (antes 35) y compilación limpia.

---

## 1. Fallos críticos de pérdida de datos

### 1.1 Los formularios de edición guardaban los valores vacíos encima del registro

Todas las colecciones empiezan como `[]` y se rellenan por suscripción. No había ningún
indicador de carga, así que al abrir una URL de edición directamente (recarga, marcador,
enlace compartido) `xs.find(...)` devolvía `undefined`, los inicializadores de `useState`
capturaban los valores por defecto **y no volvían a ejecutarse** cuando llegaban los datos.

Al pulsar «Guardar» se escribía `amount: 0`, `splits: []`, pedigrí en blanco… sobre el
registro real. En `HorseFormPage` era peor todavía, porque `updateHorse` hace un `setDoc`
completo: se perdían pedigrí, propietarios, foto y notas. En `BoardCellPage`, guardar un
orden vacío **borraba la celda entera** de la planificación semanal.

Corregido con indicadores de carga por colección (`loaded` / `isLoaded(...)`) en el
contexto, un formulario que no se monta hasta tener datos reales, y `key` por registro para
que el estado se reinicie al pasar de una URL de edición a otra.

### 1.2 Un toque en «eliminar» borraba el año entero de una tarea repetida

`TaskCard` llamaba a `deleteTask(task.id)` aunque la tarjeta fuese **una repetición** y ese
id fuese el de la serie completa. El usuario pulsaba ✕ en la fila de hoy, confirmaba un
«¿Eliminar?» de una palabra, y desaparecían todas las repeticiones pasadas y futuras.

Ahora distingue repetición de serie y el texto de confirmación dice exactamente qué se va a
borrar.

### 1.3 La configuración de pizarras se sobrescribía con los valores por defecto

`boardConfig` arrancaba con `boardDefaults()` y los once mutadores hacían un reemplazo del
documento entero a partir del estado local. Si un administrador tocaba la configuración
antes de que llegara la suscripción, la configuración real de la cuadra —cada caminador,
cada paddock, cada franja, cada actividad— se sustituía por los valores de fábrica, y las
asignaciones existentes quedaban apuntando a huecos inexistentes.

Ahora se escriben campos sueltos y se rechaza cualquier escritura antes de que la
configuración esté cargada.

---

## 2. Fallos de cálculo

### 2.1 «1.500 €» se interpretaba como 500 €

El extractor de importes del pedido inteligente retrocedía sobre los últimos tres dígitos de
un número con punto de millar, y la segunda rama comparaba contra un texto al que ya se le
habían sustituido puntos y comas por espacios. Comprobado ejecutando el código original:

| Texto dictado | Importe que se guardaba |
|---|---|
| `coste 1.500€` | **500** |
| `el herrador cobro 1.200 euros` | **200** |
| `coste de 1.500` | **1** |
| `1.200,50€` | **200,5** |

Un gasto de 1.500 € entraba en la cuenta del caballo como 1 €, y de ahí pasaba a la
liquidación de venta y al reparto entre propietarios. Corregido y cubierto con pruebas.

### 2.2 «Repartir a partes iguales» generaba un reparto imposible de guardar

Redondeaba cada parte por separado a cero decimales y después el envío rechazaba todo lo que
se desviara más de 0,5 de 100. Con 3 propietarios salía 33+33+33 = **99** y el formulario se
quedaba bloqueado sin salida salvo editar a mano. Solo funcionaba con 1, 2, 4, 5, 10, 20, 25
y 50 propietarios. Ahora el resto se reparte y suma exactamente 100.

### 2.3 Se perdían céntimos en cada reparto

Cada parte se redondeaba por separado, así que la suma no cuadraba con el total (10,00 €
entre tres daba 9,99 €). La desviación se acumulaba y la pantalla de liquidación acababa
diciendo «✓ Cuentas cuadradas» mientras el libro no cuadraba. Ahora se calcula en céntimos
enteros y el resto se asigna, de modo que la suma es exacta.

### 2.4 Dos propietarios con el mismo nombre se cobraban por duplicado

Los mapas por propietario se indexaban por el nombre en minúsculas. Dos propietarios
llamados «Juan» —o dos sin nombre, ambos con clave vacía— compartían casilla: un gasto
prorrateado de 1.000 € se sumaba dos veces a la misma clave y después **ambas filas leían
1.000 €**, cargando 2.000 € de gastos contra un coste de 1.000 €. Ahora se indexa por
posición y se avisa de los nombres ambiguos.

---

## 3. Fallos de fechas y repeticiones

### 3.1 «Hoy» era ayer durante las primeras horas del día

`td()` devolvía la fecha **UTC**. En España (UTC+1/+2) entre medianoche y la una o las dos de
la madrugada devolvía el día anterior. El mozo que cerraba la ronda de noche a las 00:30
apuntaba la tarea en el día equivocado, y la cabecera seguía rotulando «Hoy» sobre el día
anterior. Más de 40 puntos de uso. Ahora se construye con la fecha local.

### 3.2 «Vencido» no aparecía nunca el primer día

`dU()` restaba la medianoche local del **mediodía** local, dejando medio día de resto que
`Math.round` convertía en +1. Comprobado: `dU(hoy)` devolvía **1** en vez de 0, y
`dU(ayer)` devolvía **-0** en vez de -1. Consecuencia: una vacuna vencida ayer se mostraba
como «🔔 En 0 d» en vez de «⚠ Vencido», y el estado de las columnas periódicas no marcaba
vencimiento hasta el segundo día de retraso.

### 3.3 Las repeticiones quincenales caían en la semana equivocada

El intervalo semanal se contaba desde la fecha de inicio en vez de desde el límite de
semana. Comprobado con «cada 2 semanas, lunes y miércoles» empezando el miércoles 7 de
octubre:

```
devolvía:  7 oct, 12 oct, 21 oct, 26 oct, 4 nov
correcto:  7 oct, 19 oct, 21 oct,  2 nov, 4 nov
```

El 12 y el 26 saltaban en semanas que no tocaban, y **todos los lunes de las semanas que sí
tocaban desaparecían**.

### 3.4 Las series con número de repeticiones se esfumaban a los tres años

El recorrido estaba limitado a 1.098 días desde el inicio de la serie. Una serie semanal con
500 repeticiones dura unos 9,6 años, así que a partir del cuarto año devolvía **cero
repeticiones**, sin aviso: una tarea de «herrar cada 6 semanas, 60 veces» creada en 2022
desaparecía de las pizarras en 2026.

### 3.5 Otros

- `addD`, `addMonth` y `boardStartOfWeek` serializaban en UTC una fecha construida en local
  (rompía a partir de UTC+13).
- `monthGrid` generaba un calendario en blanco con un parámetro `?month=` manipulado.

---

## 4. Seguridad

Cada uno de estos agujeros se explotaba con **una sola petición** desde una cuenta recién
registrada.

### 4.1 Cualquier usuario podía entrar en cualquier cuadra como administrador

La regla de incorporación validaba el propietario, el código, el nombre y que el número de
integrantes subiera en uno — pero **no restringía el mapa `members`** ni exigía conocer el
código. Bastaba un `updateDoc` añadiéndose a `memberIds` con `role: "admin"` para obtener
control total de la cuadra de un desconocido, incluido borrarla.

### 4.2 Un integrante que se iba podía echar al administrador

Mismo origen: solo se comprobaba el **tamaño** de la lista. Al marcharse se podía reescribir
el censo entero, quitar al administrador real y dejar un administrador títere.

### 4.3 Todas las cuadras de la base de datos eran legibles

`allow read: if signedIn()` sobre `/stables`: una sola consulta sin filtro volcaba el nombre,
el **código de invitación** y el mapa completo de integrantes —nombre, correo y rol de todos
los usuarios del producto—. Es además el paso de enumeración que hacía triviales los dos
agujeros anteriores.

### 4.4 Los códigos de invitación eran legibles y borrables por cualquiera

Se podía volcar la colección entera, borrar todas las invitaciones pendientes del sistema y
**ocupar el mismo código** apuntando a una cuadra propia, de modo que quien lo canjeara
entrara en la cuadra del atacante.

### 4.5 La restricción por caballo no se aplicaba al historial sanitario

Los gastos sí la respetaban; `health`, `healthDocs` y `trainings` no. Un mozo limitado a dos
caballos podía leer **el historial veterinario completo de la cuadra**, incluida la URL de
descarga de cada documento subido (radiografías, analíticas, informes de precompra), que
además sigue funcionando para quien se la reenvíe.

### 4.6 No existían reglas de Storage

No había ningún `storage.rules` en el repositorio y `firebase.json` solo declaraba Firestore,
así que `firebase deploy` **nunca tocaba** los permisos del bucket donde se guardan los
documentos sanitarios. El tope de 25 MB era solo de interfaz.

Se han añadido `storage.rules` (con tope de tamaño, lista blanca de tipos y denegación por
defecto) y `firestore.indexes.json`, ambos declarados en `firebase.json`.

### 4.7 Otros

- Un administrador podía apropiarse de la cuadra (cambiar `ownerId`, degradar al propietario).
- Cualquier integrante podía reclamar una ficha de equipo sin vincular, incluida una creada
  con permisos elevados.
- Se podían reetiquetar documentos de otra cuadra, borrando de hecho el estado de una tarea.
- Las reglas autorizaban por el **campo** `stableId`/`hid` sin comprobar la ruta real, lo que
  permitía escribir bajo otra cuadra y saltarse la restricción por caballo.
- Cualquier integrante podía borrar la configuración de pizarras aunque no tuviera permiso de
  borrado.
- El índice compuesto que necesita la consulta de repeticiones no estaba declarado en ningún
  sitio: en un proyecto nuevo esa suscripción falla en silencio y **todas las tareas
  repetidas completadas vuelven a aparecer como pendientes**.
- El token de Notion vivía en `localStorage` de un dominio de GitHub Pages, que es **el mismo
  origen para todos los sitios de esa cuenta**, y no se borraba al cerrar sesión. Ahora usa
  `sessionStorage` y se limpia al salir.
- El flujo de publicación usaba `npm install` en vez de `npm ci` pese a haber fichero de
  bloqueo, y concedía permisos de publicación al job que ejecuta código de dependencias.

> **Importante:** las reglas viven en el repositorio pero el flujo de publicación todavía no
> las despliega. Hasta ejecutar el comando documentado en el README, el proyecto sigue
> sirviendo lo que haya en la consola de Firebase.

---

## 5. Fiabilidad

- **Se avisaba de «guardado» antes de saber si se había guardado.** Los mutadores no se
  esperaban: el usuario veía «✓ Gasto añadido», volvía a una lista sin la fila y recibía
  después un aviso de error contradictorio, más una promesa rechazada sin recoger. Ahora todo
  se espera, y el aviso y la navegación solo ocurren si la escritura ha ido bien; si falla, el
  error se muestra sin perder lo escrito.
- **No había protección contra el doble toque.** Los identificadores se generaban dentro del
  manejador, así que un doble toque con mala cobertura creaba todo por duplicado — en el
  pedido inteligente, un lote entero de tareas, registros sanitarios y gastos. Ahora los
  botones se bloquean mientras se guarda.
- **Los lotes podían superar el límite de 500 operaciones de Firestore**, lo que rechaza la
  escritura **completa**: «repetir semana anterior» con más de 71 caballos no copiaba nada.
- **`batch.update` sobre un documento borrado cancelaba el lote entero**: al editar un
  registro sanitario cuyo gasto asociado ya no existía, **se perdía también la edición
  sanitaria**.
- **`deleteTask` lanzaba tres borrados en paralelo** y podía borrar la tarea antes que sus
  repeticiones, dejándolas huérfanas para siempre (Firestore no borra en cascada).
- **Los permisos no se refrescaban nunca.** `activeStable` era una lectura única: un
  integrante ascendido seguía sin ver la interfaz de administración toda la sesión, y uno
  degradado conservaba la interfaz y empezaba a recibir rechazos de las reglas mostrados como
  un error de guardado.
- **Carrera en el arranque de sesión:** si A cerraba sesión mientras cargaba su perfil, el
  perfil de A llegaba después y podía filtrar su última cuadra a la sesión de B.
- **Códigos de invitación sin comprobar colisión:** una colisión sobrescribía el código de
  otra cuadra, de modo que un código ya repartido empezaba a llevar a otro sitio.
- **Un fallo de `getContext("2d")` dejaba la promesa sin resolver** y el indicador de subida
  girando para siempre.
- **Las escrituras pendientes se descartaban al desmontar:** escribir el precio de venta y
  cambiar de pestaña antes de 250 ms perdía el dato sin aviso.
- **Los errores de lectura se anunciaban como errores de guardado**, lo que hacía casi
  imposible diagnosticar un índice que falta o un permiso denegado.

---

## 6. Rendimiento

- **El paquete era un único archivo de 1,29 MB** (398 kB comprimidos): toda la aplicación
  —pizarras, estadísticas, informes, Notion, liquidaciones— se descargaba para ver la pantalla
  de inicio. Ahora las rutas se cargan bajo demanda y las dependencias grandes van en
  fragmentos propios con su propia caché.
- **jsPDF se importaba en la raíz del módulo**, arrastrando html2canvas y dompurify (~616 kB)
  al paquete principal para una función que solo se usa al pulsar «Exportar PDF». Ahora se
  carga en ese momento.

  | | Antes | Ahora |
  |---|---|---|
  | Carga inicial (comprimida) | 407 kB | **240 kB** |
  | Generador de PDF en el arranque | sí | no |

- **La expansión de repeticiones se recalculaba en cada render.** La pantalla de estadísticas
  pide un rango de **730 días**, y el cálculo recorre día a día; como el contexto entrega un
  único valor con las 17 colecciones, cualquier actualización de cualquier colección
  reejecutaba decenas de miles de operaciones de fecha.
- **Suscripciones sin límite** a todo el histórico de entrenamientos, salud y gastos.

---

## 7. Diseño

Revisión con el criterio de las *Human Interface Guidelines* de Apple.

### Lo que ya estaba bien y se ha conservado

La aplicación **ya tenía un punto de vista propio**, y arraigado en su asunto: pergamino,
verde oliva y Cormorant Garamond son el cuaderno de cuadra, no una plantilla. No se ha
sustituido; se ha afilado.

### Fallos críticos corregidos

- **No existía modo oscuro.** Ni una sola regla `prefers-color-scheme` en toda la hoja de
  estilos, en una aplicación que se usa de noche y de madrugada. Ahora todo el color pasa por
  tokens semánticos con variante clara y oscura.
- **El foco del teclado era invisible.** Un único elemento en toda la aplicación tenía estilo
  de foco. Quien navega con teclado no sabía nunca dónde estaba.
- **Texto por debajo del mínimo legible.** Las HIG fijan 11 pt de mínimo absoluto. La
  navegación inferior estaba a **8,1 px**, las etiquetas de estadística a 8,7 px y las notas
  de celda a **6,75 px**. Suelo nuevo: 11 px, base 16 px.
- **Objetivos táctiles por debajo del mínimo.** Las HIG piden 44 × 44 px. Los botones de icono
  median 33 px, el círculo de estado 25 px y los botones de orden 28 px.
- **Seis parejas de color no llegaban al contraste mínimo**, calculadas con la fórmula WCAG,
  no estimadas: el botón de borrar estaba a 1,76:1 (prácticamente invisible), los separadores
  de secuencia a 2,10:1 y los huecos vacíos de pizarra a 1,57:1.
- **No se respetaba `prefers-reduced-motion`**, pese a haber una animación `pulse` infinita.
- **Controles pulsables que no eran botones.** Decenas de `<div onClick>` sin rol, sin foco y
  sin teclado: no se podía elegir una categoría de gasto, una actividad, una frecuencia de
  repetición ni un estado de pago sin ratón.
- **Etiquetas sin asociar a su campo** y botones de solo icono sin nombre accesible: el lector
  de pantalla anunciaba los dos controles de una fila de gasto como «lápiz» y «equis», sin
  distinguir editar de borrar.
- **La variable `--dk` se usaba en tres sitios sin estar definida en ninguno.**

### Criterio de diseño

- **Elemento distintivo: la cifra.** Cormorant Garamond sostiene todas las cantidades de la
  aplicación, con cifras tabulares para que las columnas de importes cuadren verticalmente.
- **Lo que se ha retirado:** la versalita espaciada aplicada indiscriminadamente a botones,
  etiquetas, pestañas y navegación a 8-10 px. Era ilegible y aplanaba la jerarquía. Ahora
  queda reservada a un único papel: el antetítulo de sección.
- Hoja inferior con asidero, cierre con `Escape`, foco retenido dentro y devuelto al salir.
- Icono de aplicación propio (herradura), con variante *maskable*, manifiesto e instalación.
- Hoja de estilos de impresión: los partes de cuadra y las liquidaciones se imprimen.

### Comprobación

Auditado con **axe-core (WCAG 2.1 AA)** a 402 px de ancho, en modo claro y oscuro: **cero
incidencias**. `docs/sistema-diseno.html` documenta el sistema y sirve para verlo de un
vistazo en ambos modos.

---

## 8. Lo que queda pendiente

Necesita trabajo de servidor y no se puede resolver solo en el cliente:

1. **Cloud Function para la entrada por código.** Las reglas no pueden comprobar el código que
   se teclea. Las medidas aplicadas lo convierten en un secreto real, pero la solución
   duradera es validarlo con el Admin SDK.
2. **Cloud Function para el aislamiento de Storage.** Las reglas de Storage no pueden leer
   Firestore: la pertenencia tiene que llegar como *custom claim*. La variante estricta está
   escrita y comentada al lado de cada regla; la activa es la provisional.
3. **Proxy para Notion**, para que el token no llegue nunca al navegador.
4. **Fichas de equipo identificadas por uid**, para que los permisos configurados se apliquen
   de verdad (hoy las reglas no reconocen las fichas con id aleatorio y recaen en los permisos
   por defecto).
5. **Desplegar las reglas** — ver el README.
6. Los informes de equipo y entrenamiento llaman a la API de Anthropic **desde el navegador y
   sin clave**, así que fallan siempre. Si la función debe funcionar, necesita un proxy de
   servidor; la alternativa es retirar el botón. No se ha añadido la clave al cliente a
   propósito: la publicaría a cualquier visitante.
7. **Borrar una sola repetición** de una tarea periódica. Hoy el contexto no tiene forma de
   expresar la excepción, así que la interfaz avisa explícitamente de que se borrará la serie
   entera en vez de hacerlo en silencio.
