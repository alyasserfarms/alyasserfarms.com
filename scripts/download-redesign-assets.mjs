import { readFile, writeFile } from 'node:fs/promises';

// Selected Pexels stock photography, explicitly not documentation of the client.
const additions = [
  { name: 'harvest', id: '7658789', title: 'A person holding a basket of vegetables', source: 'https://www.pexels.com/photo/a-person-holding-a-basket-of-vegetables-7658789/' },
  { name: 'basket', id: '7658815', title: 'A close-up shot of a basket of vegetables', source: 'https://www.pexels.com/photo/a-close-up-shot-of-a-basket-of-vegetables-7658815/' },
];
const credits = JSON.parse(await readFile('public/media/credits.json', 'utf8'));
for (const item of additions) {
  const response = await fetch(`https://images.pexels.com/photos/${item.id}/pexels-photo-${item.id}.jpeg?auto=compress&cs=tinysrgb&w=1600`);
  if (!response.ok) throw Error(`${item.name}: HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(`public/media/${item.name}.jpg`, buffer);
  const credit = { file: `${item.name}.jpg`, creator: 'Kampus Production', title: item.title, source: item.source, license: 'Pexels License', licenseUrl: 'https://www.pexels.com/license/', use: 'Representative demo photography; not the client, their staff, their farms, or their actual products' };
  const index = credits.findIndex((entry) => entry.file === credit.file);
  if (index >= 0) credits[index] = credit; else credits.push(credit);
  console.log(`${item.name}: ${Math.round(buffer.length / 1024)} KB`);
}
await writeFile('public/media/credits.json', JSON.stringify(credits, null, 2) + '\n');
