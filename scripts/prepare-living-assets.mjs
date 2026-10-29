import sharp from 'sharp';
import { existsSync } from 'node:fs';
const sizes = {
  'living-market': 1800, 'living-eid': 1800, 'living-wholesale': 1800,
  'living-about': 1100, 'living-location': 1000,
  'product-tomatoes': 600, 'product-cucumber': 600, 'product-oranges': 600,
};
for (const [name, width] of Object.entries(sizes)) {
  const source = `public/media/${name}.png`;
  if (!existsSync(source)) continue;
  const result = await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toFile(`public/media/${name}.webp`);
  console.log(`${name}: ${Math.round(result.size / 1024)}KB`);
}
if (existsSync('public/media/living-wave.png')) {
  const result = await sharp('public/media/living-wave.png').trim().webp({ quality: 90 }).toFile('public/media/living-wave.webp');
  console.log(`wave: ${result.width}x${result.height}, ${Math.round(result.size / 1024)}KB`);
}
