import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';

const out = 'docs/redesign';
mkdirSync(out, { recursive: true });
const browser = await Browser.launch();
const checks = [];
function check(name, value, expected = true) { assert.deepEqual(value, expected, name); checks.push({ name, passed: true }); }
async function move(page, selector, index = 0, click = false) {
  const point = await page.eval(({ selector, index }) => { const r = document.querySelectorAll(selector)[index].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, { selector, index });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  if (click) {
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  }
  await sleep(600);
}
try {
  const page = await browser.newPage({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:3001', { settleMs: 1700 });
  check('Display font is downloaded and ready', await page.eval(() => document.fonts.status === 'loaded' && document.fonts.check('700 100px ' + getComputedStyle(document.querySelector('h1')).fontFamily.split(',')[0])));
  check('Pause control is not covered by the photographic print', await page.eval(() => { const a = document.querySelector('.gate-detail').getBoundingClientRect(); const b = document.querySelector('.video-toggle').getBoundingClientRect(); return !(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top); }));
  await page.screenshot({ path: `${out}/desktop-hero.jpg` });
  await page.eval(() => document.getElementById('categories').scrollIntoView({ behavior: 'instant' }));
  await move(page, '.living-category-link', 3);
  check('Pointer movement previews the fruit photograph', await page.eval(() => document.querySelector('.living-category-image.is-current img').alt.includes('الفواكه')));
  await page.screenshot({ path: `${out}/desktop-category-fruit.jpg` });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 10, y: 110 });
  await page.eval(() => document.querySelectorAll('.living-category-link')[1].focus());
  await sleep(600);
  check('Keyboard focus previews poultry without requiring hover', await page.eval(() => document.querySelector('.living-category-image.is-current img').alt.includes('الدواجن')));
  check('Only the previewed photograph is exposed to accessibility', await page.eval(() => document.querySelectorAll('.living-category-image[aria-hidden="false"]').length), 1);
  await move(page, '.living-category-link', 0, true);
  check('Selecting a category changes the featured catalogue', await page.eval(() => document.querySelector('.product-filters button[aria-pressed="true"]').textContent), 'اللحوم');
  check('Selected category returns matching products', await page.eval(() => document.querySelectorAll('.product-grid .product').length), 1);
  await page.eval(() => document.querySelector('.product-filters button').click());
  await sleep(100);
  for (const width of [1440, 768, 390, 320]) {
    const height = width < 600 ? 844 : 900;
    await page.setViewport({ width, height, mobile: width < 600 });
    await page.eval(() => { document.activeElement.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
    await sleep(250);
    check(`Home reflows without horizontal overflow at ${width}`, await page.eval(() => document.documentElement.scrollWidth <= innerWidth));
    check(`Video control remains clear of the photographic print at ${width}`, await page.eval(() => { const a = document.querySelector('.gate-detail').getBoundingClientRect(); const b = document.querySelector('.video-toggle').getBoundingClientRect(); return !(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top); }));
    check(`Header actions meet 44px targets at ${width}`, await page.eval(() => [...document.querySelectorAll('.header-actions button')].filter(b => b.getBoundingClientRect().width > 0).every(b => { const r = b.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; })));
    if (width === 390) check('The primary store action is visible in the first mobile screen', await page.eval(() => { const r = document.querySelector('.gate-copy > .button').getBoundingClientRect(); return r.bottom <= innerHeight && r.top > 0; }));
    await page.screenshot({ path: `${out}/hero-${width}.jpg` });
    if (width < 600) {
      await page.eval(() => { document.querySelector('.hero video').pause(); document.querySelector('.living-intro').scrollIntoView({ behavior: 'instant' }); });
      await sleep(250);
      check(`Intro caption is not covered by its inset photograph at ${width}`, await page.eval(() => { const a = document.querySelector('.intro-main figcaption').getBoundingClientRect(); const b = document.querySelector('.intro-inset .photo').getBoundingClientRect(); return a.left >= b.right + 8; }));
      await page.screenshot({ path: `${out}/intro-${width}.jpg` });
    }
    if (width === 1440 || width === 390) {
      const geometry = await page.eval(() => { const s = document.querySelector('.origin-scene'); const stage = document.querySelector('.origin-stage'); return { top: s.getBoundingClientRect().top + scrollY, height: s.offsetHeight, stage: stage.offsetHeight, inset: parseFloat(getComputedStyle(stage).top) }; });
      const frames = [];
      const hold = geometry.height - geometry.stage - geometry.inset;
      for (const [label, offset] of [['earth', -geometry.inset], ['transition', hold * .4], ['table', hold * .96]]) {
        await page.eval(top => window.scrollTo({ top, behavior: 'instant' }), geometry.top + offset);
        await sleep(350);
        frames.push(await page.eval(() => { const title = document.getElementById('story-title').getBoundingClientRect(); return { titleTop: title.top, titleBottom: title.bottom, harvestOpacity: Number(getComputedStyle(document.querySelector('.origin-harvest')).opacity) }; }));
        await page.screenshot({ path: `${out}/story-${width}-${label}.jpg` });
      }
      check(`Story begins with the land photograph at ${width}`, frames[0].harvestOpacity < .05);
      check(`Story reaches its harvest photograph at ${width}`, frames[2].harvestOpacity > .95);
      check(`Story title stays readable and in place at ${width}`, frames.every(f => f.titleTop >= geometry.inset && f.titleBottom < height) && Math.abs(frames[0].titleTop - frames[2].titleTop) < 3);
    }
  }
  const reduced = await browser.newPage({ width: 390, height: 844, mobile: true, reducedMotion: true });
  await reduced.goto('http://127.0.0.1:3001', { settleMs: 2200 });
  check('Reduced motion avoids downloading the decorative video', await reduced.eval(() => !document.querySelector('.hero video').getAttribute('src')));
  check('Reduced motion cancels the title entrance', await reduced.eval(() => getComputedStyle(document.querySelector('h1 span')).animationName), 'none');
  check('Reduced motion releases the sticky story', await reduced.eval(() => getComputedStyle(document.querySelector('.origin-stage')).position), 'relative');
  await reduced.eval(() => document.querySelector('.origin-scene').scrollIntoView({ behavior: 'instant' }));
  await sleep(200);
  await reduced.screenshot({ path: `${out}/story-mobile-reduced.jpg` });
  check('No browser exceptions in the interactive page', page.consoleErrors, []);
  check('No browser exceptions with reduced motion', reduced.consoleErrors, []);
  writeFileSync(`${out}/checks.json`, JSON.stringify({ timestamp: new Date().toISOString(), checks }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, output: `${out}/checks.json` }, null, 2));
} finally { await browser.close(); }
