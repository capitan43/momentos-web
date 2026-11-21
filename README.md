# MOMENTOS Online – primera versión conectable

Frontend React + Vite para publicación de dedicatorias y fotos en eventos MOMENTOS.

## Requisitos
- Node.js 20 o superior
- Proyecto Supabase (las tablas `events`, `memories` y bucket `momentos-fotos` ya creados)

## Preparar
1. Copia `.env.example` a `.env.local`.
2. Configura:
   - `VITE_SUPABASE_URL`: URL de proyecto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: publishable key.
3. En una terminal, dentro de esta carpeta:
   ```bash
   npm install
   npm run dev
   ```
4. Para construir producción: `npm run build`.

## Ruta de evento
La página invitado consulta el evento activo por `slug`. Usa `/e/slug-del-evento`.\n

## Funcionalidad incluida
- Consulta evento activo por slug.
- Formulario invitado (nombre, foto JPG/PNG/WebP hasta 10 MB, mensaje 700 caracteres).
- Upload de foto al bucket `momentos-fotos`.
- Inserción de recuerdo como `pending` (requiere moderación del anfitrión).
- Galería muestra recuerdos `approved` si `gallery_public=true`.
- Responsive para móvil.
- Sin credenciales preinstaladas; configura `.env.local` localmente.


## Estado y siguientes pasos
Este frontend no incluye todavía registro/login de anfitrión, creación de eventos, administración/moderación, QR, editor de tarjetas ni deployment. Antes de producción, revisar cuidadosamente las políticas RLS y del Storage, implementar rate limiting/antispam y decidir si fotos deben ser privadas o públicas. No agregar claves `service_role` al frontend.
