# Entorno de desarrollo

## Dónde vive cada cosa

| Entorno | URL | Fuente |
|---|---|---|
| **Producción** | `https://servicios-goethe.github.io/goethe-carga-notas/` | raíz de `master` |
| **Desarrollo** | `https://servicios-goethe.github.io/goethe-carga-notas/dev/` | carpeta `dev/` de `master`, copiada desde la rama de desarrollo |

La rama de desarrollo es `claude/login-spreadsheet-debugging-58m3bd` (o la que
esté activa). La carpeta `dev/` es solo una **copia desplegada** de esa rama:
nunca se edita a mano.

¿Por qué una carpeta y no otro repo? El token de esta integración no permite
crear repos, y GitHub Pages sirve un solo sitio por repo. La carpeta comparte
**origen** con producción, así el Client ID de Google ya está autorizado y el
login real se puede probar sin tocar la consola de Google Cloud. Los archivos
de producción (raíz) no se modifican: solo se agrega la carpeta.

La app muestra el badge **ENTORNO DE PRUEBAS** cuando corre bajo `/dev/` o en
`localhost`, y antepone `[DEV]` al título de la pestaña.

## Publicar la rama de desarrollo en /dev/

```bash
git checkout master
git rm -rq dev 2>/dev/null; mkdir dev
git archive RAMA_DE_DESARROLLO | tar -x -C dev
rm -rf dev/docs dev/apps-script            # la carpeta solo necesita el sitio
git add dev && git commit -m "Deploy dev: <descripcion>"
git push origin master
```

Verificar antes del push que **solo** cambia `dev/`:
`git diff --stat HEAD~1 -- . ':!dev'` debe estar vacío.

## Pasar de desarrollo a producción

1. Probar en `/dev/` (login real, sync, carga, exportación).
2. Si el cambio toca `apps-script/`, actualizar el proyecto GAS
   (ver `apps-script/README.md`) — es retrocompatible salvo aviso.
3. Merge de la rama de desarrollo a `master` (fast-forward preferido).

## Datos

Desarrollo usa **el mismo spreadsheet y el mismo backend** que producción
(decisión acordada para probar con datos reales). Cuidado con "Guardar
borrador"/"Finalizar carga" desde /dev/: escriben en la solapa Cargas real.
Para pruebas de escritura usar un curso/evaluación de prueba.

---

# Análisis de login (app embebida con SSO goethe.edu.ar)

## Contexto

La app está embebida (iframe) en un sitio institucional donde el docente ya
tiene sesión de Google con su cuenta `@goethe.edu.ar`. El objetivo es que el
login sea lo más invisible posible y que la seguridad quede en el backend.

## Cadena de autenticación actual

1. **Google Identity Services (GIS)** en el cliente emite un **ID token** (JWT,
   dura ~1 hora) para el Client ID de la app.
2. El frontend valida el dominio del email (`@goethe.edu.ar`) y guarda el
   token.
3. Cada request al backend lleva el token; **Apps Script lo valida** contra
   `oauth2.googleapis.com/tokeninfo` (firma/vigencia, `aud` = Client ID,
   dominio permitido). El acceso anónimo del deployment no es un agujero: sin
   token válido no hay datos.

## Mejoras implementadas (esta rama)

| Mejora | Qué resuelve |
|---|---|
| `auto_select: true` + One Tap (`google.accounts.id.prompt()`) | El docente con una única sesión institucional entra **sin ningún click**. Antes había que apretar el botón siempre. |
| `use_fedcm_for_prompt: true` + `itp_support: true` | El flujo sobrevive al bloqueo de cookies de terceros (Chrome las está eliminando; Safari ya). Crítico dentro de un iframe. |
| Sesión en `sessionStorage` (con chequeo de expiración) | Una recarga o navegación dentro del sitio institucional no vuelve a pedir login mientras el token siga vigente. Por pestaña: no queda sesión en máquinas compartidas. |
| Expiración manejada (`tokenSecondsLeft`) | A la hora, en vez de errores confusos, la app vuelve al gate con mensaje claro y reintenta One Tap (re-login de un click o silencioso). |
| Rechazo temprano de cuentas fuera del dominio (`hd` + verificación en callback) | Cuentas personales no entran ni generan errores tardíos. |

## Limitación conocida del embebido

Dentro de un iframe **cross-origin**, One Tap/FedCM requiere que el sitio
contenedor agregue `allow="identity-credentials-get"` al iframe. En Google
Sites eso no se puede configurar → en ese caso One Tap no aparece y queda el
**botón oficial de Google** (usa popup, no depende de cookies de terceros) y
el enlace "Abrir en pestaña nueva". Si el contenedor es un sitio propio,
agregar ese atributo al iframe habilita el login 100 % silencioso.

## Diagnóstico

En la consola del navegador: `goethe.help()` — comandos `enableDebug`,
`status`, `testUrl`, `ping` para inspeccionar login, config y backend.
