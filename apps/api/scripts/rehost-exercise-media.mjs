#!/usr/bin/env node
/**
 * Descarga las imágenes y videos de ejercicios que están hot-link a wger.de
 * y los rehospeda en Supabase Storage (bucket configurable), actualizando
 * las URLs en la tabla exercises.
 *
 * Uso:
 *   node scripts/rehost-exercise-media.mjs --dry-run             # Solo cuenta, no descarga ni sube
 *   node scripts/rehost-exercise-media.mjs --media=images        # Solo imágenes
 *   node scripts/rehost-exercise-media.mjs --media=videos        # Solo videos
 *   node scripts/rehost-exercise-media.mjs --media=both          # Default
 *   node scripts/rehost-exercise-media.mjs --limit=10            # Probar con los primeros N
 *   node scripts/rehost-exercise-media.mjs                        # Procesar TODO
 *
 * Requisitos:
 *   - DATABASE_URL en env (lee .env del workspace api)
 *   - SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en env
 *   - Bucket público creado en Supabase Storage (default: 'exercise-media'),
 *     configurable con SUPABASE_EXERCISE_BUCKET
 *
 * Es IDEMPOTENTE: si una URL ya NO contiene 'wger.de' significa que ya fue
 * rehospedada — la salta sin re-descargar.
 *
 * Espacio estimado: ~280MB para 1,079 imágenes + 39 videos (cabe en free tier 1GB).
 */

import { PrismaClient } from '@prisma/client';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const DRY_RUN = args['dry-run'] === true || args['dry-run'] === 'true';
const MEDIA = args.media ?? 'both'; // images | videos | both
const LIMIT = args.limit ? parseInt(args.limit) : null;

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const BUCKET = process.env.SUPABASE_EXERCISE_BUCKET ?? 'exercise-media';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en env');
  process.exit(1);
}

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────
function isExternal(url) {
  return typeof url === 'string' && url.includes('wger.de');
}

function extOf(url) {
  const u = new URL(url);
  const ext = u.pathname.split('.').pop()?.toLowerCase();
  return ext && ext.length <= 4 ? ext : 'bin';
}

function mimeOf(ext) {
  const map = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    m4v: 'video/mp4',
    webm: 'video/webm',
  };
  return map[ext.toLowerCase()] ?? 'application/octet-stream';
}

