import 'server-only';
import sharp from 'sharp';
import { sql } from './db';

export const MAX_UPLOAD = 4 * 1024 * 1024; // keep below hosting request limits
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function saveImage(file: File, alt = '') {
  if (!ALLOWED.includes(file.type)) throw new Error('Please upload a JPG, PNG, WebP or AVIF image.');
  if (file.size > MAX_UPLOAD) throw new Error('Images must be under 4 MB.');
  const input = Buffer.from(await file.arrayBuffer());
  let out;
  try {
    out = await sharp(input, { limitInputPixels: 40_000_000 }).rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  } catch { throw new Error('That file could not be read as an image.'); }
  const [r] = await sql`insert into images (mime, width, height, bytes, data, alt)
    values ('image/webp', ${out.info.width}, ${out.info.height}, ${out.data.length}, ${out.data}, ${alt.slice(0, 200)}) returning id`;
  return r.id as string;
}
