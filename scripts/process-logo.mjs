import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SCRIPTS_DIR = import.meta.dirname;
const ROOT_DIR = path.resolve(SCRIPTS_DIR, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'fn-frontend', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const SOURCE_INPUT = path.join(PUBLIC_DIR, 'fn-logo.png');
const BACKUP_INPUT = path.join(PUBLIC_DIR, 'fn-logo-original.png');

async function run() {
  console.log('--- Fair Nigeria Logo & Icon Processor ---');

  // 1. Ensure source file exists
  let sourceExists = false;
  try {
    await fs.access(SOURCE_INPUT);
    sourceExists = true;
  } catch {
    // Check backup
    try {
      await fs.access(BACKUP_INPUT);
      sourceExists = true;
    } catch {
      console.error(`Error: Neither ${SOURCE_INPUT} nor ${BACKUP_INPUT} exists.`);
      process.exit(1);
    }
  }

  // Preserve backup of original upload
  let backupExists = false;
  try {
    await fs.access(BACKUP_INPUT);
    backupExists = true;
  } catch {
    backupExists = false;
  }

  if (!backupExists) {
    console.log(`Backing up original image to ${path.relative(ROOT_DIR, BACKUP_INPUT)}...`);
    await fs.copyFile(SOURCE_INPUT, BACKUP_INPUT);
  }

  // Always read from backup input to guarantee idempotency
  const inputBuffer = await fs.readFile(BACKUP_INPUT);
  const meta = await sharp(inputBuffer).metadata();
  console.log(`Original dimensions: ${meta.width}x${meta.height}, format: ${meta.format}`);

  // 2. Sample corner pixels to detect exact background color
  const sample = await sharp(inputBuffer)
    .extract({
      left: Math.min(8, meta.width - 1),
      top: Math.min(8, meta.height - 1),
      width: 1,
      height: 1,
    })
    .raw()
    .toBuffer();

  const bgR = sample[0];
  const bgG = sample[1];
  const bgB = sample[2];
  const bgHex =
    '#' +
    [bgR, bgG, bgB]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('');
  console.log(`Detected background color: rgb(${bgR}, ${bgG}, ${bgB}) (${bgHex})`);

  // 3. Trim outer blank/padding background
  const trimmedBuffer = await sharp(inputBuffer)
    .trim({ threshold: 18 })
    .toBuffer();

  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  console.log(`Trimmed emblem dimensions: ${trimmedMeta.width}x${trimmedMeta.height}`);

  await fs.mkdir(ICONS_DIR, { recursive: true });

  // 4. Generate standard 512x512 badge (emblem centered in ~390px, ~14% safe margin)
  const emblemFor512 = await sharp(trimmedBuffer)
    .resize({ width: 390, height: 390, fit: 'inside' })
    .toBuffer();

  const badge512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: bgR, g: bgG, b: bgB, alpha: 1 },
    },
  })
    .composite([{ input: emblemFor512, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  // Save main logo and icon-512
  const mainLogoPath = path.join(PUBLIC_DIR, 'fn-logo.png');
  const icon512Path = path.join(ICONS_DIR, 'icon-512.png');
  await fs.writeFile(mainLogoPath, badge512);
  await fs.writeFile(icon512Path, badge512);
  console.log(`Generated: ${path.relative(ROOT_DIR, mainLogoPath)} (512x512)`);
  console.log(`Generated: ${path.relative(ROOT_DIR, icon512Path)} (512x512)`);

  // 5. Generate 192x192 icon
  const icon192 = await sharp(badge512)
    .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const icon192Path = path.join(ICONS_DIR, 'icon-192.png');
  await fs.writeFile(icon192Path, icon192);
  console.log(`Generated: ${path.relative(ROOT_DIR, icon192Path)} (192x192)`);

  // 6. Generate Apple touch icon (180x180)
  const appleTouch = await sharp(badge512)
    .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const appleTouchRootPath = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
  const appleTouchIconsPath = path.join(ICONS_DIR, 'apple-touch-icon.png');
  await fs.writeFile(appleTouchRootPath, appleTouch);
  await fs.writeFile(appleTouchIconsPath, appleTouch);
  console.log(`Generated: ${path.relative(ROOT_DIR, appleTouchRootPath)} (180x180)`);

  // 7. Generate PWA Maskable 512x512 icon (central safe area is 60% circle => ~307px diameter)
  const emblemForMaskable = await sharp(trimmedBuffer)
    .resize({ width: 300, height: 300, fit: 'inside' })
    .toBuffer();

  const maskable512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: bgR, g: bgG, b: bgB, alpha: 1 },
    },
  })
    .composite([{ input: emblemForMaskable, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  const maskablePath = path.join(ICONS_DIR, 'icon-maskable-512.png');
  await fs.writeFile(maskablePath, maskable512);
  console.log(`Generated: ${path.relative(ROOT_DIR, maskablePath)} (512x512 maskable)`);

  // 8. Generate transparent cutout (alpha feathering on background color)
  const { data, info } = await sharp(trimmedBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
    );

    if (dist < 18) {
      data[i + 3] = 0;
    } else if (dist < 42) {
      const factor = (dist - 18) / 24;
      data[i + 3] = Math.round(data[i + 3] * factor);
    }
  }

  const transparentEmblem = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  const transparent512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(transparentEmblem)
          .resize({ width: 390, height: 390, fit: 'inside' })
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  const transparentPath = path.join(PUBLIC_DIR, 'fn-logo-transparent.png');
  await fs.writeFile(transparentPath, transparent512);
  console.log(`Generated: ${path.relative(ROOT_DIR, transparentPath)} (512x512 transparent)`);

  // 9. Generate crisp icon.svg embedding the high-res 512x512 icon
  const base64Png = badge512.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="Fair Nigeria">
  <rect width="512" height="512" rx="112" fill="${bgHex}"/>
  <image href="data:image/png;base64,${base64Png}" width="512" height="512" />
</svg>
`;
  const svgPath = path.join(ICONS_DIR, 'icon.svg');
  await fs.writeFile(svgPath, svgContent, 'utf-8');
  console.log(`Generated: ${path.relative(ROOT_DIR, svgPath)} (SVG)`);

  console.log('All icons and logos generated successfully.');
}

run().catch((err) => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
