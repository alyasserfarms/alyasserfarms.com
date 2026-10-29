import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const out = 'docs/harvest-home';
mkdirSync(out, { recursive: true });
const results = [];
const check = (name, value) => { assert.ok(value, name); results.push({ name, passed: true }); };
const browser = await Browser.launch();
try {
 const page = await browser.newPage({ width: 1440, height: 900 });
 await page.goto('http://127.0.0.1:3001', { settleMs: 1800 });
 check('Six visible photographic category links', await page.eval(() => document.querySelectorAll('.harvest-category').length === 6));
 check('One headline, Arabic and RTL', await page.eval(() => document.querySelectorAll('h1').length === 1 && document.documentElement.dir === 'rtl' && document.documentElement.lang === 'ar'));
 for (const width of [1440, 768, 390, 320]) {
   await page.setViewport({ width, height: width < 700 ? 844 : 900, mobile: width < 700 });
   for (const id of ['about', 'categories', 'products', 'story', 'season', 'films', 'delivery', 'contact']) {
     await page.eval(id => document.getElementById(id).scrollIntoView({ behavior: 'instant', block: 'start' }), id);
     await sleep(1100);
     for (let attempt = 0; attempt < 25; attempt++) {
       const ready = await page.eval(id => [...document.getElementById(id).querySelectorAll('img')].filter(img => { const r = img.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }).every(img => img.complete && img.naturalWidth > 0), id);
       if (ready) break;
       await sleep(200);
     }
     check(`${id}: no horizontal overflow at ${width}`, await page.eval(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
     check(`${id}: images render at ${width}`, await page.eval(id => [...document.getElementById(id).querySelectorAll('img')].filter(img => { const r = img.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }).every(img => img.complete && img.naturalWidth > 0), id));
     if (width === 1440 || width === 390) await page.screenshot({ path: `${out}/${id}-${width}.jpg` });
   }
 }
 await page.setViewport({ width: 390, height: 844, mobile: true });
 await page.eval(() => document.querySelector('.harvest-category[href="#products"]').click()); await sleep(1000);
 check('Category selects matching products', await page.eval(() => document.querySelector('.product-filters button[aria-pressed="true"]').textContent === 'اللحوم' && document.querySelectorAll('.product-grid .product').length === 1));
 await page.eval(() => document.querySelector('.product-filters button').click()); await sleep(100);
 check('All products reset', await page.eval(() => document.querySelectorAll('.product-grid .product').length === 4));
 await page.eval(() => document.querySelector('.product-photo-button').click());
 check('Product details open', await page.eval(() => !!document.querySelector('dialog[open] .product-detail')));
 await page.eval(() => document.querySelector('dialog[open] .product-detail .button').click()); await sleep(150);
 check('Product adds to cart', await page.eval(() => /[1١]/.test(document.querySelector('.cart-count').textContent)));
 await page.eval(() => document.querySelector('.cart-button').click());
 check('Cart contains chosen item', await page.eval(() => !!document.querySelector('dialog[open] .cart-items li')));
 await page.eval(() => document.querySelector('dialog[open] .modal-heading button').click());
 const top = await page.eval(() => document.getElementById('season').offsetTop);
 await page.eval(top => window.scrollTo({ top: top - 500, behavior: 'instant' }), top); await sleep(1200);
 const before = await page.eval(() => { const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.harvest-season-seal')).transform); return Math.atan2(m.b, m.a); });
 await page.eval(top => window.scrollTo({ top: top + 300, behavior: 'instant' }), top); await sleep(1200);
 const after = await page.eval(() => { const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.harvest-season-seal')).transform); return Math.atan2(m.b, m.a); });
 check('Season scene responds to downward scrolling', Math.abs(before - after) > .02);
 await page.eval(top => window.scrollTo({ top: top - 500, behavior: 'instant' }), top); await sleep(1300);
 const returned = await page.eval(() => { const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.harvest-season-seal')).transform); return Math.atan2(m.b, m.a); });
 check('Season scene reverses when scrolling upward', Math.abs(returned - before) < .02);
 await page.eval(() => document.getElementById('films').scrollIntoView({ behavior: 'instant', block: 'start' })); await sleep(200);
 check('Film stays unloaded until requested', await page.eval(() => !document.querySelector('.harvest-cinema video').getAttribute('src')));
 await page.eval(() => document.querySelector('.harvest-cinema .film-play').click()); await sleep(800);
 check('Film plays on request', await page.eval(() => !document.querySelector('.harvest-cinema video').paused));
 await page.eval(() => document.querySelector('.harvest-cinema video').pause());
 const reduced = await browser.newPage({ width: 390, height: 844, mobile: true, reducedMotion: true });
 await reduced.goto('http://127.0.0.1:3001', { settleMs: 1300 });
 check('Reduced motion skips hero video', await reduced.eval(() => !document.querySelector('.reference-hero video').getAttribute('src')));
 await reduced.eval(() => document.getElementById('season').scrollIntoView({ behavior: 'instant' })); await sleep(300);
 check('Reduced motion disables seasonal transforms', await reduced.eval(() => getComputedStyle(document.querySelector('.harvest-season-detail')).transform === 'none'));
 await reduced.screenshot({ path: `${out}/reduced-390.jpg` });
 check('No uncaught browser exceptions', page.consoleErrors.length === 0 && reduced.consoleErrors.length === 0);
 writeFileSync(`${out}/checks.json`, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
 console.log(JSON.stringify({ passed: results.length, output: out }));
} finally { await browser.close(); }
