import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

async function generateFavicons() {
  const brandDir = path.join(process.cwd(), "public", "brand");
  const files = fs.readdirSync(brandDir);
  const iconFile = files.find(f => f.includes("05"));
  if (!iconFile) throw new Error("Could not find brand icon 05");

  const srcPath = path.join(brandDir, iconFile);
  console.log("Using source image:", iconFile);

  const sizes = [16, 32, 48, 96, 180, 192, 512];
  const pngBuffers = {};

  for (const s of sizes) {
    pngBuffers[s] = await sharp(srcPath)
      .resize(s, s, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  // Build ICO from 16, 32, 48
  const icoSizes = [16, 32, 48];
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(icoSizes.length, 4); // count

  const dirEntries = [];
  let currentOffset = 6 + 16 * icoSizes.length;

  for (const s of icoSizes) {
    const buf = pngBuffers[s];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(s === 256 ? 0 : s, 0); // width
    entry.writeUInt8(s === 256 ? 0 : s, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(buf.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset
    dirEntries.push(entry);
    currentOffset += buf.length;
  }

  const icoBuffer = Buffer.concat([
    header,
    ...dirEntries,
    ...icoSizes.map(s => pngBuffers[s])
  ]);

  // Destination folders
  const publicDir = path.join(process.cwd(), "public");
  const appDir = path.join(process.cwd(), "src", "app");

  // Write to public/
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(publicDir, "icon.png"), pngBuffers[512]);
  fs.writeFileSync(path.join(publicDir, "icon-48.png"), pngBuffers[48]);
  fs.writeFileSync(path.join(publicDir, "icon-96.png"), pngBuffers[96]);
  fs.writeFileSync(path.join(publicDir, "icon-192.png"), pngBuffers[192]);
  fs.writeFileSync(path.join(publicDir, "icon-512.png"), pngBuffers[512]);
  fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), pngBuffers[180]);
  fs.writeFileSync(path.join(publicDir, "apple-icon.png"), pngBuffers[180]);

  // Write to src/app/ (Next.js App Router conventions)
  fs.writeFileSync(path.join(appDir, "favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(appDir, "icon.png"), pngBuffers[512]);
  fs.writeFileSync(path.join(appDir, "apple-icon.png"), pngBuffers[180]);

  console.log("Successfully generated all favicon and icon files in public/ and src/app/!");
}

generateFavicons().catch(console.error);