async function downloadAndUpload(externalUrl, pathInBucket) {
  // 1) descargar
  const dlRes = await fetch(externalUrl, {
    headers: { 'User-Agent': 'GymApp/1.0 (+gymapp.app)' },
  });
  if (!dlRes.ok) throw new Error(`download ${dlRes.status}`);
  const buffer = Buffer.from(await dlRes.arrayBuffer());
  if (buffer.length === 0) throw new Error('empty file');

  // 2) subir a Supabase Storage
  const ext = extOf(externalUrl);
  const mime = mimeOf(ext);
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${pathInBucket}`;
  const upRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': mime,
      'x-upsert': 'true',
      'Cache-Control': 'public, max-age=31536000', // 1 año (media inmutable)
    },
    body: buffer,
  });
  if (!upRes.ok) {
    const err = await upRes.text();
    throw new Error(`upload ${upRes.status}: ${err.slice(0, 200)}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${pathInBucket}`;
  return { url: publicUrl, sizeBytes: buffer.length };
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎬 Rehost de media de ejercicios');
  console.log(`   bucket=${BUCKET} · media=${MEDIA} · dry_run=${DRY_RUN}${LIMIT ? ` · limit=${LIMIT}` : ''}`);
  console.log('');

  // Trae solo ejercicios globales (gym_id null) que aún tienen URLs de wger
  const all = await prisma.exercise.findMany({
    where: { gym_id: null },
    select: { id: true, name: true, image_urls: true, video_url: true },
  });

  // Filtrar los que tienen ALGO en wger
  let pendingImg = [];
  let pendingVid = [];
  for (const ex of all) {
    if ((MEDIA === 'both' || MEDIA === 'images') && ex.image_urls?.some(isExternal)) {
      pendingImg.push(ex);
    }
    if ((MEDIA === 'both' || MEDIA === 'videos') && ex.video_url && isExternal(ex.video_url)) {
      pendingVid.push(ex);
    }
  }
  if (LIMIT) {
    pendingImg = pendingImg.slice(0, LIMIT);
    pendingVid = pendingVid.slice(0, LIMIT);
  }

  const totalImgs = pendingImg.reduce((acc, e) => acc + e.image_urls.filter(isExternal).length, 0);
  console.log(`📊 A rehospedar:`);
  console.log(`   • ${pendingImg.length} ejercicios con imágenes (${totalImgs} archivos)`);
  console.log(`   • ${pendingVid.length} ejercicios con video`);
  console.log('');

  if (DRY_RUN) {
    console.log('🟡 DRY RUN — no se descarga ni sube nada.');
    if (pendingImg[0])
      console.log('   Muestra:', pendingImg[0].name, '→', pendingImg[0].image_urls[0]);
    if (pendingVid[0]) console.log('   Muestra video:', pendingVid[0].name, '→', pendingVid[0].video_url);
    return;
  }

  let okImg = 0;
  let failImg = 0;
  let okVid = 0;
  let failVid = 0;
  let totalBytes = 0;

  // ─── IMÁGENES ─────────────────────────────────────────────────────────────
  if (MEDIA === 'both' || MEDIA === 'images') {
    console.log('🖼️  Procesando imágenes...');
    for (let i = 0; i < pendingImg.length; i++) {
      const ex = pendingImg[i];
      const newUrls = [];
      for (let j = 0; j < ex.image_urls.length; j++) {
        const url = ex.image_urls[j];
        if (!isExternal(url)) {
          newUrls.push(url); // ya rehospedada, conservar
          continue;
        }
        try {
          const ext = extOf(url);
          const path = `images/${ex.id}/${j}.${ext}`;
          const { url: publicUrl, sizeBytes } = await downloadAndUpload(url, path);
          newUrls.push(publicUrl);
          totalBytes += sizeBytes;
          okImg++;
        } catch (err) {
          newUrls.push(url); // conservar la original si falla
          failImg++;
          console.warn(`   ⚠️  fail ${ex.name} [${j}]: ${err.message}`);
        }
      }
      // Solo actualizar si cambió algo
      if (newUrls.some((u, k) => u !== ex.image_urls[k])) {
        await prisma.exercise.update({ where: { id: ex.id }, data: { image_urls: newUrls } });
      }
      if ((i + 1) % 25 === 0 || i === pendingImg.length - 1) {
        const mb = (totalBytes / 1024 / 1024).toFixed(1);
        process.stdout.write(
          `   ${i + 1}/${pendingImg.length} ejercicios · ${okImg} archivos OK · ${failImg} fail · ${mb}MB\r`,
        );
      }
    }
    console.log('');
  }

  // ─── VIDEOS ───────────────────────────────────────────────────────────────
  if (MEDIA === 'both' || MEDIA === 'videos') {
    console.log('🎥 Procesando videos...');
    for (let i = 0; i < pendingVid.length; i++) {
      const ex = pendingVid[i];
      const url = ex.video_url;
      try {
        const ext = extOf(url);
        const path = `videos/${ex.id}.${ext}`;
        const { url: publicUrl, sizeBytes } = await downloadAndUpload(url, path);
        await prisma.exercise.update({ where: { id: ex.id }, data: { video_url: publicUrl } });
        totalBytes += sizeBytes;
        okVid++;
      } catch (err) {
        failVid++;
        console.warn(`   ⚠️  fail ${ex.name}: ${err.message}`);
      }
      const mb = (totalBytes / 1024 / 1024).toFixed(1);
      process.stdout.write(
        `   ${i + 1}/${pendingVid.length} videos · ${okVid} OK · ${failVid} fail · ${mb}MB\r`,
      );
    }
    console.log('');
  }

  const totalMb = (totalBytes / 1024 / 1024).toFixed(1);
  console.log('');
  console.log(`✅ Listo.`);
  console.log(`   Imágenes: ${okImg} OK · ${failImg} fail`);
  console.log(`   Videos:   ${okVid} OK · ${failVid} fail`);
  console.log(`   Total subido: ${totalMb} MB`);
}

main()
  .catch((err) => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
