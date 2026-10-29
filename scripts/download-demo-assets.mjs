import { mkdir, writeFile } from 'node:fs/promises';

// Explicitly selected licensed stock assets. These do not document the client's farms.
const images = [
  ['harvest', 'https://images.pexels.com/photos/7658789/pexels-photo-7658789.jpeg?auto=compress&cs=tinysrgb&w=1600', 'Kampus Production', 'A person holding a basket of vegetables', 'https://www.pexels.com/photo/a-person-holding-a-basket-of-vegetables-7658789/'],
  ['basket', 'https://images.pexels.com/photos/7658815/pexels-photo-7658815.jpeg?auto=compress&cs=tinysrgb&w=1600', 'Kampus Production', 'A close-up shot of a basket of vegetables', 'https://www.pexels.com/photo/a-close-up-shot-of-a-basket-of-vegetables-7658815/'],
  ['hero', 'https://images.pexels.com/videos/4791868/dron-dron-video-palms-4791868.jpeg?auto=compress&cs=tinysrgb&w=1920', 'Rulo Davila', 'Aerial view of palm trees', 'https://www.pexels.com/video/aerial-view-of-palm-trees-4791868/'],
  ['fields', 'https://images.unsplash.com/photo-1606445095898-16c730da5732?auto=format&fit=crop&w=1600&q=85', 'Matthew De Zen', 'Rice farm near Puerto Princesa', 'https://unsplash.com/photos/z_CaJXLGw54'],
  ['vegetables', 'https://images.pexels.com/photos/36936000/pexels-photo-36936000.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Yuliia Laptieva', 'Fresh vegetables including tomatoes and lettuce', 'https://www.pexels.com/photo/36936000/'],
  ['tomatoes', 'https://images.pexels.com/photos/13981434/pexels-photo-13981434.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Engin Akyurt', 'Red tomatoes and fresh vegetables', 'https://www.pexels.com/photo/13981434/'],
  ['beef', 'https://images.pexels.com/photos/5313882/pexels-photo-5313882.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Javon Swaby', 'Raw meat on brown wooden chopping board', 'https://www.pexels.com/photo/5313882/'],
  ['chicken', 'https://images.pexels.com/photos/6107734/pexels-photo-6107734.jpeg?auto=compress&cs=tinysrgb&w=1200', 'alleksana', 'Close-up photo of raw chicken meat', 'https://www.pexels.com/photo/6107734/'],
  ['oranges', 'https://images.pexels.com/photos/3903202/pexels-photo-3903202.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Dmitry Demidov', 'Close-up photo of orange fruits', 'https://www.pexels.com/photo/3903202/'],
  ['milk', 'https://images.pexels.com/photos/5946733/pexels-photo-5946733.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Charlotte May', 'Bottle and glass of milk on desk', 'https://www.pexels.com/photo/5946733/'],
  ['dates', 'https://images.pexels.com/photos/15707374/pexels-photo-15707374.jpeg?auto=compress&cs=tinysrgb&w=1200', 'hello aesthe', 'A bowl with dried dates', 'https://www.pexels.com/photo/15707374/'],
];
await mkdir('public/media', { recursive: true });
const credits = [];
for (const [name, url, creator, title, source] of images) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(`public/media/${name}.jpg`, buffer);
  credits.push({ file: `${name}.jpg`, creator, title, source, license: name === 'fields' ? 'Unsplash License' : 'Pexels License', licenseUrl: name === 'fields' ? 'https://unsplash.com/license' : 'https://www.pexels.com/license/', use: 'Representative demo media; not client documentation' });
  console.log(`${name}: ${Math.round(buffer.length / 1024)} KB`);
}
const videoUrl = 'https://videos.pexels.com/video-files/4791868/4791868-hd_1280_720_30fps.mp4';
let video = await fetch(videoUrl);
if (!video.ok) video = await fetch('https://videos.pexels.com/video-files/4791868/4791868-uhd_2560_1440_30fps.mp4');
if (!video.ok) throw new Error(`video: HTTP ${video.status}`);
const videoBuffer = Buffer.from(await video.arrayBuffer());
await writeFile('public/media/palms-original.mp4', videoBuffer);
credits.push({ file: 'palms.mp4', creator: 'Rulo Davila', title: 'Aerial view of palm trees', source: 'https://www.pexels.com/video/aerial-view-of-palm-trees-4791868/', license: 'Pexels License', licenseUrl: 'https://www.pexels.com/license/', use: 'Shortened and compressed representative stock video; not client documentation' });
await writeFile('public/media/credits.json', JSON.stringify(credits, null, 2));
console.log(`video: ${Math.round(videoBuffer.length / 1024)} KB`);
