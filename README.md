# Especial León XIV en Argentina · El Tribuno

Micrositio responsive de una sola página para alojar en **GitHub Pages**, con cuenta regresiva y un bloque de las últimas cinco noticias publicadas bajo la etiqueta:

https://www.eltribuno.com/ttag/papa-leon-xiv-en-argentina

## Contenido incluido

- `index.html`: landing del especial (hero, cronómetro, minuto a minuto, agenda, Salta, perfil, multimedia, cierre).
- `assets/styles.css`: diseño editorial responsive, animación al hacer scroll y accesibilidad.
- `assets/app.js`: cuenta regresiva al 8 de noviembre de 2026 a las 16:30 **UTC−3** y recarga de `data/latest.json` cada 60 segundos.
- `data/latest.json`: archivo de noticias. Se entrega **vacío a propósito**, hasta realizar una extracción real; no se inventan titulares ni horas.
- `scripts/update_news.py`: descarga la etiqueta y visita las notas enlazadas para extraer título, copete, foto y fecha/hora mediante metadatos y JSON-LD.
- `.github/workflows/actualizar-noticias.yml`: actualización programada de los datos.

## Publicación en GitHub Pages

1. Crear un repositorio nuevo, por ejemplo `especial-leon-xiv-eltribuno`.
2. Subir **todo el contenido de esta carpeta a la raíz** del repositorio, incluyendo `.github/workflows/`.
3. En **Settings → Pages**, seleccionar `Deploy from a branch`, rama `main` y carpeta `/(root)`; guardar.
4. En **Settings → Actions → General → Workflow permissions**, habilitar **Read and write permissions** si el repositorio no lo permite por defecto. Esto es necesario para que la automatización guarde el JSON.
5. En **Actions**, abrir **Actualizar noticias de León XIV** y ejecutar `Run workflow` manualmente la primera vez.
6. Abrir `https://USUARIO.github.io/REPOSITORIO/` para comprobar el especial. Revisar la salida de la primera ejecución en Actions.

### Frecuencia real de actualización

La interfaz consulta `data/latest.json` **cada 60 segundos**, pero **GitHub Actions tiene un intervalo mínimo de programación de cinco minutos** y puede retrasarse, especialmente en momentos de alta demanda. Por lo tanto, esta solución **no garantiza** que una noticia se refleje en 60 segundos. Para una latencia real cercana al minuto, se necesitará una API o un servicio programado con esa frecuencia (por ejemplo, un servicio propio o un trabajador programado).

La automatización solo guarda entradas con una fecha/hora de publicación obtenida de metadatos reales de la nota, nunca horarios deducidos o inventados. Ordena todas las entradas por fecha y muestra las cinco más recientes, sin distinción entre secciones nacionales y salteñas.

El scraping puede requerir ajustes si el CMS cambia su HTML o limita accesos automatizados. Si falla, el script **no reemplaza** el JSON con resultados vacíos; el micrositio conserva la última versión válida. El servicio de GitHub Actions accede al sitio desde sus propios servidores; conviene coordinar con el equipo técnico de El Tribuno los permisos y/o solicitar un endpoint JSON/RSS oficial, que es la opción más estable.

## Elementos que faltan para publicar definitivamente

- Reemplazar o enriquecer el hero, Salta y la galería con **fotografías autorizadas** y sus créditos correspondientes. Los espacios actuales son diseño gráfico sin fotografías ajenas.
- Confirmar la hora de llegada al país **8/11/2026, 16:30 UTC−3**, tomada del ejemplo de diseño aportado por el usuario; si cambia, editar `TARGET` en `assets/app.js` y el texto del bloque en `index.html`.
- Actualizar textos/actividades de la agenda según el programa oficial definitivo.
- Para un sitio integrado al CMS, definir URLs de notas destacadas, material editorial, identidad oficial y enlace desde la home.
- No se incorpora automáticamente una etiqueta `LiveBlogPosting` a un agregador de notas; si se construye una cobertura editorial continua con entradas propias y verificadas, puede añadirse marcado estructurado apropiado.

## Prueba local

```bash
python3 -m pip install -r requirements.txt
python3 scripts/update_news.py
python3 -m http.server 8000
```

Abrir http://localhost:8000. Si no hay conexión a El Tribuno, el scraper devuelve un error y preserva el archivo de noticias existente.

## Integración mediante iframe

```html
<iframe
  src="https://USUARIO.github.io/REPOSITORIO/"
  title="León XIV en Argentina: especial El Tribuno"
  style="width:100%;min-height:900px;border:0;display:block"
  loading="lazy"></iframe>
```

**Recomendación**: enlazar a este micrositio como página independiente desde la portada, no embeber una página de scroll largo dentro de un iframe corto; de hacerlo, se necesita ajustar su altura o implementar `postMessage` entre ambos dominios.
